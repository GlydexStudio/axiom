import type { ChatMessage, ChatModel, ModelRequest, ModelResponse } from "@glydexstudio/axiom-core";
import { ModelError } from "@glydexstudio/axiom-core";

export interface OllamaOptions {
  baseUrl?: string;
  model: string;
  fetch?: typeof globalThis.fetch;
}

export class OllamaProvider implements ChatModel {
  readonly provider = "ollama";
  readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: OllamaOptions) {
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, messages: request.messages.map(toOllamaMessage), ...(request.tools?.length ? { tools: request.tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })) } : {}), ...(request.responseFormat === "json" ? { format: "json" } : {}), stream: false }),
      signal: request.signal
    });
    if (!response.ok) throw new ModelError(`Ollama request failed with HTTP ${response.status}.`);
    const data: any = await response.json();
    const content = typeof data?.message?.content === "string" ? data.message.content : "";
    const toolCalls = Array.isArray(data?.message?.tool_calls) ? data.message.tool_calls.flatMap((call: any, index: number) => {
      const name = typeof call?.function?.name === "string" ? call.function.name : "";
      if (!name) return [];
      return [{ id: typeof call?.id === "string" ? call.id : `ollama-call-${Date.now()}-${index}`, name, input: call?.function?.arguments ?? {} }];
    }) : [];
    return { message: { role: "assistant", content }, toolCalls, finishReason: toolCalls.length ? "tool_calls" : "stop", raw: data };
  }
}

function toOllamaMessage(message: ChatMessage): Record<string, unknown> {
  return {
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
    ...(message.toolCalls && message.toolCalls.length > 0 ? { tool_calls: message.toolCalls.map((call) => ({ function: { name: call.name, arguments: call.input } })) } : {}),
    ...(message.toolCallId ? { tool_name: message.name } : {})
  };
}
