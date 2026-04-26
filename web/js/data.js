/* Couch to 5K program data — 9 weeks, 3 days each, grouped into 3 phases. */
(function (global) {
  function R(min) { return { kind: "run",  sec: Math.round(min * 60) }; }
  function W(min) { return { kind: "walk", sec: Math.round(min * 60) }; }
  function repeat(arr, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(...arr);
    return out;
  }

  const WARM = W(5);
  const COOL = W(5);

  // Each day is a sequence of segments. Description summarises the run pattern.
  const DAYS = {
    w1: { segments: [WARM, ...repeat([R(1), W(1.5)], 8), COOL],
          desc: "8 × (60s run + 90s walk)" },
    w2: { segments: [WARM, ...repeat([R(1.5), W(2)], 6), COOL],
          desc: "6 × (90s run + 2:00 walk)" },
    w3: { segments: [WARM, ...repeat([R(1.5), W(1.5), R(3), W(3)], 2), COOL],
          desc: "2 × (90s run, 90s walk, 3:00 run, 3:00 walk)" },
    w4: { segments: [WARM, R(3), W(1.5), R(5), W(2.5), R(3), W(1.5), R(5), COOL],
          desc: "3:00 + 5:00 + 3:00 + 5:00 run, walks between" },

    w5d1: { segments: [WARM, R(5), W(3), R(5), W(3), R(5), COOL],
            desc: "3 × 5:00 run with 3:00 walks" },
    w5d2: { segments: [WARM, R(8), W(5), R(8), COOL],
            desc: "2 × 8:00 run with 5:00 walk" },
    w5d3: { segments: [WARM, R(20), COOL],
            desc: "20:00 continuous run" },

    w6d1: { segments: [WARM, R(5), W(3), R(8), W(3), R(5), COOL],
            desc: "5:00 + 8:00 + 5:00 run" },
    w6d2: { segments: [WARM, R(10), W(3), R(10), COOL],
            desc: "2 × 10:00 run with 3:00 walk" },
    w6d3: { segments: [WARM, R(25), COOL],
            desc: "25:00 continuous run" },

    w7: { segments: [WARM, R(25), COOL], desc: "25:00 continuous run" },
    w8: { segments: [WARM, R(28), COOL], desc: "28:00 continuous run" },
    w9: { segments: [WARM, R(30), COOL], desc: "30:00 continuous run — 5K!" }
  };

  const PROGRAM = [
    {
      name: "Phase 1 · Foundation",
      range: "Weeks 1–4",
      weeks: [
        { week: 1, days: [DAYS.w1, DAYS.w1, DAYS.w1] },
        { week: 2, days: [DAYS.w2, DAYS.w2, DAYS.w2] },
        { week: 3, days: [DAYS.w3, DAYS.w3, DAYS.w3] },
        { week: 4, days: [DAYS.w4, DAYS.w4, DAYS.w4] }
      ]
    },
    {
      name: "Phase 2 · Build",
      range: "Weeks 5–6",
      weeks: [
        { week: 5, days: [DAYS.w5d1, DAYS.w5d2, DAYS.w5d3] },
        { week: 6, days: [DAYS.w6d1, DAYS.w6d2, DAYS.w6d3] }
      ]
    },
    {
      name: "Phase 3 · Endurance",
      range: "Weeks 7–9",
      weeks: [
        { week: 7, days: [DAYS.w7, DAYS.w7, DAYS.w7] },
        { week: 8, days: [DAYS.w8, DAYS.w8, DAYS.w8] },
        { week: 9, days: [DAYS.w9, DAYS.w9, DAYS.w9] }
      ]
    }
  ];

  function dayId(week, dayIndex) { return `w${week}d${dayIndex + 1}`; }
  function dayLabel(week, dayIndex) { return `W${week} D${dayIndex + 1}`; }

  function totalSeconds(segments) {
    return segments.reduce((s, seg) => s + seg.sec, 0);
  }

  function flattenWeeks() {
    const out = [];
    for (const phase of PROGRAM) {
      for (const w of phase.weeks) {
        out.push({ phase, week: w });
      }
    }
    return out;
  }

  global.C25K = { PROGRAM, dayId, dayLabel, totalSeconds, flattenWeeks };
})(window);
