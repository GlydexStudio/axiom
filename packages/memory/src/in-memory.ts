import type { KeyValueMemoryStore, MemoryMessage, MemoryQuery, MemoryRecord, MemoryStore } from "./types.js";

export class InMemoryMemoryStore implements MemoryStore, KeyValueMemoryStore {
  private readonly messages = new Map<string, MemoryMessage>();
  private readonly records = new Map<string, MemoryRecord>();

  async add(message: MemoryMessage): Promise<MemoryMessage> {
    this.messages.set(message.id, { ...message, metadata: { ...message.metadata } });
    return { ...message, metadata: { ...message.metadata } };
  }

  async list(query: MemoryQuery): Promise<MemoryMessage[]> {
    const values = [...this.messages.values()]
      .filter((message) => query.namespace === undefined || message.namespace === query.namespace)
      .filter((message) => query.conversationId === undefined || message.conversationId === query.conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (query.limit === undefined) return values.map(cloneMessage);
    if (query.limit < 0) throw new RangeError("Memory query limit must be >= 0.");
    return values.slice(Math.max(0, values.length - query.limit)).map(cloneMessage);
  }

  async clear(query: Pick<MemoryQuery, "namespace" | "conversationId">): Promise<void> {
    for (const [id, message] of this.messages.entries()) {
      const namespaceMatches = query.namespace === undefined || message.namespace === query.namespace;
      const conversationMatches = query.conversationId === undefined || message.conversationId === query.conversationId;
      if (namespaceMatches && conversationMatches) this.messages.delete(id);
    }
  }

  async get(namespace: string, key: string): Promise<MemoryRecord | undefined> {
    const record = this.records.get(recordKey(namespace, key));
    return record ? cloneRecord(record) : undefined;
  }

  async set(namespace: string, key: string, value: unknown, metadata: Record<string, unknown> = {}): Promise<MemoryRecord> {
    const now = Date.now();
    const previous = this.records.get(recordKey(namespace, key));
    const record: MemoryRecord = {
      namespace,
      key,
      value,
      metadata: { ...metadata },
      createdAt: previous?.createdAt ?? now,
      updatedAt: now
    };
    this.records.set(recordKey(namespace, key), record);
    return cloneRecord(record);
  }

  async delete(namespace: string, key: string): Promise<void> {
    this.records.delete(recordKey(namespace, key));
  }
}

function recordKey(namespace: string, key: string): string {
  return `${namespace}\u0000${key}`;
}

function cloneMessage(message: MemoryMessage): MemoryMessage {
  return { ...message, metadata: { ...message.metadata } };
}

function cloneRecord(record: MemoryRecord): MemoryRecord {
  return { ...record, metadata: { ...record.metadata } };
}
