import test from "node:test";
import assert from "node:assert/strict";
import { Axiom, type ChatModel, type ModelRequest, type ModelResponse } from "@glydexstudio/axiom-core";
import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";
import { ToolRegistry } from "@glydexstudio/axiom-tools";

class FakeModel implements ChatModel {
  readonly provider = "test";
  readonly model = "fake";
  calls: ModelRequest[] = [];
  async generate(request: ModelRequest): Promise<ModelResponse> {
    this.calls.push(request);
    const hasTool = request.messages.some((message) => message.role === "tool");
    if (!hasTool && request.tools?.some((tool) => tool.name === "calculator")) {
      return { message: { role: "assistant", content: "" }, toolCalls: [{ id: "call-1", name: "calculator", input: { a: 2, b: 3 } }], finishReason: "tool_calls" };
    }
    return { message: { role: "assistant", content: "5" }, toolCalls: [], finishReason: "stop" };
  }
}

test("Axiom initializes and runs with a model abstraction", async () => {
  const model = new FakeModel();
  const axiom = new Axiom({ model });
  const result = await axiom.run("Hello");
  assert.equal(result.text, "5");
  assert.equal(model.calls.length, 1);
});

test("Axiom persists user and assistant messages into memory", async () => {
  const memory = new InMemoryMemoryStore();
  const axiom = new Axiom({ model: new FakeModel(), memory });
  await axiom.run("Hello", { conversationId: "c1" });
  const messages = await memory.list({ namespace: "default", conversationId: "c1" });
  assert.deepEqual(messages.map((message) => message.role), ["user", "assistant"]);
});

test("Axiom executes a registered tool and respects permissions", async () => {
  const tools = new ToolRegistry();
  tools.register({
    name: "calculator",
    description: "Adds two numbers.",
    inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"], additionalProperties: false },
    permissions: ["read"],
    execute: ({ a, b }: { a: number; b: number }) => a + b
  });
  const axiom = new Axiom({ model: new FakeModel(), tools, toolPermissions: new Set(["read"]) });
  const result = await axiom.run("Calculate");
  assert.equal(result.text, "5");
});
