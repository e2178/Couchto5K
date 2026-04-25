/* Workout state machine: drives the segment timer, phase pill, and segment bar.
 * Attached to a freshly rendered workout screen via Workout.attach({ ctx, els }). */
(function (global) {
  const { formatTime, formatTimeLoose, phaseStartCue } = Utils;

  const state = {
    ctx: null,
    els: null,
    segments: null,
    activeIndex: 0,
    segmentRemaining: 0,
    totalRemaining: 0,
    running: false,
    intervalId: null,
    lastTick: 0,
    elapsed: 0,
    finished: false
  };

  function detach() {
    if (state.intervalId) clearInterval(state.intervalId);
    state.running = false;
    state.intervalId = null;
    state.ctx = null;
    state.els = null;
    state.segments = null;
    state.finished = false;
    state.elapsed = 0;
  }

  function attach({ ctx, els }) {
    detach();
    state.ctx = ctx;
    state.els = els;
    state.segments = ctx.day.segments;
    state.activeIndex = 0;
    state.segmentRemaining = state.segments[0].sec;
    state.totalRemaining = state.segments.reduce((s, seg) => s + seg.sec, 0);
    state.elapsed = 0;
    state.finished = false;
    renderPhase();
    renderTimers();
    bindControls();
  }

  function bindControls() {
    state.els.startBtn.onclick = () => {
      if (state.finished) return;
      if (state.running) pause();
      else if (state.elapsed === 0) start();
      else resume();
    };
    state.els.finishBtn.onclick = () => onFinishEarly();
  }

  function currentSegment() { return state.segments[state.activeIndex]; }

  function renderPhase() {
    const seg = currentSegment();
    if (!seg) return;
    const pill = state.els.phasePill;
    pill.classList.remove("run", "walk", "done");
    if (state.finished) {
      pill.classList.add("done");
      pill.textContent = "DONE";
    } else {
      pill.classList.add(seg.kind);
      pill.textContent = seg.kind === "run" ? "RUN" : "WALK";
    }
    rebuildSegmentBar();
  }

  function rebuildSegmentBar() {
    const container = state.els.segments;
    while (container.firstChild) container.removeChild(container.firstChild);
    state.segments.forEach((seg, i) => {
      const cls = ["seg", seg.kind];
      if (state.finished || i < state.activeIndex) cls.push("completed");
      else if (i === state.activeIndex && state.running) cls.push("active");
      const node = document.createElement("div");
      node.className = cls.join(" ");
      node.style.flex = `${seg.sec} ${seg.sec} 0`;
      container.appendChild(node);
    });
  }

  function renderTimers() {
    state.els.phaseTimer.textContent = formatTime(state.segmentRemaining);
    state.els.totalTimer.textContent = formatTime(state.totalRemaining);
    state.els.segCounter.textContent = `${Math.min(state.activeIndex + 1, state.segments.length)} / ${state.segments.length}`;
  }

  function tick() {
    const now = performance.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    state.segmentRemaining -= dt;
    state.totalRemaining -= dt;
    state.elapsed += dt;

    if (state.totalRemaining <= 0) {
      state.totalRemaining = 0;
      state.segmentRemaining = 0;
      finish();
      return;
    }

    if (state.segmentRemaining <= 0) {
      const overshoot = -state.segmentRemaining;
      advanceSegment();
      state.segmentRemaining -= overshoot;
    }

    renderTimers();
  }

  function advanceSegment() {
    state.activeIndex += 1;
    if (state.activeIndex >= state.segments.length) {
      finish();
      return;
    }
    state.segmentRemaining = state.segments[state.activeIndex].sec;
    renderPhase();
    phaseStartCue(state.segments[state.activeIndex].kind);
  }

  function start() {
    if (state.finished) return;
    state.running = true;
    state.lastTick = performance.now();
    state.intervalId = setInterval(tick, 100);
    state.els.startBtn.textContent = "Pause";
    state.els.startBtn.classList.remove("btn-primary");
    state.els.startBtn.classList.add("btn-secondary");
    state.els.finishBtn.style.display = "block";
    phaseStartCue(currentSegment().kind);
    rebuildSegmentBar();
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.els.startBtn.textContent = "Resume";
    rebuildSegmentBar();
  }

  function resume() {
    if (state.running || state.finished) return;
    state.running = true;
    state.lastTick = performance.now();
    state.intervalId = setInterval(tick, 100);
    state.els.startBtn.textContent = "Pause";
    rebuildSegmentBar();
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    state.running = false;
    if (state.intervalId) clearInterval(state.intervalId);
    state.intervalId = null;
    state.activeIndex = state.segments.length - 1;
    state.segmentRemaining = 0;
    state.totalRemaining = 0;

    state.els.startBtn.disabled = true;
    state.els.startBtn.textContent = "Complete";
    state.els.finishBtn.style.display = "none";
    renderPhase();
    renderTimers();
    phaseStartCue("done");

    const ctx = state.ctx;
    const elapsed = Math.round(state.elapsed) || ctx.day.segments.reduce((s, seg) => s + seg.sec, 0);

    Screens.openAutoLogModal({
      durationSeconds: elapsed,
      weekLabel: `W${ctx.week} D${ctx.dayIndex + 1}`,
      dayId: ctx.dayId,
      partial: false
    });
  }

  function onFinishEarly() {
    if (state.finished) return;
    Screens.openConfirmModal({
      title: "Finish early?",
      body: "This will stop the timer and log a partial run.",
      confirmLabel: "Finish",
      onConfirm: () => {
        const ctx = state.ctx;
        const elapsed = Math.round(state.elapsed);

        state.finished = true;
        state.running = false;
        if (state.intervalId) clearInterval(state.intervalId);
        state.intervalId = null;

        state.els.startBtn.disabled = true;
        state.els.startBtn.textContent = "Stopped";
        state.els.finishBtn.style.display = "none";
        renderPhase();
        renderTimers();

        if (elapsed <= 0) {
          global.App.afterRunLogged();
          return;
        }

        Screens.openAutoLogModal({
          durationSeconds: elapsed,
          weekLabel: `W${ctx.week} D${ctx.dayIndex + 1}`,
          dayId: ctx.dayId,
          partial: true
        });
      }
    });
  }

  global.Workout = { attach, detach };
})(window);
