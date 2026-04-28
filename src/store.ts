import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { PROGRAM, dayId } from './data/program';
import type { ActiveWorkout, Run, SessionContext, Settings, Week } from './types';

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
        state = Array.isArray(defaults) || defaults === null
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
 * The four stores
 * -------------------------------------------------------------------------- */

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  audioEnabled: true,
  audioVolume: 0.7,
  vibrationEnabled: true,
  units: 'km',
  autoLogEnabled: true,
  keepScreenOn: true,
  restDayReminders: false,
  restDayReminderTime: '18:00',
};

export const settings = createStore<Settings>('c25k.settings', DEFAULT_SETTINGS);
export const history = createStore<Run[]>('c25k.history', []);
export const completion = createStore<Record<string, true>>('c25k.completion', {});
export const activeWorkout = createStore<ActiveWorkout | null>('c25k.activeWorkout', null);

/* ----------------------------------------------------------------------------
 * Settings actions
 * -------------------------------------------------------------------------- */

export const updateSettings = (patch: Partial<Settings>): void => {
  settings.set((s) => ({ ...s, ...patch }));
};

/* ----------------------------------------------------------------------------
 * History actions
 * -------------------------------------------------------------------------- */

export const addRun = (run: Run): void => {
  history.set((rs) => [run, ...rs]);
};

export const updateRun = (id: string, patch: Partial<Run>): void => {
  history.set((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
};

export const deleteRun = (id: string): void => {
  history.set((rs) => rs.filter((r) => r.id !== id));
};

export const clearHistory = (): void => history.set([]);

/* ----------------------------------------------------------------------------
 * Completion actions
 * -------------------------------------------------------------------------- */

export const isDone = (id: string): boolean => !!completion.get()[id];

export const markDone = (id: string): void => {
  completion.set((c) => (c[id] ? c : { ...c, [id]: true }));
};

export const setDayDone = (id: string, value: boolean): void => {
  completion.set((c) => {
    if (value) return c[id] ? c : { ...c, [id]: true };
    if (!c[id]) return c;
    const next = { ...c };
    delete next[id];
    return next;
  });
};

export const setWeekDone = (week: Week, value: boolean): void => {
  completion.set((c) => {
    const next = { ...c };
    for (let i = 0; i < week.days.length; i++) {
      const id = dayId(week.week, i);
      if (value) next[id] = true;
      else delete next[id];
    }
    return next;
  });
};

export const resetProgress = (): void => completion.set({});

/* ----------------------------------------------------------------------------
 * Active-workout actions
 * -------------------------------------------------------------------------- */

export const startActiveWorkout = (ctx: SessionContext): void => {
  activeWorkout.set({
    ctx,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    finishedAt: null,
  });
};

export const pauseActiveWorkout = (): void => {
  activeWorkout.set((aw) =>
    aw && !aw.pausedAt && !aw.finishedAt ? { ...aw, pausedAt: Date.now() } : aw,
  );
};

export const resumeActiveWorkout = (): void => {
  activeWorkout.set((aw) => {
    if (!aw || !aw.pausedAt || aw.finishedAt) return aw;
    const additionalPause = Date.now() - aw.pausedAt;
    return { ...aw, pausedAt: null, totalPausedMs: aw.totalPausedMs + additionalPause };
  });
};

export const finishActiveWorkout = (): void => {
  activeWorkout.set((aw) => (aw && !aw.finishedAt ? { ...aw, finishedAt: Date.now() } : aw));
};

export const clearActiveWorkout = (): void => {
  activeWorkout.set(null);
};

/* Compute elapsed seconds for an active workout, factoring out paused time. */
export const elapsedSeconds = (aw: ActiveWorkout, now: number = Date.now()): number => {
  const end = aw.finishedAt ?? aw.pausedAt ?? now;
  return Math.max(0, Math.round((end - aw.startedAt - aw.totalPausedMs) / 1000));
};

/* ----------------------------------------------------------------------------
 * Selectors
 * -------------------------------------------------------------------------- */

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
