export type ToolPermission = "read" | "write" | "network" | "filesystem" | "process";

export interface ToolContext {
  signal?: AbortSignal;
  permissions: ReadonlySet<ToolPermission>;
  metadata: Readonly<Record<string, unknown>>;
}

export interface JsonSchema {
  type: "object" | "string" | "number" | "integer" | "boolean" | "array" | "null";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean;
  enum?: readonly unknown[];
}

export interface ToolDefinition<TInput = unknown, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  permissions?: readonly ToolPermission[];
  execute: (input: TInput, context: ToolContext) => Promise<TResult> | TResult;
}

export interface ToolCallResult {
  ok: true;
  value: unknown;
}

export interface ToolCallError {
  ok: false;
  error: { code: string; message: string };
}

export type ToolExecutionResult = ToolCallResult | ToolCallError;
