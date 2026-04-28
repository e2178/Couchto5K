export type SegmentKind = 'run' | 'walk';

export type Segment = { kind: SegmentKind; sec: number };

export type Day = {
  segments: Segment[];
  desc: string;
};

export type Week = {
  week: number;
  days: Day[];
};

export type Phase = {
  name: string;
  range: string;
  weeks: Week[];
};

export type SessionContext = {
  week: number;
  dayIndex: number;
  day: Day;
  dayId: string;
};

export type Run = {
  id: string;
  date: string;            // ISO
  weekLabel?: string;
  title?: string;
  distanceKm: number;
  durationSeconds: number;
  paceSecondsPerKm: number;
  source: 'auto' | 'manual';
};

export type Settings = {
  theme: 'dark' | 'light' | 'system';
  audioEnabled: boolean;
  audioVolume: number;
  vibrationEnabled: boolean;
  units: 'km' | 'mi';
  autoLogEnabled: boolean;
  keepScreenOn: boolean;
  restDayReminders: boolean;
  restDayReminderTime: string;
};

export type ActiveWorkout = {
  ctx: SessionContext;
  startedAt: number;            // epoch ms
  pausedAt: number | null;      // epoch ms when last paused, null if running
  totalPausedMs: number;        // accumulated pause time
  finishedAt: number | null;    // epoch ms when finished (early or natural)
};
