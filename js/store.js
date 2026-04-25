/* Persistent state: completion flags, history, settings.
 * All stored in localStorage under three keys. Subscribers notified on change. */
(function (global) {
  const KEY_COMPLETION = "c25k.completion";
  const KEY_HISTORY    = "c25k.history";
  const KEY_SETTINGS   = "c25k.settings";

  const DEFAULT_SETTINGS = {
    theme: "dark",
    audioEnabled: true,
    audioVolume: 0.7,
    vibrationEnabled: true,
    units: "km",
    autoLogEnabled: true,
    restDayReminders: false,
    restDayReminderTime: "18:00"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* quota or disabled */ }
  }

  function makeStore(key, defaults) {
    const listeners = new Set();
    let state = { ...defaults, ...read(key, {}) };

    function get() { return state; }

    function set(patch) {
      state = { ...state, ...patch };
      write(key, state);
      listeners.forEach((fn) => fn(state));
    }

    function replace(next) {
      state = next;
      write(key, state);
      listeners.forEach((fn) => fn(state));
    }

    function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

    return { get, set, replace, subscribe };
  }

  /* ---- Completion store: { 'w1d1': true, ... } ---- */
  const completion = (() => {
    let state = read(KEY_COMPLETION, {});
    const listeners = new Set();
    return {
      get() { return state; },
      isDone(id) { return !!state[id]; },
      markDone(id) {
        if (state[id]) return;
        state = { ...state, [id]: true };
        write(KEY_COMPLETION, state);
        listeners.forEach((fn) => fn(state));
      },
      reset() {
        state = {};
        write(KEY_COMPLETION, state);
        listeners.forEach((fn) => fn(state));
      },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
  })();

  /* ---- History store: array of run records ---- */
  const history = (() => {
    let runs = read(KEY_HISTORY, []);
    const listeners = new Set();
    function persist() {
      write(KEY_HISTORY, runs);
      listeners.forEach((fn) => fn(runs));
    }
    return {
      list() { return runs; },
      add(run) { runs = [run, ...runs]; persist(); },
      clear() { runs = []; persist(); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
  })();

  /* ---- Settings store ---- */
  const settings = makeStore(KEY_SETTINGS, DEFAULT_SETTINGS);

  /* Find next incomplete day across the program.
   * Returns { phase, week, weekObj, dayIndex, day, dayId, dayLabel } or null. */
  function findNextSession() {
    for (const phase of C25K.PROGRAM) {
      for (const weekObj of phase.weeks) {
        for (let di = 0; di < weekObj.days.length; di++) {
          const id = C25K.dayId(weekObj.week, di);
          if (!completion.isDone(id)) {
            return {
              phase,
              weekObj,
              week: weekObj.week,
              dayIndex: di,
              day: weekObj.days[di],
              dayId: id,
              dayLabel: C25K.dayLabel(weekObj.week, di)
            };
          }
        }
      }
    }
    return null;
  }

  function weekStatus(weekObj) {
    let done = 0;
    for (let di = 0; di < weekObj.days.length; di++) {
      if (completion.isDone(C25K.dayId(weekObj.week, di))) done++;
    }
    return { done, total: weekObj.days.length };
  }

  global.Store = { completion, history, settings, findNextSession, weekStatus };
})(window);
