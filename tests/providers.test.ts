import test from "node:test";
import assert from "node:assert/strict";
import { OpenAICompatibleProvider } from "@glydexstudio/axiom-providers";

test("OpenAI-compatible provider sends and parses chat requests", async () => {
  const provider = new OpenAICompatibleProvider({
    baseUrl: "http://local.test",
    model: "local-model",
    fetch: async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { model: string; messages: Array<{ role: string }> };
      assert.equal(body.model, "local-model");
      assert.equal(body.messages[0]?.role, "user");
      return new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] }), { status: 200 });
    }
  });
  const result = await provider.generate({ messages: [{ role: "user", content: "hi" }] });
  assert.equal(result.message.content, "ok");
});
