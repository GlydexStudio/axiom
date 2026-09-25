import test from "node:test";
import assert from "node:assert/strict";
import { Axiom, type ChatModel, type ModelRequest, type ModelResponse } from "@glydexstudio/axiom-core";

const model: ChatModel = {
  provider: "test",
  model: "test",
  async generate(_request: ModelRequest): Promise<ModelResponse> {
    return { message: { role: "assistant", content: "ok" }, toolCalls: [], finishReason: "stop" };
  }
};

test("configuration rejects empty input and accepts custom namespaces", async () => {
  const axiom = new Axiom({ model, namespace: "app" });
  await assert.rejects(() => axiom.run("   "), /empty/);
  const result = await axiom.run("hello", { namespace: "custom" });
  assert.equal(result.text, "ok");
});
