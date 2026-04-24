export type TimedSegment = {
  kind: 'run' | 'walk';
  seconds: number;
};

export type DistanceSegment = {
  kind: 'distance';
  distanceKm: number;
  label?: string;
};

export type Segment = TimedSegment | DistanceSegment;

export type Run = {
  run: number;
  workout: string;
  segments: Segment[];
};

export type Week = {
  week: number;
  phase: number;
  title: string;
  notes: string;
  runs: Run[];
};

export type Phase = {
  phase: number;
  name: string;
  weeks: number[];
  description: string;
};

export type Tip = {
  key: string;
  title: string;
  description: string;
};

export type Plan = {
  name: string;
  durationWeeks: number;
  daysPerWeek: number;
  goalDistance: string;
  goalTime: string;
  phases: Phase[];
  weeks: Week[];
  tips: Tip[];
};

export type RunId = `${number}-${number}`;

export const runId = (week: number, run: number): RunId =>
  `${week}-${run}` as RunId;

export type HistoryEntry = {
  id: string;
  week: number;
  run: number;
  dateISO: string;
  durationSeconds: number;
  distanceKm: number;
  notes?: string;
};
