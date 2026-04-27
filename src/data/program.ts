import type { Day, Phase, Segment, Week } from '../types';

const R = (min: number): Segment => ({ kind: 'run',  sec: Math.round(min * 60) });
const W = (min: number): Segment => ({ kind: 'walk', sec: Math.round(min * 60) });

const repeat = <T,>(arr: T[], n: number): T[] => {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(...arr);
  return out;
};

const WARM = W(5);
const COOL = W(5);

const day = (segments: Segment[], desc: string): Day => ({ segments, desc });

const w1 = day([WARM, ...repeat([R(1), W(1.5)], 8), COOL],
               '8 × (60s run + 90s walk)');
const w2 = day([WARM, ...repeat([R(1.5), W(2)], 6), COOL],
               '6 × (90s run + 2:00 walk)');
const w3 = day([WARM, ...repeat([R(1.5), W(1.5), R(3), W(3)], 2), COOL],
               '2 × (90s run, 90s walk, 3:00 run, 3:00 walk)');
const w4 = day([WARM, R(3), W(1.5), R(5), W(2.5), R(3), W(1.5), R(5), COOL],
               '3:00 + 5:00 + 3:00 + 5:00 run, walks between');

const w5d1 = day([WARM, R(5), W(3), R(5), W(3), R(5), COOL],
                 '3 × 5:00 run with 3:00 walks');
const w5d2 = day([WARM, R(8), W(5), R(8), COOL],
                 '2 × 8:00 run with 5:00 walk');
const w5d3 = day([WARM, R(20), COOL],
                 '20:00 continuous run');

const w6d1 = day([WARM, R(5), W(3), R(8), W(3), R(5), COOL],
                 '5:00 + 8:00 + 5:00 run');
const w6d2 = day([WARM, R(10), W(3), R(10), COOL],
                 '2 × 10:00 run with 3:00 walk');
const w6d3 = day([WARM, R(25), COOL],
                 '25:00 continuous run');

const w7 = day([WARM, R(25), COOL], '25:00 continuous run');
const w8 = day([WARM, R(28), COOL], '28:00 continuous run');
const w9 = day([WARM, R(30), COOL], '30:00 continuous run — 5K!');

const week = (n: number, days: Day[]): Week => ({ week: n, days });

export const PROGRAM: Phase[] = [
  {
    name: 'Phase 1 · Foundation',
    range: 'Weeks 1–4',
    weeks: [week(1, [w1, w1, w1]), week(2, [w2, w2, w2]),
            week(3, [w3, w3, w3]), week(4, [w4, w4, w4])],
  },
  {
    name: 'Phase 2 · Build',
    range: 'Weeks 5–6',
    weeks: [week(5, [w5d1, w5d2, w5d3]), week(6, [w6d1, w6d2, w6d3])],
  },
  {
    name: 'Phase 3 · Endurance',
    range: 'Weeks 7–9',
    weeks: [week(7, [w7, w7, w7]), week(8, [w8, w8, w8]), week(9, [w9, w9, w9])],
  },
];

export const dayId = (week: number, dayIndex: number): string =>
  `w${week}d${dayIndex + 1}`;

export const dayLabel = (week: number, dayIndex: number): string =>
  `W${week} D${dayIndex + 1}`;

export const totalSeconds = (segments: Segment[]): number =>
  segments.reduce((s, seg) => s + seg.sec, 0);
