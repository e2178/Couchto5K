/* App bootstrap: theme, tab navigation, and shared App.* methods. */
(function (global) {
  const screens = {
    program:  document.getElementById("programScreen"),
    workout:  document.getElementById("workoutScreen"),
    history:  document.getElementById("historyScreen"),
    settings: document.getElementById("settingsScreen")
  };

  const tabButtons = document.querySelectorAll(".tab");
  const settingsBtn = document.getElementById("settingsBtn");

  let currentTab = "program";
  let pendingWorkoutCtx = null;

  function applyTheme() {
    const s = Store.settings.get();
    const root = document.documentElement;
    let mode = s.theme;
    if (mode === "system") {
      mode = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light" : "dark";
    }
    root.dataset.theme = mode;
    if (mode === "light") {
      root.style.setProperty("--bg", "#f9fafb");
      root.style.setProperty("--bg-elevated", "#ffffff");
      root.style.setProperty("--bg-subtle", "#e5e7eb");
      root.style.setProperty("--text-primary", "#111827");
      root.style.setProperty("--text-secondary", "#4b5563");
      root.style.setProperty("--text-tertiary", "#9ca3af");
    } else {
      root.style.removeProperty("--bg");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--bg-subtle");
      root.style.removeProperty("--text-primary");
      root.style.removeProperty("--text-secondary");
      root.style.removeProperty("--text-tertiary");
    }
  }

  function showTab(name) {
    currentTab = name;
    for (const k in screens) {
      screens[k].classList.toggle("hidden", k !== name);
    }
    tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));

    /* If we leave the workout screen, stop any running timer */
    if (name !== "workout") {
      Workout.detach();
    }

    if (name === "program")  Screens.renderProgram(screens.program);
    if (name === "workout")  Screens.renderWorkout(screens.workout, pendingWorkoutCtx);
    if (name === "history")  Screens.renderHistory(screens.history);
    if (name === "settings") Screens.renderSettings(screens.settings);

    if (name === "workout") pendingWorkoutCtx = null;
  }

  /* Public API used from Screens / Workout */
  global.App = {
    startSession(ctx) {
      pendingWorkoutCtx = ctx;
      showTab("workout");
    },
    afterRunLogged() {
      /* When a session is logged, take the user to History to see the result. */
      showTab("history");
    },
    showTab
  };

  /* Wire tabs */
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  settingsBtn.addEventListener("click", () => {
    /* Settings screen is not in the bottom tab bar; clear active state. */
    showTab("settings");
    tabButtons.forEach((b) => b.classList.remove("active"));
  });

  /* React to settings changes (units, theme, etc.) */
  Store.settings.subscribe(() => {
    applyTheme();
    if (currentTab === "history") Screens.renderHistory(screens.history);
  });

  /* React to theme changes */
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", applyTheme);
  }

  applyTheme();
  showTab("program");
})(window);
