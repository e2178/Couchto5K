import { PROGRAM, dayId, dayLabel } from '../data/program';
import type { SessionContext, Week } from '../types';
import { isDone, completionStore } from './completion';
import { useSyncExternalStore } from 'react';

export const findNextSession = (): SessionContext | null => {
  for (const phase of PROGRAM) {
    for (const weekObj of phase.weeks) {
      for (let di = 0; di < weekObj.days.length; di++) {
        const id = dayId(weekObj.week, di);
        if (!isDone(id)) {
          return {
            week: weekObj.week,
            dayIndex: di,
            day: weekObj.days[di],
            dayId: id,
          };
        }
      }
    }
  }
  return null;
};

export const weekStatus = (weekObj: Week): { done: number; total: number } => {
  let done = 0;
  for (let di = 0; di < weekObj.days.length; di++) {
    if (isDone(dayId(weekObj.week, di))) done++;
  }
  return { done, total: weekObj.days.length };
};

/* Re-renders any component that uses this whenever completion changes. */
export const useCompletionVersion = (): number => {
  return useSyncExternalStore(
    (fn) => completionStore.subscribe(fn),
    () => Object.keys(completionStore.get()).length,
    () => Object.keys(completionStore.get()).length,
  );
};

export { dayId, dayLabel };
