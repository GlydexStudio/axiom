import type { MemoryStore } from "@glydexstudio/axiom-memory";
import type { ToolRegistry, ToolPermission } from "@glydexstudio/axiom-tools";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ModelToolCall[];
}

export interface ModelToolDefinition {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface ModelToolCall {
  id: string;
  name: string;
  input: unknown;
  providerData?: Record<string, unknown>;
}

export interface ModelRequest {
  messages: ChatMessage[];
  tools?: ModelToolDefinition[];
  responseFormat?: "text" | "json";
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ModelResponse {
  message: ChatMessage;
  toolCalls: ModelToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "unknown";
  raw?: unknown;
}

export interface ModelStreamEvent {
  type: "text_delta" | "tool_call_delta" | "done";
  text?: string;
  toolCall?: Partial<ModelToolCall> & { index?: number };
}

export interface ChatModel {
  readonly provider: string;
  readonly model: string;
  generate(request: ModelRequest): Promise<ModelResponse>;
  stream?(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
}

export interface AxiomConfig {
  model: ChatModel;
  memory?: MemoryStore;
  tools?: ToolRegistry;
  systemPrompt?: string;
  namespace?: string;
  conversationId?: string;
  maxToolRounds?: number;
  toolPermissions?: ReadonlySet<ToolPermission>;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface RunOptions {
  namespace?: string;
  conversationId?: string;
  systemPrompt?: string;
  maxToolRounds?: number;
  toolPermissions?: ReadonlySet<ToolPermission>;
  signal?: AbortSignal;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface RunResult {
  text: string;
  messages: ChatMessage[];
  toolCalls: ModelToolCall[];
}

export interface AxiomEventMap {
  "run:start": { input: string; conversationId: string };
  "run:finish": { output: string; conversationId: string };
  "tool:start": { name: string; callId: string };
  "tool:finish": { name: string; callId: string; ok: boolean };
  "error": { error: Error };
}

export interface AxiomPluginContext {
  tools: ToolRegistry;
  on: <K extends keyof AxiomEventMap>(event: K, listener: (payload: AxiomEventMap[K]) => void) => () => void;
  getConfig: () => Readonly<AxiomConfig>;
}

export interface AxiomPlugin {
  name: string;
  version: string;
  install: (context: AxiomPluginContext) => void | Promise<void>;
}
