export type MemoryRole = "system" | "user" | "assistant" | "tool";

export interface MemoryMessage {
  id: string;
  namespace: string;
  conversationId: string;
  role: MemoryRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: Array<{
  id: string;
  name: string;
  input: unknown;
  providerData?: Record<string, unknown>;
}>;
  metadata: Record<string, unknown>;
  createdAt: number;
}

export interface MemoryQuery {
  namespace?: string;
  conversationId?: string;
  limit?: number;
}

export interface MemoryStore {
  add(message: MemoryMessage): Promise<MemoryMessage>;
  list(query: MemoryQuery): Promise<MemoryMessage[]>;
  clear(query: Pick<MemoryQuery, "namespace" | "conversationId">): Promise<void>;
}

export interface MemoryRecord {
  namespace: string;
  key: string;
  value: unknown;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface KeyValueMemoryStore {
  get(namespace: string, key: string): Promise<MemoryRecord | undefined>;
  set(namespace: string, key: string, value: unknown, metadata?: Record<string, unknown>): Promise<MemoryRecord>;
  delete(namespace: string, key: string): Promise<void>;
}
