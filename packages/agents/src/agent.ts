import type { ChatMessage, ChatModel, ModelToolCall } from "@glydexstudio/axiom-core";
import { ModelError, ToolLoopError } from "@glydexstudio/axiom-core";
import type { ToolPermission, ToolRegistry } from "@glydexstudio/axiom-tools";
import type { AgentOptions, AgentPlanStep, AgentResult } from "./types.js";

export class AgentRunner {
  private readonly model: ChatModel;
  private readonly tools: ToolRegistry;
  private readonly permissions: ReadonlySet<ToolPermission>;
  private readonly maxSteps: number;
  private readonly systemPrompt?: string;

  constructor(options: AgentOptions) {
    this.model = options.model;
    this.tools = options.tools;
    this.permissions = options.permissions ?? new Set<ToolPermission>();
    this.maxSteps = options.maxSteps ?? 12;
    if (this.maxSteps <= 0) throw new RangeError("maxSteps must be greater than zero.");
    this.systemPrompt = options.systemPrompt;
  }

  async run(goal: string, options: { signal?: AbortSignal } = {}): Promise<AgentResult> {
    if (!goal.trim()) throw new TypeError("Agent goal cannot be empty.");
    const messages: ChatMessage[] = [];
    if (this.systemPrompt) messages.push({ role: "system", content: this.systemPrompt });
    messages.push({ role: "user", content: goal });
    const steps: AgentPlanStep[] = [];
    const observations: ChatMessage[] = [];

    for (let iteration = 0; iteration < this.maxSteps; iteration += 1) {
      const response = await this.model.generate({
        messages,
        tools: this.tools.list().map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema })),
        signal: options.signal
      });
      const assistantMessage: ChatMessage = response.toolCalls.length > 0 ? { ...response.message, toolCalls: response.toolCalls } : response.message;
      messages.push(assistantMessage);
      observations.push(assistantMessage);

      if (response.toolCalls.length === 0) return { text: response.message.content, steps, observations };
      for (const call of response.toolCalls) {
        const step = toStep(call, iteration);
        steps.push(step);
        if (steps.length > this.maxSteps) throw new ToolLoopError(`Agent exceeded the configured step limit of ${this.maxSteps}.`);
        const result = await this.tools.execute(call.name, call.input, { permissions: this.permissions, signal: options.signal });
        const content = result.ok ? JSON.stringify(result.value) : JSON.stringify(result.error);
        const observation: ChatMessage = { role: "tool", name: call.name, toolCallId: call.id, content };
        messages.push(observation);
        observations.push(observation);
      }
    }
    throw new ToolLoopError(`Agent reached its maximum of ${this.maxSteps} steps without a final response.`);
  }
}

function toStep(call: ModelToolCall, iteration: number): AgentPlanStep {
  return { id: `${iteration + 1}-${call.id}`, description: `Invoke ${call.name}`, toolName: call.name, input: call.input };
}

export function assertAgentModel(model: ChatModel): void {
  if (!model.generate) throw new ModelError("Agent model must implement generate().");
}
