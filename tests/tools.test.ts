import test from "node:test";
import assert from "node:assert/strict";
import { ToolRegistry, validateInput } from "@glydexstudio/axiom-tools";

test("ToolRegistry registers and executes a typed tool", async () => {
  const registry = new ToolRegistry();
  registry.register({
    name: "echo",
    description: "Echoes text.",
    inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false },
    execute: ({ text }: { text: string }) => text
  });
  assert.deepEqual(await registry.execute("echo", { text: "hello" }), { ok: true, value: "hello" });
});

test("ToolRegistry rejects invalid inputs", () => {
  assert.throws(() => validateInput({ type: "object", properties: { count: { type: "integer" } }, required: ["count"] }, { count: 1.5 }));
});

test("ToolRegistry enforces permissions", async () => {
  const registry = new ToolRegistry();
  registry.register({ name: "write_it", description: "writes", inputSchema: { type: "object", properties: {} }, permissions: ["write"], execute: () => true });
  const result = await registry.execute("write_it", {}, { permissions: new Set(["read"]) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "PERMISSION_DENIED");
});
