/**
 * Tiny pub/sub event bus. Used by GameStore to broadcast state changes.
 */
export type Listener<T> = (payload: T) => void;

export class EventBus<EventMap extends object> {
  private listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } = {};  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    let set = this.listeners[event];
    if (!set) {
      set = new Set();
      this.listeners[event] = set;
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners[event];
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] listener for "${String(event)}" threw`, err);
      }
    });
  }

  clear(): void {
    this.listeners = {};
  }
}
