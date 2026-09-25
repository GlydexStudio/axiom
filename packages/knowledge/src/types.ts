export interface KnowledgeDocument {
  id: string;
  content: string;
  metadata: Record<string, string | number | boolean>;
}

export interface KnowledgeResult {
  document: KnowledgeDocument;
  score: number;
  snippet: string;
}

export interface EmbeddingProvider {
  embed(text: string, options?: { signal?: AbortSignal }): Promise<readonly number[]>;
  dimensions?: number;
}

export interface VectorRecord {
  id: string;
  vector: readonly number[];
  metadata?: Record<string, unknown>;
}

export interface VectorStore {
  upsert(record: VectorRecord): Promise<void>;
  query(vector: readonly number[], limit?: number): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  delete(id: string): Promise<void>;
}
