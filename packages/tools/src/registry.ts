import type { JsonSchema, ToolDefinition, ToolExecutionResult, ToolPermission } from "./types.js";

export class ToolRegistry {
  private readonly definitions = new Map<string, ToolDefinition>();

  register<TInput, TResult>(definition: ToolDefinition<TInput, TResult>): void {
    validateName(definition.name);
    if (this.definitions.has(definition.name)) throw new Error(`A tool named "${definition.name}" is already registered.`);
    validateSchema(definition.inputSchema);
    this.definitions.set(definition.name, definition as ToolDefinition);
  }

  unregister(name: string): boolean {
    return this.definitions.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.definitions.get(name);
  }

  list(): ToolDefinition[] {
    return [...this.definitions.values()];
  }

  async execute(name: string, input: unknown, context: { permissions?: ReadonlySet<ToolPermission>; signal?: AbortSignal; metadata?: Readonly<Record<string, unknown>> } = {}): Promise<ToolExecutionResult> {
    const definition = this.definitions.get(name);
    if (!definition) return { ok: false, error: { code: "TOOL_NOT_FOUND", message: `Tool "${name}" is not registered.` } };

    try {
      validateInput(definition.inputSchema, input, "input");
      const requiredPermissions = definition.permissions ?? [];
      const available = context.permissions ?? new Set<ToolPermission>();
      for (const permission of requiredPermissions) {
        if (!available.has(permission)) {
          return { ok: false, error: { code: "PERMISSION_DENIED", message: `Tool "${name}" requires permission "${permission}".` } };
        }
      }
      const value = await definition.execute(input, {
        signal: context.signal,
        permissions: available,
        metadata: context.metadata ?? {}
      });
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: { code: "TOOL_EXECUTION_FAILED", message: toErrorMessage(error) } };
    }
  }
}

export function validateInput(schema: JsonSchema, value: unknown, path = "value"): void {
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) {
    throw new TypeError(`${path} must be one of the allowed enum values.`);
  }
  if (schema.type === "null") {
    if (value !== null) throw new TypeError(`${path} must be null.`);
    return;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) throw new TypeError(`${path} must be an array.`);
    if (schema.items) value.forEach((item, index) => validateInput(schema.items!, item, `${path}[${index}]`));
    return;
  }
  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError(`${path} must be an object.`);
    const objectValue = value as Record<string, unknown>;
    for (const required of schema.required ?? []) if (!(required in objectValue)) throw new TypeError(`${path}.${required} is required.`);
    for (const [key, child] of Object.entries(objectValue)) {
      const childSchema = schema.properties?.[key];
      if (!childSchema) {
        if (schema.additionalProperties === false) throw new TypeError(`${path}.${key} is not allowed.`);
        continue;
      }
      validateInput(childSchema, child, `${path}.${key}`);
    }
    return;
  }
  if (schema.type === "string" && typeof value !== "string") throw new TypeError(`${path} must be a string.`);
  if (schema.type === "number" && (typeof value !== "number" || Number.isNaN(value))) throw new TypeError(`${path} must be a number.`);
  if (schema.type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) throw new TypeError(`${path} must be an integer.`);
  if (schema.type === "boolean" && typeof value !== "boolean") throw new TypeError(`${path} must be a boolean.`);
}

function validateName(name: string): void {
  if (!/^[a-z][a-z0-9_-]{1,63}$/.test(name)) throw new Error(`Invalid tool name "${name}". Use 2-64 lowercase characters, digits, _ or - and start with a letter.`);
}

function validateSchema(schema: JsonSchema): void {
  validateInput({ type: "object", properties: { type: { type: "string" } }, required: ["type"] }, { type: schema.type });
  if (schema.type === "object" && schema.properties) for (const child of Object.values(schema.properties)) validateSchema(child);
  if (schema.type === "array" && schema.items) validateSchema(schema.items);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
