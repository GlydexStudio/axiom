import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryVectorStore, LocalKnowledgeBase } from "@glydexstudio/axiom-knowledge";

test("knowledge base supports local lexical retrieval", () => {
  const kb = new LocalKnowledgeBase();
  kb.add({ id: "1", content: "AXIOM uses local-first memory.", metadata: {} });
  const result = kb.search("local memory");
  assert.equal(result[0]?.document.id, "1");
});

test("vector store supports cosine similarity", async () => {
  const store = new InMemoryVectorStore();
  await store.upsert({ id: "a", vector: [1, 0] });
  await store.upsert({ id: "b", vector: [0, 1] });
  const result = await store.query([1, 0], 1);
  assert.equal(result[0]?.id, "a");
});
