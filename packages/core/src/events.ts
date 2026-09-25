import type { AxiomEventMap } from "./types.js";

export class EventBus {
  private readonly listeners = new Map<keyof AxiomEventMap, Set<(payload: never) => void>>();

  on<K extends keyof AxiomEventMap>(event: K, listener: (payload: AxiomEventMap[K]) => void): () => void {
    const set = this.listeners.get(event) ?? new Set<(payload: never) => void>();
    set.add(listener as (payload: never) => void);
    this.listeners.set(event, set);
    return () => set.delete(listener as (payload: never) => void);
  }

  emit<K extends keyof AxiomEventMap>(event: K, payload: AxiomEventMap[K]): void {
    for (const listener of this.listeners.get(event) ?? []) listener(payload as never);
  }
}
