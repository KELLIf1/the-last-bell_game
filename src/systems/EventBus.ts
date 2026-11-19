type Handler<T = unknown> = (payload: T) => void;

class TypedEventBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  on<T = unknown>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(handler as Handler);
    return () => {
      set.delete(handler as Handler);
    };
  }

  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((handler) => {
      try {
        handler(payload as T);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    });
  }
}

export const EventBus = new TypedEventBus();
