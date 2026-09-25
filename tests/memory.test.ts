import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";

test("InMemoryMemoryStore stores and filters messages", async () => {
  const store = new InMemoryMemoryStore();
  await store.add({ id: "1", namespace: "a", conversationId: "c", role: "user", content: "hello", metadata: {}, createdAt: 1 });
  await store.add({ id: "2", namespace: "b", conversationId: "c", role: "user", content: "other", metadata: {}, createdAt: 2 });
  assert.equal((await store.list({ namespace: "a", conversationId: "c" })).length, 1);
  await store.clear({ namespace: "a", conversationId: "c" });
  assert.deepEqual(await store.list({ namespace: "a", conversationId: "c" }), []);
});

test("InMemoryMemoryStore supports key-value records", async () => {
  const store = new InMemoryMemoryStore();
  await store.set("user", "theme", "dark");
  assert.equal((await store.get("user", "theme"))?.value, "dark");
  await store.delete("user", "theme");
  assert.equal(await store.get("user", "theme"), undefined);
});
