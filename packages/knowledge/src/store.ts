import type { KnowledgeDocument, KnowledgeResult, VectorRecord, VectorStore } from "./types.js";

export class InMemoryVectorStore implements VectorStore {
  private readonly records = new Map<string, VectorRecord>();

  async upsert(record: VectorRecord): Promise<void> {
    if (record.vector.length === 0) throw new TypeError("Vector must contain at least one dimension.");
    this.records.set(record.id, { ...record, vector: [...record.vector], metadata: record.metadata ? { ...record.metadata } : undefined });
  }

  async query(vector: readonly number[], limit = 5): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
    if (vector.length === 0) throw new TypeError("Query vector must contain at least one dimension.");
    if (limit < 0) throw new RangeError("limit must be >= 0");
    return [...this.records.values()]
      .filter((record) => record.vector.length === vector.length)
      .map((record) => ({ id: record.id, score: cosineSimilarity(vector, record.vector), metadata: record.metadata ? { ...record.metadata } : undefined }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> { this.records.delete(id); }
}

export class LocalKnowledgeBase {
  private readonly documents = new Map<string, KnowledgeDocument>();

  add(document: KnowledgeDocument): void {
    if (!document.id.trim()) throw new TypeError("Knowledge document id cannot be empty.");
    if (!document.content.trim()) throw new TypeError("Knowledge document content cannot be empty.");
    this.documents.set(document.id, { ...document, metadata: { ...document.metadata } });
  }

  remove(id: string): void { this.documents.delete(id); }

  search(query: string, limit = 5): KnowledgeResult[] {
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    return [...this.documents.values()]
      .map((document) => {
        const tokens = tokenize(document.content);
        const counts = new Map(tokens.map((token) => [token, 0]));
        for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
        const raw = terms.reduce((score, term) => score + (counts.get(term) ?? 0), 0);
        const score = raw / Math.max(1, terms.length);
        return { document, score, snippet: makeSnippet(document.content, terms) };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new RangeError("Vectors must have the same dimensions.");
  let dot = 0, normA = 0, normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const av = a[index] ?? 0;
    const bv = b[index] ?? 0;
    dot += av * bv; normA += av * av; normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function tokenize(value: string): string[] { return value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1); }
function makeSnippet(content: string, terms: readonly string[]): string {
  const lowered = content.toLocaleLowerCase();
  const hit = terms.map((term) => lowered.indexOf(term)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  return content.slice(Math.max(0, hit - 80), Math.min(content.length, hit + 220)).trim();
}
