/* Pure helpers: time formatting, pace, unit conversion, audio tones, vibration. */
(function (global) {
  /* ---- Time ---- */

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function formatTimeLoose(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function relativeDate(iso) {
    const then = new Date(iso);
    const now = new Date();
    const sameDay = then.toDateString() === now.toDateString();
    if (sameDay) return "Today";
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (then.toDateString() === yesterday.toDateString()) return "Yesterday";
    const diffDays = Math.round((now - then) / 86400000);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
    return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* ---- Pace ---- */

  function computePace(durationSeconds, distanceKm) {
    if (!distanceKm || distanceKm <= 0) return 0;
    return Math.round(durationSeconds / distanceKm);
  }

  function formatPace(secondsPerKm, units) {
    if (!secondsPerKm) return "—";
    const perUnit = units === "mi" ? secondsPerKm * 1.60934 : secondsPerKm;
    const m = Math.floor(perUnit / 60);
    const s = Math.round(perUnit % 60);
    const label = units === "mi" ? "/mi" : "/km";
    return `${m}:${String(s).padStart(2, "0")} ${label}`;
  }

  function formatDistance(km, units) {
    if (units === "mi") return `${(km / 1.60934).toFixed(2)} mi`;
    return `${km.toFixed(2)} km`;
  }

  function formatDistanceShort(km, units) {
    if (units === "mi") return `${(km / 1.60934).toFixed(1)} mi`;
    return `${km.toFixed(1)} km`;
  }

  /* ---- Audio tones (Web Audio) ---- */

  function audioCtx() {
    if (audioCtx.ctx) return audioCtx.ctx;
    try {
      audioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return null; }
    return audioCtx.ctx;
  }

  function beep(frequency, duration, volume) {
    const ctx = audioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const peak = Math.max(0.0001, Math.min(0.4, volume));
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playTone(kind) {
    const s = Store.settings.get();
    if (!s.audioEnabled) return;
    const v = s.audioVolume;
    if (kind === "run") {
      beep(880, 0.18, v * 0.4);
      setTimeout(() => beep(1175, 0.22, v * 0.4), 200);
    } else if (kind === "walk") {
      beep(523, 0.28, v * 0.4);
    } else if (kind === "complete") {
      beep(659, 0.18, v * 0.4);
      setTimeout(() => beep(784, 0.18, v * 0.4), 200);
      setTimeout(() => beep(988, 0.36, v * 0.4), 400);
    }
  }

  function vibrate(pattern) {
    const s = Store.settings.get();
    if (!s.vibrationEnabled) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function phaseStartCue(phase) {
    if (phase === "run")  { playTone("run");  vibrate([120, 80, 120]); }
    if (phase === "walk") { playTone("walk"); vibrate(200); }
    if (phase === "done") { playTone("complete"); vibrate([200, 100, 200, 100, 400]); }
  }

  /* ---- DOM helpers ---- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "style") Object.assign(node.style, attrs[k]);
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] !== false && attrs[k] != null) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children != null) {
      const list = Array.isArray(children) ? children : [children];
      for (const c of list) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  global.Utils = {
    formatTime, formatTimeLoose, relativeDate,
    computePace, formatPace, formatDistance, formatDistanceShort,
    playTone, vibrate, phaseStartCue,
    el, clear
  };
})(window);
