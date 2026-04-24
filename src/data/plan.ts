import { Plan, Segment } from '../types';

const r = (seconds: number): Segment => ({ kind: 'run', seconds });
const w = (seconds: number): Segment => ({ kind: 'walk', seconds });
const d = (distanceKm: number, label?: string): Segment => ({
  kind: 'distance',
  distanceKm,
  ...(label !== undefined ? { label } : {}),
});

const repeat = (segments: Segment[], times: number): Segment[] =>
  Array.from({ length: times }, () => segments).flat();

export const plan: Plan = {
  name: 'Couch to 5K',
  durationWeeks: 12,
  daysPerWeek: 3,
  goalDistance: '5K',
  goalTime: '~30 min',
  phases: [
    {
      phase: 1,
      name: 'Foundation',
      weeks: [1, 2, 3, 4],
      description: 'Build aerobic base with walk/run intervals',
    },
    {
      phase: 2,
      name: 'Building',
      weeks: [5, 6, 7, 8],
      description:
        'Transition to longer continuous runs, eliminate walking breaks',
    },
    {
      phase: 3,
      name: 'Peak & Race',
      weeks: [9, 10, 11, 12],
      description: 'Push toward 30 min and full 5K distance',
    },
  ],
  weeks: [
    {
      week: 1,
      phase: 1,
      title: 'Walk/Run Introduction',
      notes:
        'Alternate short running bursts with walking. Keep the run pace easy — conversational.',
      runs: [1, 2, 3].map((n) => ({
        run: n,
        workout: '8x [run 1 min / walk 2 min]',
        segments: repeat([r(60), w(120)], 8),
      })),
    },
    {
      week: 2,
      phase: 1,
      title: 'Building the Rhythm',
      notes:
        'Slightly longer run intervals. Keep pace conversational — short sentences only.',
      runs: [1, 2, 3].map((n) => ({
        run: n,
        workout: '7x [run 90 sec / walk 2 min]',
        segments: repeat([r(90), w(120)], 7),
      })),
    },
    {
      week: 3,
      phase: 1,
      title: 'First Push',
      notes: 'Mix shorter and longer intervals in the same session.',
      runs: [1, 2, 3].map((n) => ({
        run: n,
        workout: '2x [run 90 sec / walk 90 sec / run 3 min / walk 3 min]',
        segments: repeat([r(90), w(90), r(180), w(180)], 2),
      })),
    },
    {
      week: 4,
      phase: 1,
      title: 'Consolidation Week',
      notes:
        "Repeat Week 3. Body is building aerobic capacity and tendon strength. Don't skip.",
      runs: [1, 2, 3].map((n) => ({
        run: n,
        workout: '2x [run 90 sec / walk 90 sec / run 3 min / walk 3 min]',
        segments: repeat([r(90), w(90), r(180), w(180)], 2),
      })),
    },
    {
      week: 5,
      phase: 2,
      title: 'Longer Continuous Runs',
      notes:
        'First 5-minute continuous run. Walking breaks getting shorter — a real milestone.',
      runs: [
        {
          run: 1,
          workout: '3x [run 5 min / walk 3 min]',
          segments: repeat([r(300), w(180)], 3),
        },
        {
          run: 2,
          workout: '3x [run 5 min / walk 3 min]',
          segments: repeat([r(300), w(180)], 3),
        },
        {
          run: 3,
          workout: 'run 8 min / walk 5 min / run 8 min',
          segments: [r(480), w(300), r(480)],
        },
      ],
    },
    {
      week: 6,
      phase: 2,
      title: 'Breaking the 10-Minute Barrier',
      notes:
        'First double-digit continuous run. Run 3 is longest yet — go slower than you think you need to.',
      runs: [
        {
          run: 1,
          workout: '3x [run 5 min / walk 3 min]',
          segments: repeat([r(300), w(180)], 3),
        },
        {
          run: 2,
          workout: 'run 10 min / walk 3 min / run 10 min',
          segments: [r(600), w(180), r(600)],
        },
        {
          run: 3,
          workout: 'run 22 min (no walk)',
          segments: [r(22 * 60)],
        },
      ],
    },
    {
      week: 7,
      phase: 2,
      title: 'Continuous Running',
      notes:
        'Walking breaks are gone. All sessions are continuous. Pace is everything — slow down if needed.',
      runs: [
        {
          run: 1,
          workout: 'run 25 min (no walk)',
          segments: [r(25 * 60)],
        },
        {
          run: 2,
          workout: 'run 25 min (no walk)',
          segments: [r(25 * 60)],
        },
        {
          run: 3,
          workout: 'run 28 min (no walk)',
          segments: [r(28 * 60)],
        },
      ],
    },
    {
      week: 8,
      phase: 2,
      title: 'Strength Week',
      notes:
        'Slightly easier week to absorb gains. Aerobic engine is developing fast.',
      runs: [1, 2, 3].map((n) => ({
        run: n,
        workout: 'run 28 min (no walk)',
        segments: [r(28 * 60)],
      })),
    },
    {
      week: 9,
      phase: 3,
      title: 'Closing In',
      notes:
        'Pushing toward 30 minutes. Cardiovascular fitness is well ahead of where you started.',
      runs: [
        { run: 1, workout: 'run 30 min', segments: [r(30 * 60)] },
        { run: 2, workout: 'run 30 min', segments: [r(30 * 60)] },
        {
          run: 3,
          workout: 'run 30 min (easy pace)',
          segments: [r(30 * 60)],
        },
      ],
    },
    {
      week: 10,
      phase: 3,
      title: 'Distance Focus',
      notes:
        'Shift from time to distance. Run at a pace you can hold for the full 5K.',
      runs: [
        { run: 1, workout: 'run 30 min', segments: [r(30 * 60)] },
        { run: 2, workout: 'run 30 min', segments: [r(30 * 60)] },
        {
          run: 3,
          workout: 'run 4 km (any pace)',
          segments: [d(4, '4 km any pace')],
        },
      ],
    },
    {
      week: 11,
      phase: 3,
      title: 'Almost There',
      notes:
        'Longest run of the whole plan. Run 3 is your first full 5K attempt — go easy, finish strong, no pressure on time.',
      runs: [
        { run: 1, workout: 'run 30 min', segments: [r(30 * 60)] },
        { run: 2, workout: 'run 30 min', segments: [r(30 * 60)] },
        {
          run: 3,
          workout: 'run 5 km (first full distance!)',
          segments: [d(5, 'First 5K!')],
        },
      ],
    },
    {
      week: 12,
      phase: 3,
      title: 'Race Week',
      notes:
        'Taper down to stay fresh. Two easy runs early in the week, rest before your 5K.',
      runs: [
        { run: 1, workout: 'run 20 min (easy)', segments: [r(20 * 60)] },
        { run: 2, workout: 'run 15 min (easy)', segments: [r(15 * 60)] },
        {
          run: 3,
          workout: 'RACE DAY — run your 5K!',
          segments: [d(5, 'RACE DAY')],
        },
      ],
    },
  ],
  tips: [
    {
      key: 'pace',
      title: 'Pace',
      description:
        'Run slow enough to hold a conversation. Most beginners go too fast and burn out. Slow is sustainable.',
    },
    {
      key: 'rest_days',
      title: 'Rest Days',
      description:
        "Off days are when your body actually adapts. Don't skip them — avoid hard activity on rest days.",
    },
    {
      key: 'repeat_weeks',
      title: 'Repeat Weeks',
      description:
        "If a week feels too hard, repeat it. There's no prize for rushing. Getting injured sets you back far more.",
    },
    {
      key: 'shoes',
      title: 'Shoes',
      description:
        'Get running shoes that fit properly. Visit a running store if possible.',
    },
    {
      key: 'hydration',
      title: 'Hydration',
      description:
        "Drink water before and after every run. For runs under 30 minutes, you don't need to carry water.",
    },
    {
      key: 'consistency',
      title: 'Consistency',
      description:
        '3 days a week, every week. Consistency over 12 weeks beats any single heroic effort. Show up.',
    },
  ],
};

export const findRun = (week: number, run: number) => {
  const w = plan.weeks.find((wk) => wk.week === week);
  if (!w) return null;
  const r = w.runs.find((rn) => rn.run === run);
  if (!r) return null;
  return { week: w, run: r };
};

export const totalSecondsFor = (segments: Segment[]): number =>
  segments.reduce(
    (acc, s) => acc + (s.kind === 'distance' ? 0 : s.seconds),
    0
  );
