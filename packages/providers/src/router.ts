import type { ChatModel, ModelRequest, ModelResponse } from "@glydexstudio/axiom-core";
import { ModelError } from "@glydexstudio/axiom-core";

export class FallbackModelRouter implements ChatModel {
  readonly provider = "router";
  readonly model: string;
  private readonly models: readonly ChatModel[];

  constructor(models: readonly ChatModel[]) {
    if (models.length === 0) throw new TypeError("FallbackModelRouter requires at least one model.");
    this.models = [...models];
    this.model = models.map((model) => `${model.provider}/${model.model}`).join(",");
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const failures: string[] = [];
    for (const model of this.models) {
      try { return await model.generate(request); }
      catch (error) { failures.push(`${model.provider}/${model.model}: ${error instanceof Error ? error.message : String(error)}`); }
    }
    throw new ModelError(`Every configured model failed. ${failures.join(" | ")}`);
  }
}
