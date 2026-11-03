import type { Source } from './domain/types';
/** Immutable snapshots and stable subscriptions for React's external-store contract. */
export function createStore<T>(initial: T): Source<T> & { set: (value: T) => void } {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (value) => {
      if (Object.is(value, snapshot)) return;
      snapshot = value;
      for (const listener of [...listeners]) listener();
    },
  };
}
