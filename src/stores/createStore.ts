import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Listener = () => void;

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: Listener) => () => void;
  use: <S = T>(selector?: (s: T) => S) => S;
  ready: Promise<void>;
};

export function createPersistedStore<T>(
  key: string,
  defaults: T,
  merge: (defaults: T, loaded: unknown) => T = (d, l) =>
    ({ ...(d as object), ...((l ?? {}) as object) } as T),
): Store<T> {
  let state: T = defaults;
  const listeners = new Set<Listener>();

  const ready = (async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        state = merge(defaults, JSON.parse(raw));
        listeners.forEach((fn) => fn());
      }
    } catch {
      /* fall back to defaults */
    }
  })();

  const persist = (value: T) => {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
  };

  return {
    get: () => state,
    set: (next) => {
      const value = typeof next === 'function'
        ? (next as (p: T) => T)(state)
        : next;
      state = value;
      persist(value);
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
    use<S = T>(selector?: (s: T) => S): S {
      const sel = selector ?? ((s: T) => s as unknown as S);
      const subscribe = (fn: Listener) => {
        listeners.add(fn);
        return () => { listeners.delete(fn); };
      };
      return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
    },
    ready,
  };
}
