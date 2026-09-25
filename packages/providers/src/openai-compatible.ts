import { ModelError } from "@glydexstudio/axiom-core";
import type {
  ChatMessage,
  ChatModel,
  ModelRequest,
  ModelResponse,
  ModelStreamEvent
} from "@glydexstudio/axiom-core";

export interface OpenAICompatibleOptions {
  baseUrl: string;
  model: string;
  apiKey?: string;
  providerName?: string;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id?: string;
        extra_content?: Record<string, unknown>;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export class OpenAICompatibleProvider implements ChatModel {
  readonly provider: string;
  readonly model: string;
  private readonly options: OpenAICompatibleOptions;

  constructor(options: OpenAICompatibleOptions) {
    if (!options.baseUrl.trim()) throw new TypeError("baseUrl is required.");
    if (!options.model.trim()) throw new TypeError("model is required.");

    this.options = {
      ...options,
      baseUrl: options.baseUrl.replace(/\/$/, "")
    };

    this.provider = options.providerName ?? "openai-compatible";
    this.model = options.model;
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const response = await this.request(request);
    const choice = response.choices?.[0];

    if (!choice?.message) {
      throw new ModelError("Model response did not contain a choice message.");
    }

    const toolCalls = (choice.message.tool_calls ?? []).flatMap((call) => {
      if (!call.id || !call.function?.name) return [];

      let input: unknown = {};

      try {
        input = call.function.arguments
          ? JSON.parse(call.function.arguments)
          : {};
      } catch {
        throw new ModelError(
          `Model returned invalid JSON arguments for tool "${call.function.name}".`
        );
      }

      return [
        {
          id: call.id,
          name: call.function.name,
          input,
          ...(call.extra_content
            ? { providerData: call.extra_content }
            : {})
        }
      ];
    });

    return {
      message: {
        role: "assistant",
        content: choice.message.content ?? ""
      },
      toolCalls,
      finishReason: mapFinishReason(choice.finish_reason),
      raw: response
    };
  }

  async *stream(request: ModelRequest): AsyncIterable<ModelStreamEvent> {
    const fetchImpl = this.options.fetch ?? globalThis.fetch;

    const response = await fetchImpl(
      `${this.options.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(this.body(request, true)),
        signal: request.signal
      }
    );

    if (!response.ok || !response.body) {
      throw await buildHttpError(response);
    }

    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();

        if (data === "[DONE]") {
          yield { type: "done" };
          return;
        }

        let parsed: any;

        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        const delta = parsed?.choices?.[0]?.delta;

        if (
          typeof delta?.content === "string" &&
          delta.content.length > 0
        ) {
          yield {
            type: "text_delta",
            text: delta.content
          };
        }

        for (const tc of delta?.tool_calls ?? []) {
          yield {
            type: "tool_call_delta",
            toolCall: {
              index:
                typeof tc.index === "number"
                  ? tc.index
                  : undefined,

              id:
                typeof tc.id === "string"
                  ? tc.id
                  : undefined,

              name:
                typeof tc.function?.name === "string"
                  ? tc.function.name
                  : undefined,

              input:
                typeof tc.function?.arguments === "string"
                  ? tc.function.arguments
                  : undefined
            }
          };
        }
      }
    }

    yield { type: "done" };
  }

  private async request(
    request: ModelRequest
  ): Promise<ChatCompletionResponse> {
    const fetchImpl = this.options.fetch ?? globalThis.fetch;

    const response = await fetchImpl(
      `${this.options.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(this.body(request, false)),
        signal: request.signal
      }
    );

    if (!response.ok) {
      throw await buildHttpError(response);
    }

    const data: unknown = await response.json();

    if (!data || typeof data !== "object") {
      throw new ModelError(
        "Provider returned a non-object JSON response."
      );
    }

    return data as ChatCompletionResponse;
  }

  private body(
    request: ModelRequest,
    stream: boolean
  ): Record<string, unknown> {
    return {
      model: this.model,

      messages: request.messages.map(toProviderMessage),

      ...(request.tools && request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              type: "function",
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
              }
            }))
          }
        : {}),

      ...(request.responseFormat === "json"
        ? {
            response_format: {
              type: "json_object"
            }
          }
        : {}),

      ...(request.temperature !== undefined
        ? {
            temperature: request.temperature
          }
        : {}),

      ...(request.maxTokens !== undefined
        ? {
            max_tokens: request.maxTokens
          }
        : {}),

      stream
    };
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",

      ...(this.options.apiKey
        ? {
            authorization: `Bearer ${this.options.apiKey}`
          }
        : {}),

      ...(this.options.headers ?? {})
    };
  }
}

function toProviderMessage(
  message: ChatMessage
): Record<string, unknown> {
  return {
    role: message.role,
    content: message.content,

    ...(message.toolCalls && message.toolCalls.length > 0
      ? {
          tool_calls: message.toolCalls.map((call) => ({
            id: call.id,
            type: "function",

            function: {
              name: call.name,
              arguments: JSON.stringify(call.input)
            },

            ...(call.providerData
              ? {
                  extra_content: call.providerData
                }
              : {})
          }))
        }
      : {}),

    ...(message.toolCallId
      ? {
          tool_call_id: message.toolCallId
        }
      : {}),

    ...(message.name
      ? {
          name: message.name
        }
      : {})
  };
}

function mapFinishReason(
  reason: string | null | undefined
): ModelResponse["finishReason"] {
  if (reason === "stop") return "stop";
  if (reason === "tool_calls") return "tool_calls";
  if (reason === "length") return "length";

  return "unknown";
}

async function buildHttpError(
  response: Response
): Promise<ModelError> {
  let detail = "";

  try {
    detail = await response.text();
  } catch {
    /* ignore read failure */
  }

  return new ModelError(
    `Provider request failed with HTTP ${response.status}${
      detail ? `: ${detail.slice(0, 500)}` : "."
    }`
  );
            }
