export class AxiomError extends Error {
  constructor(message: string, public readonly code: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AxiomError";
  }
}

export class ModelError extends AxiomError {
  constructor(message: string, options?: { cause?: unknown }) { super(message, "MODEL_ERROR", options); this.name = "ModelError"; }
}

export class ToolLoopError extends AxiomError {
  constructor(message: string) { super(message, "TOOL_LOOP_LIMIT"); this.name = "ToolLoopError"; }
}
