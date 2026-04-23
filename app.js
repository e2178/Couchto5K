const els = {
  setup: document.getElementById("setup"),
  workout: document.getElementById("workout"),
  totalMinutes: document.getElementById("totalMinutes"),
  runMinutes: document.getElementById("runMinutes"),
  runSeconds: document.getElementById("runSeconds"),
  walkMinutes: document.getElementById("walkMinutes"),
  walkSeconds: document.getElementById("walkSeconds"),
  previewSets: document.getElementById("previewSets"),
  previewPattern: document.getElementById("previewPattern"),
  previewLeftover: document.getElementById("previewLeftover"),
  startBtn: document.getElementById("startBtn"),
  phaseBanner: document.getElementById("phaseBanner"),
  phaseLabel: document.getElementById("phaseLabel"),
  phaseTimer: document.getElementById("phaseTimer"),
  totalTimer: document.getElementById("totalTimer"),
  setCounter: document.getElementById("setCounter"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

const PHASE = { RUN: "run", WALK: "walk", DONE: "done" };

const state = {
  plan: null,
  phase: PHASE.RUN,
  phaseRemaining: 0,
  totalRemaining: 0,
  currentSet: 1,
  running: false,
  intervalId: null,
  lastTick: 0,
};

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function readInputs() {
  const totalMin = Math.max(1, parseInt(els.totalMinutes.value, 10) || 0);
  const runSec =
    (parseInt(els.runMinutes.value, 10) || 0) * 60 +
    (parseInt(els.runSeconds.value, 10) || 0);
  const walkSec =
    (parseInt(els.walkMinutes.value, 10) || 0) * 60 +
    (parseInt(els.walkSeconds.value, 10) || 0);
  return { totalSeconds: totalMin * 60, runSec, walkSec };
}

function buildPlan({ totalSeconds, runSec, walkSec }) {
  if (runSec <= 0 || walkSec <= 0) return null;
  const cycle = runSec + walkSec;
  if (cycle > totalSeconds) return null;
  const sets = Math.floor(totalSeconds / cycle);
  const used = sets * cycle;
  const leftover = totalSeconds - used;
  return {
    totalSeconds: used,
    runSec,
    walkSec,
    sets,
    leftover,
    rawTotal: totalSeconds,
  };
}

function updatePreview() {
  const plan = buildPlan(readInputs());
  if (!plan) {
    els.previewSets.textContent = "—";
    els.previewPattern.textContent = "Run + walk must fit in total time";
    els.previewLeftover.textContent = "—";
    els.startBtn.disabled = true;
    return;
  }
  els.previewSets.textContent = `${plan.sets}`;
  els.previewPattern.textContent = `${formatTime(plan.runSec)} run / ${formatTime(plan.walkSec)} walk`;
  els.previewLeftover.textContent =
    plan.leftover > 0
      ? `${formatTime(plan.leftover)} (trimmed)`
      : "none";
  els.startBtn.disabled = false;
}

function setPhase(phase) {
  state.phase = phase;
  els.phaseBanner.classList.remove("run", "walk", "done");
  if (phase === PHASE.RUN) {
    els.phaseLabel.textContent = "RUN";
    els.phaseBanner.classList.add("run");
    state.phaseRemaining = state.plan.runSec;
  } else if (phase === PHASE.WALK) {
    els.phaseLabel.textContent = "WALK";
    els.phaseBanner.classList.add("walk");
    state.phaseRemaining = state.plan.walkSec;
  } else {
    els.phaseLabel.textContent = "DONE";
    els.phaseBanner.classList.add("done");
    state.phaseRemaining = 0;
  }
}

function render() {
  els.phaseTimer.textContent = formatTime(state.phaseRemaining);
  els.totalTimer.textContent = formatTime(state.totalRemaining);
  els.setCounter.textContent = `${Math.min(state.currentSet, state.plan.sets)} / ${state.plan.sets}`;
}

function beep(frequency = 880, duration = 0.25) {
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    /* audio not supported */
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function phaseStartCue(phase) {
  if (phase === PHASE.RUN) {
    beep(880, 0.2);
    setTimeout(() => beep(1175, 0.25), 220);
    vibrate([120, 80, 120]);
  } else if (phase === PHASE.WALK) {
    beep(523, 0.3);
    vibrate(200);
  } else {
    beep(659, 0.2);
    setTimeout(() => beep(784, 0.2), 220);
    setTimeout(() => beep(988, 0.4), 440);
    vibrate([200, 100, 200, 100, 400]);
  }
}

function advancePhase() {
  if (state.phase === PHASE.RUN) {
    setPhase(PHASE.WALK);
    phaseStartCue(PHASE.WALK);
  } else if (state.phase === PHASE.WALK) {
    state.currentSet += 1;
    if (state.currentSet > state.plan.sets) {
      finish();
      return;
    }
    setPhase(PHASE.RUN);
    phaseStartCue(PHASE.RUN);
  }
}

function tick() {
  const now = performance.now();
  const dt = (now - state.lastTick) / 1000;
  state.lastTick = now;

  state.phaseRemaining -= dt;
  state.totalRemaining -= dt;

  if (state.totalRemaining <= 0) {
    state.totalRemaining = 0;
    state.phaseRemaining = 0;
    render();
    finish();
    return;
  }

  if (state.phaseRemaining <= 0) {
    const overshoot = -state.phaseRemaining;
    advancePhase();
    state.phaseRemaining -= overshoot;
  }

  render();
}

function start() {
  const plan = buildPlan(readInputs());
  if (!plan) return;
  state.plan = plan;
  state.totalRemaining = plan.totalSeconds;
  state.currentSet = 1;
  setPhase(PHASE.RUN);
  render();

  els.setup.classList.add("hidden");
  els.workout.classList.remove("hidden");

  phaseStartCue(PHASE.RUN);
  resume();
}

function resume() {
  if (state.running || state.phase === PHASE.DONE) return;
  state.running = true;
  state.lastTick = performance.now();
  state.intervalId = setInterval(tick, 100);
  els.pauseBtn.textContent = "Pause";
}

function pause() {
  if (!state.running) return;
  state.running = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
  els.pauseBtn.textContent = "Resume";
}

function finish() {
  pause();
  setPhase(PHASE.DONE);
  els.phaseTimer.textContent = "00:00";
  els.totalTimer.textContent = "00:00";
  els.setCounter.textContent = `${state.plan.sets} / ${state.plan.sets}`;
  phaseStartCue(PHASE.DONE);
  els.pauseBtn.disabled = true;
}

function reset() {
  pause();
  els.pauseBtn.disabled = false;
  els.pauseBtn.textContent = "Pause";
  els.workout.classList.add("hidden");
  els.setup.classList.remove("hidden");
  updatePreview();
}

[
  els.totalMinutes,
  els.runMinutes,
  els.runSeconds,
  els.walkMinutes,
  els.walkSeconds,
].forEach((el) => el.addEventListener("input", updatePreview));

els.startBtn.addEventListener("click", start);
els.pauseBtn.addEventListener("click", () => {
  if (state.running) pause();
  else resume();
});
els.resetBtn.addEventListener("click", reset);

updatePreview();
