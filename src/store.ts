import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { PROGRAM, dayId } from './data/program';
import type { Run, SessionContext, Settings, Week } from './types';

/* ----------------------------------------------------------------------------
 * createStore — tiny persistent store. Reads from AsyncStorage on construction
 * and writes through on every set(). Components subscribe via use().
 * -------------------------------------------------------------------------- */

type Listener = () => void;

const createStore = <T>(key: string, defaults: T) => {
  let state = defaults;
  const listeners = new Set<Listener>();
  const subscribe = (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  };
  const emit = () => listeners.forEach((fn) => fn());

  AsyncStorage.getItem(key)
    .then((raw) => {
      if (!raw) return;
      try {
        const loaded = JSON.parse(raw) as T;
        state = Array.isArray(defaults)
          ? (loaded as T)
          : { ...(defaults as object), ...(loaded as object) } as T;
        emit();
      } catch {
        /* ignore malformed payloads */
      }
    })
    .catch(() => undefined);

  return {
    get: () => state,
    set: (next: T | ((prev: T) => T)) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => undefined);
      emit();
    },
    use: () => useSyncExternalStore(subscribe, () => state, () => state),
  };
};

/* ----------------------------------------------------------------------------
 * The three stores
 * -------------------------------------------------------------------------- */

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  audioEnabled: true,
  audioVolume: 0.7,
  vibrationEnabled: true,
  units: 'km',
  autoLogEnabled: true,
  restDayReminders: false,
  restDayReminderTime: '18:00',
};

export const settings = createStore<Settings>('c25k.settings', DEFAULT_SETTINGS);
export const history = createStore<Run[]>('c25k.history', []);
export const completion = createStore<Record<string, true>>('c25k.completion', {});

/* ----------------------------------------------------------------------------
 * Convenience actions + selectors
 * -------------------------------------------------------------------------- */

export const updateSettings = (patch: Partial<Settings>): void => {
  settings.set((s) => ({ ...s, ...patch }));
};

export const addRun = (run: Run): void => {
  history.set((rs) => [run, ...rs]);
};

export const clearHistory = (): void => history.set([]);

export const isDone = (id: string): boolean => !!completion.get()[id];

export const markDone = (id: string): void => {
  completion.set((c) => (c[id] ? c : { ...c, [id]: true }));
};

export const resetProgress = (): void => completion.set({});

export const findNextSession = (): SessionContext | null => {
  for (const phase of PROGRAM) {
    for (const w of phase.weeks) {
      for (let i = 0; i < w.days.length; i++) {
        const id = dayId(w.week, i);
        if (!isDone(id)) return { week: w.week, dayIndex: i, day: w.days[i], dayId: id };
      }
    }
  }
  return null;
};

export const weekStatus = (w: Week): { done: number; total: number } => {
  let done = 0;
  for (let i = 0; i < w.days.length; i++) if (isDone(dayId(w.week, i))) done++;
  return { done, total: w.days.length };
};
