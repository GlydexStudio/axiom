import type { MemoryMessage, MemoryStore } from "@glydexstudio/axiom-memory";
import { ToolRegistry } from "@glydexstudio/axiom-tools";
import type { ToolPermission } from "@glydexstudio/axiom-tools";
import { EventBus } from "./events.js";
import { ModelError, ToolLoopError } from "./errors.js";
import type { AxiomConfig, AxiomEventMap, AxiomPlugin, AxiomPluginContext, ChatMessage, ModelToolDefinition, RunOptions, RunResult } from "./types.js";

const defaultMemoryNamespace = "default";

export class Axiom {
  readonly events = new EventBus();
  readonly tools: ToolRegistry;
  readonly memory?: MemoryStore;
  readonly model: AxiomConfig["model"];

  private readonly config: AxiomConfig;

  constructor(config: AxiomConfig) {
    this.config = { ...config };
    this.model = config.model;
    this.tools = config.tools ?? new ToolRegistry();
    this.memory = config.memory;
  }

  async use(plugin: AxiomPlugin): Promise<void> {
    const context: AxiomPluginContext = {
      tools: this.tools,
      on: (event, listener) => this.events.on(event, listener),
      getConfig: () => this.config
    };
    await plugin.install(context);
  }

  on<K extends keyof AxiomEventMap>(event: K, listener: (payload: AxiomEventMap[K]) => void): () => void {
    return this.events.on(event, listener);
  }

  async run(input: string, options: RunOptions = {}): Promise<RunResult> {
    if (!input.trim()) throw new TypeError("AXIOM input cannot be empty.");
    const namespace = options.namespace ?? this.config.namespace ?? defaultMemoryNamespace;
    const conversationId = options.conversationId ?? this.config.conversationId ?? createId();
    const maxToolRounds = options.maxToolRounds ?? this.config.maxToolRounds ?? 8;
    const permissions = options.toolPermissions ?? this.config.toolPermissions ?? new Set<ToolPermission>();
    const metadata = options.metadata ?? this.config.metadata ?? {};
    const messages = await this.loadMessages(namespace, conversationId);
    const systemPrompt = options.systemPrompt ?? this.config.systemPrompt;
    const workingMessages: ChatMessage[] = [];
    if (systemPrompt) workingMessages.push({ role: "system", content: systemPrompt });
    workingMessages.push(...messages.map(toChatMessage), { role: "user", content: input });

    this.events.emit("run:start", { input, conversationId });
    await this.persistMessage(namespace, conversationId, { role: "user", content: input }, metadata);

    const allToolCalls = [] as Array<{ id: string; name: string; input: unknown }>;
    let rounds = 0;
    try {
      while (true) {
        const response = await this.model.generate({
          messages: workingMessages,
          tools: this.toolDefinitions(),
          signal: options.signal
        });
        if (!response.message.content && response.toolCalls.length === 0) throw new ModelError("Model returned an empty response without tool calls.");
        const assistantMessage: ChatMessage = response.toolCalls.length > 0 ? { ...response.message, toolCalls: response.toolCalls } : response.message;
        if (assistantMessage.content || assistantMessage.toolCalls?.length) {
          workingMessages.push(assistantMessage);
          if (assistantMessage.toolCalls?.length) await this.persistMessage(namespace, conversationId, assistantMessage, metadata, assistantMessage.toolCalls);
        }

        if (response.toolCalls.length === 0) {
          await this.persistMessage(namespace, conversationId, { role: "assistant", content: response.message.content }, metadata);
          this.events.emit("run:finish", { output: response.message.content, conversationId });
          return { text: response.message.content, messages: [...workingMessages], toolCalls: allToolCalls };
        }

        rounds += 1;
        if (rounds > maxToolRounds) throw new ToolLoopError(`Tool execution exceeded the configured limit of ${maxToolRounds} rounds.`);
        for (const call of response.toolCalls) {
          allToolCalls.push(call);
          this.events.emit("tool:start", { name: call.name, callId: call.id });
          const result = await this.tools.execute(call.name, call.input, { permissions, signal: options.signal, metadata });
          this.events.emit("tool:finish", { name: call.name, callId: call.id, ok: result.ok });
          const content = result.ok ? JSON.stringify(result.value) : JSON.stringify({ error: result.error.message, code: result.error.code });
          const toolMessage: ChatMessage = { role: "tool", content, toolCallId: call.id, name: call.name };
          workingMessages.push(toolMessage);
          await this.persistMessage(namespace, conversationId, toolMessage, metadata);
        }
      }
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      this.events.emit("error", { error: normalized });
      throw normalized;
    }
  }

  stream(input: string, options: RunOptions = {}): AsyncIterable<import("./types.js").ModelStreamEvent> {
    if (!input.trim()) throw new TypeError("AXIOM input cannot be empty.");
    if (!this.model.stream) throw new ModelError(`Model provider "${this.model.provider}" does not implement streaming.`);
    const namespace = options.namespace ?? this.config.namespace ?? defaultMemoryNamespace;
    const conversationId = options.conversationId ?? this.config.conversationId ?? createId();
    const historyPromise = this.loadMessages(namespace, conversationId);
    const systemPrompt = options.systemPrompt ?? this.config.systemPrompt;
    return this.createStream(historyPromise, input, systemPrompt, options.signal);
  }

  private async *createStream(historyPromise: Promise<MemoryMessage[]>, input: string, systemPrompt: string | undefined, signal?: AbortSignal): AsyncIterable<import("./types.js").ModelStreamEvent> {
    const history = await historyPromise;
    const messages: ChatMessage[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push(...history.map(toChatMessage), { role: "user", content: input });
    const stream = this.model.stream?.({ messages, tools: this.toolDefinitions(), signal });
    if (!stream) throw new ModelError(`Model provider "${this.model.provider}" does not implement streaming.`);
    for await (const event of stream) yield event;
  }

  private toolDefinitions(): ModelToolDefinition[] {
    return this.tools.list().map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));
  }

  private async loadMessages(namespace: string, conversationId: string): Promise<MemoryMessage[]> {
    return this.memory ? this.memory.list({ namespace, conversationId }) : [];
  }

  private async persistMessage(namespace: string, conversationId: string, message: Pick<ChatMessage, "role" | "content" | "name" | "toolCallId" | "toolCalls">, metadata: Readonly<Record<string, unknown>>, toolCalls?: Array<{ id: string; name: string; input: unknown }>): Promise<void> {
    if (!this.memory) return;
    await this.memory.add({ id: createId(), namespace, conversationId, role: message.role, content: message.content, name: message.name, toolCallId: message.toolCallId, toolCalls, metadata: { ...metadata }, createdAt: Date.now() });
  }
}

function toChatMessage(message: MemoryMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content,
    name: message.name,
    toolCallId: message.toolCallId,
    toolCalls: message.toolCalls
  };
}

let idCounter = 0;
function createId(): string {
  const randomUuid = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : undefined;
  if (randomUuid) return randomUuid;
  idCounter += 1;
  return `axiom-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}
