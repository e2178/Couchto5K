/* Render functions for all four screens + the log run modal. */
(function (global) {
  const { el, clear, formatTime, formatTimeLoose, relativeDate,
          formatPace, formatDistance, formatDistanceShort, computePace } = Utils;

  /* Per-week expansion override: undefined = use default, true/false = user choice. */
  const weekOverride = {};

  /* ---- Segment bar (shared) ---- */

  function buildSegmentBar(segments, opts) {
    opts = opts || {};
    const bar = el("div", { class: opts.classBase || "segment-bar" });
    segments.forEach((seg, i) => {
      const cls = ["seg", seg.kind];
      if (opts.activeIndex != null) {
        if (i < opts.activeIndex) cls.push("completed");
        else if (i === opts.activeIndex) cls.push("active");
      }
      const node = el("div", {
        class: cls.join(" "),
        style: { flex: `${seg.sec} ${seg.sec} 0` }
      });
      bar.appendChild(node);
    });
    return bar;
  }

  /* ---- Program screen ---- */

  function renderProgram(root) {
    clear(root);
    const next = Store.findNextSession();
    const nextId = next ? next.dayId : null;

    /* Default expansion: current (first incomplete) week, unless user toggled. */
    const defaultExpandedWeek = next ? next.week : null;

    for (const phase of C25K.PROGRAM) {
      root.appendChild(el("div", { class: "phase-header" }, [
        el("span", { class: "phase-header-name" }, phase.name),
        el("span", { class: "phase-header-range" }, phase.range)
      ]));

      for (const weekObj of phase.weeks) {
        const status = Store.weekStatus(weekObj);
        const isComplete = status.done === status.total;
        const defaultExpanded = !isComplete && weekObj.week === defaultExpandedWeek;
        const isExpanded = weekObj.week in weekOverride
          ? weekOverride[weekObj.week]
          : defaultExpanded;

        const card = el("div", {
          class: "week-card" + (isComplete ? " completed" : "") + (isExpanded ? " expanded" : "")
        });

        const badge = isComplete
          ? el("div", { class: "week-badge" }, [
              el("div", { class: "check", html: `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                     stroke="currentColor" stroke-width="3"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>` })
            ])
          : el("div", { class: "week-badge" }, [
              el("div", { class: "chev", html: `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>` })
            ]);

        const header = el("div", { class: "week-header",
          onclick: () => {
            weekOverride[weekObj.week] = !isExpanded;
            renderProgram(root);
          }
        }, [
          el("div", null, [
            el("div", { class: "week-title" }, `Week ${weekObj.week}`),
            el("div", { class: "week-meta" }, `${status.done} / ${status.total} runs complete`)
          ]),
          badge
        ]);
        card.appendChild(header);

        const body = el("div", { class: "week-body" });

        weekObj.days.forEach((day, di) => {
          const id = C25K.dayId(weekObj.week, di);
          const done = Store.completion.isDone(id);
          const isNext = id === nextId;
          const total = C25K.totalSeconds(day.segments);

          const startBtn = done
            ? el("span", { class: "day-done" }, [
                el("span", { html: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` }),
                "Done"
              ])
            : el("button", {
                class: "btn btn-sm " + (isNext ? "btn-primary" : "btn-ghost"),
                onclick: () => global.App.startSession({
                  week: weekObj.week, dayIndex: di, day, dayId: id
                })
              }, "Start");

          const row = el("div", { class: "day-row" }, [
            el("div", { class: "day-row-header" }, [
              el("div", null, [
                el("div", { class: "day-title" }, [
                  C25K.dayLabel(weekObj.week, di),
                  el("span", { class: "day-total" }, `total ${formatTimeLoose(total)}`)
                ]),
                el("div", { class: "day-desc" }, day.desc)
              ]),
              el("div", { class: "day-row-actions" }, [startBtn])
            ]),
            buildSegmentBar(day.segments)
          ]);
          body.appendChild(row);
        });

        if (isExpanded) {
          body.appendChild(el("div", { class: "legend" }, [
            el("div", { class: "legend-item" }, [
              el("span", { class: "legend-swatch run" }), "Run"
            ]),
            el("div", { class: "legend-item" }, [
              el("span", { class: "legend-swatch walk" }), "Walk"
            ])
          ]));
        }

        card.appendChild(body);
        root.appendChild(card);
      }
    }
  }

  /* ---- Workout screen ---- */

  function renderWorkout(root, ctx) {
    clear(root);

    if (!ctx) {
      const next = Store.findNextSession();
      if (!next) {
        root.appendChild(el("div", { class: "card empty-state" }, [
          el("h3", null, "Program complete"),
          el("p", null, "All 9 weeks done. Reset progress in Settings to run it again."),
        ]));
        return;
      }
      ctx = {
        week: next.week,
        dayIndex: next.dayIndex,
        day: next.day,
        dayId: next.dayId
      };
    }

    const total = C25K.totalSeconds(ctx.day.segments);

    /* Containers updated by the workout state machine */
    const phasePill = el("div", { class: "phase-pill", id: "wPhasePill" }, "READY");
    const phaseTimer = el("div", { class: "timer", id: "wPhaseTimer" }, formatTime(ctx.day.segments[0].sec));
    const totalTimer = el("div", { class: "stat-value", id: "wTotalTimer" }, formatTime(total));
    const segCounter = el("div", { class: "stat-value", id: "wSegCounter" }, `1 / ${ctx.day.segments.length}`);
    const segments = buildSegmentBar(ctx.day.segments, { classBase: "workout-segments", activeIndex: -1 });
    segments.id = "wSegments";

    const startBtn = el("button", { class: "btn btn-primary btn-block", id: "wStartBtn" }, "Start");
    const finishBtn = el("button", { class: "btn btn-quiet btn-block", id: "wFinishBtn", style: { display: "none" } }, "Finish early");

    const card = el("div", { class: "card workout-card" }, [
      el("div", { class: "workout-meta" }, [
        el("span", { class: "workout-week" }, `Week ${ctx.week} · Day ${ctx.dayIndex + 1}`),
        el("span", { class: "workout-desc" }, ctx.day.desc)
      ]),
      phasePill,
      phaseTimer,
      el("div", { class: "timer-label" }, "phase time remaining"),
      segments,
      el("div", { class: "stats" }, [
        el("div", { class: "stat" }, [
          totalTimer,
          el("div", { class: "stat-label" }, "total remaining")
        ]),
        el("div", { class: "stat" }, [
          segCounter,
          el("div", { class: "stat-label" }, "segment")
        ])
      ]),
      el("div", { class: "workout-controls" }, [startBtn, finishBtn])
    ]);

    root.appendChild(card);

    /* Hand off to the workout state machine */
    Workout.attach({
      ctx,
      els: { phasePill, phaseTimer, totalTimer, segCounter, segments, startBtn, finishBtn }
    });
  }

  /* ---- History screen ---- */

  function renderHistory(root) {
    clear(root);
    const runs = Store.history.list();
    const units = Store.settings.get().units;

    /* Stats */
    const totalKm = runs.reduce((s, r) => s + r.distanceKm, 0);
    const avgPace = runs.length
      ? Math.round(runs.reduce((s, r) => s + r.paceSecondsPerKm, 0) / runs.length)
      : 0;

    root.appendChild(el("div", { class: "stats-row" }, [
      el("div", { class: "stats-tile" }, [
        el("div", { class: "stats-tile-value" }, String(runs.length)),
        el("div", { class: "stats-tile-label" }, "Runs")
      ]),
      el("div", { class: "stats-tile" }, [
        el("div", { class: "stats-tile-value" }, avgPace ? formatPace(avgPace, units).split(" ")[0] : "—"),
        el("div", { class: "stats-tile-label" }, units === "mi" ? "Avg /mi" : "Avg /km")
      ]),
      el("div", { class: "stats-tile" }, [
        el("div", { class: "stats-tile-value" }, formatDistanceShort(totalKm, units).split(" ")[0]),
        el("div", { class: "stats-tile-label" }, units === "mi" ? "Total mi" : "Total km")
      ])
    ]));

    if (runs.length === 0) {
      root.appendChild(el("div", { class: "card history-empty" }, [
        el("p", null, "No runs logged yet."),
        el("p", { style: { marginTop: "8px", fontSize: "0.85rem" } }, "Complete a session or log one manually below.")
      ]));
    } else {
      const list = el("div", { class: "history-list" });
      for (const run of runs) {
        const labelText = run.title
          ? `${run.weekLabel ? run.weekLabel + " · " : ""}${run.title}`
          : (run.weekLabel || (run.source === "manual" ? "Manual run" : "Run"));

        list.appendChild(el("div", { class: "run-row" }, [
          el("div", { class: "run-row-top" }, [
            el("div", { class: "run-label" }, labelText),
            el("div", { class: "run-pace" }, formatPace(run.paceSecondsPerKm, units))
          ]),
          el("div", { class: "run-row-bottom" },
            `${formatDistance(run.distanceKm, units)} · ${formatTimeLoose(run.durationSeconds)} · ${relativeDate(run.date)}`
          )
        ]));
      }
      root.appendChild(list);
    }

    root.appendChild(el("button", {
      class: "btn btn-secondary btn-block",
      style: { marginTop: "12px" },
      onclick: () => openManualLogModal()
    }, "+ Log run manually"));
  }

  /* ---- Settings screen ---- */

  function renderSettings(root) {
    clear(root);
    const s = Store.settings.get();

    function rowToggle(label, sub, key) {
      const input = el("input", { type: "checkbox" });
      input.checked = !!s[key];
      input.addEventListener("change", () => {
        Store.settings.set({ [key]: input.checked });
        renderSettings(root);
      });
      return el("div", { class: "settings-row" }, [
        el("div", null, [
          el("div", { class: "settings-row-label" }, label),
          sub ? el("div", { class: "settings-row-sub" }, sub) : null
        ]),
        el("label", { class: "toggle" }, [input, el("span", { class: "slider" })])
      ]);
    }

    function rowSegmented(label, key, options) {
      const seg = el("div", { class: "segmented" });
      for (const opt of options) {
        const btn = el("button", {
          class: s[key] === opt.value ? "active" : "",
          onclick: () => { Store.settings.set({ [key]: opt.value }); renderSettings(root); }
        }, opt.label);
        seg.appendChild(btn);
      }
      return el("div", { class: "settings-row" }, [
        el("div", { class: "settings-row-label" }, label),
        seg
      ]);
    }

    function section(title, rows) {
      return el("div", { class: "settings-section" },
        [el("div", { class: "settings-section-title" }, title), ...rows]);
    }

    /* Appearance */
    root.appendChild(section("Appearance", [
      rowSegmented("Theme", "theme", [
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "system", label: "System" }
      ])
    ]));

    /* Audio & haptics */
    const volumeSlider = el("input", {
      type: "range", min: "0", max: "100", value: String(Math.round(s.audioVolume * 100))
    });
    volumeSlider.addEventListener("input", () => {
      Store.settings.set({ audioVolume: Number(volumeSlider.value) / 100 });
    });
    root.appendChild(section("Audio & haptics", [
      rowToggle("Interval tones", "Play a beep at every phase change", "audioEnabled"),
      el("div", { class: "settings-row" }, [
        el("div", { class: "settings-row-label" }, "Tone volume"),
        volumeSlider
      ]),
      rowToggle("Vibration", "Buzz at phase transitions (where supported)", "vibrationEnabled")
    ]));

    /* Units */
    root.appendChild(section("Units", [
      rowSegmented("Distance", "units", [
        { value: "km", label: "km" },
        { value: "mi", label: "miles" }
      ])
    ]));

    /* History */
    root.appendChild(section("History", [
      rowToggle("Auto-log completed runs", "Prompt for distance after each session", "autoLogEnabled")
    ]));

    /* Reminders */
    const timeInput = el("input", { type: "time", value: s.restDayReminderTime });
    timeInput.disabled = !s.restDayReminders;
    timeInput.style.maxWidth = "120px";
    timeInput.addEventListener("change", () => {
      Store.settings.set({ restDayReminderTime: timeInput.value });
    });
    root.appendChild(section("Reminders", [
      rowToggle("Rest day reminders", "Remind you to lace up", "restDayReminders"),
      el("div", { class: "settings-row" }, [
        el("div", { class: "settings-row-label" }, "Reminder time"),
        timeInput
      ])
    ]));

    /* Program */
    root.appendChild(section("Program", [
      el("button", {
        class: "btn btn-danger btn-block",
        onclick: () => openConfirmModal({
          title: "Reset progress?",
          body: "Clears all completion checkmarks. Logged runs are kept.",
          confirmLabel: "Reset progress",
          onConfirm: () => { Store.completion.reset(); renderSettings(root); }
        })
      }, "Reset progress"),
      el("button", {
        class: "btn btn-danger btn-block",
        onclick: () => openConfirmModal({
          title: "Clear history?",
          body: "Deletes every logged run permanently.",
          confirmLabel: "Clear history",
          onConfirm: () => { Store.history.clear(); renderSettings(root); }
        })
      }, "Clear history")
    ]));
  }

  /* ---- Modals ---- */

  function openModal(content) {
    const root = document.getElementById("modalRoot");
    clear(root);
    root.appendChild(content);
    root.classList.remove("hidden");
  }

  function closeModal() {
    const root = document.getElementById("modalRoot");
    root.classList.add("hidden");
    clear(root);
  }

  function openConfirmModal({ title, body, confirmLabel, danger, onConfirm }) {
    const modal = el("div", { class: "modal" }, [
      el("h3", null, title),
      el("p", null, body),
      el("div", { class: "modal-actions" }, [
        el("button", { class: "btn btn-secondary", onclick: closeModal }, "Cancel"),
        el("button", {
          class: "btn " + (danger === false ? "btn-primary" : "btn-danger"),
          onclick: () => { closeModal(); onConfirm && onConfirm(); }
        }, confirmLabel || "Confirm")
      ])
    ]);
    openModal(modal);
  }

  /* Auto-log modal: shown after a session completes (full or early) */
  function openAutoLogModal({ durationSeconds, weekLabel, title, dayId, partial }) {
    if (!Store.settings.get().autoLogEnabled) {
      if (dayId && !partial) Store.completion.markDone(dayId);
      return;
    }
    const distInput = el("input", { type: "number", min: "0", step: "0.01", placeholder: "e.g. 2.5" });
    setTimeout(() => distInput.focus(), 50);

    const error = el("div", { style: { color: "var(--danger)", fontSize: "0.8rem", display: "none" } }, "");

    function submit() {
      const km = parseFloat(distInput.value);
      if (!km || km <= 0) {
        error.textContent = "Enter a distance greater than 0.";
        error.style.display = "block";
        return;
      }
      const run = {
        id: Date.now().toString(36),
        date: new Date().toISOString(),
        weekLabel: weekLabel || undefined,
        title: title || undefined,
        distanceKm: km,
        durationSeconds,
        paceSecondsPerKm: computePace(durationSeconds, km),
        source: "auto"
      };
      Store.history.add(run);
      if (dayId && !partial) Store.completion.markDone(dayId);
      closeModal();
      global.App.afterRunLogged();
    }

    const modal = el("div", { class: "modal" }, [
      el("h3", null, partial ? "Log partial run?" : "Log this run?"),
      el("p", null, partial
        ? "You finished early. Enter the distance you covered."
        : "Nice work. Enter the distance you covered."),
      el("div", { class: "modal-field" }, [
        el("label", null, "Duration"),
        el("div", { style: { fontSize: "1.1rem", fontWeight: "600" } }, formatTimeLoose(durationSeconds))
      ]),
      el("div", { class: "modal-field" }, [
        el("label", null, "Distance (km)"),
        distInput,
        error
      ]),
      el("div", { class: "modal-actions" }, [
        el("button", {
          class: "btn btn-secondary",
          onclick: () => { if (dayId && !partial) Store.completion.markDone(dayId); closeModal(); global.App.afterRunLogged(); }
        }, "Skip"),
        el("button", { class: "btn btn-primary", onclick: submit }, "Save")
      ])
    ]);
    openModal(modal);
  }

  function openManualLogModal() {
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = el("input", { type: "date", value: today });
    const labelInput = el("input", { type: "text", placeholder: "e.g. W3 D1, lunchtime jog" });
    const distInput = el("input", { type: "number", min: "0", step: "0.01", placeholder: "Distance" });
    const minInput = el("input", { type: "number", min: "0", placeholder: "min" });
    const secInput = el("input", { type: "number", min: "0", max: "59", placeholder: "sec" });
    const error = el("div", { style: { color: "var(--danger)", fontSize: "0.8rem", display: "none" } }, "");

    function submit() {
      const km = parseFloat(distInput.value);
      const min = parseInt(minInput.value, 10) || 0;
      const sec = parseInt(secInput.value, 10) || 0;
      const duration = min * 60 + sec;
      if (!km || km <= 0 || duration <= 0) {
        error.textContent = "Enter both distance and duration.";
        error.style.display = "block";
        return;
      }
      const isoDate = dateInput.value
        ? new Date(dateInput.value + "T12:00:00").toISOString()
        : new Date().toISOString();
      Store.history.add({
        id: Date.now().toString(36),
        date: isoDate,
        weekLabel: labelInput.value.trim() || undefined,
        distanceKm: km,
        durationSeconds: duration,
        paceSecondsPerKm: computePace(duration, km),
        source: "manual"
      });
      closeModal();
      global.App.afterRunLogged();
    }

    const modal = el("div", { class: "modal" }, [
      el("h3", null, "Log a run"),
      el("div", { class: "modal-field" }, [
        el("label", null, "Date"),
        dateInput
      ]),
      el("div", { class: "modal-field" }, [
        el("label", null, "Label (optional)"),
        labelInput
      ]),
      el("div", { class: "modal-field" }, [
        el("label", null, "Distance (km)"),
        distInput
      ]),
      el("div", { class: "modal-field" }, [
        el("label", null, "Duration"),
        el("div", { class: "duration-inputs" }, [
          minInput, el("span", null, "min"),
          secInput, el("span", null, "sec")
        ])
      ]),
      error,
      el("div", { class: "modal-actions" }, [
        el("button", { class: "btn btn-secondary", onclick: closeModal }, "Cancel"),
        el("button", { class: "btn btn-primary", onclick: submit }, "Save")
      ])
    ]);
    openModal(modal);
  }

  global.Screens = {
    renderProgram,
    renderWorkout,
    renderHistory,
    renderSettings,
    openAutoLogModal,
    openManualLogModal,
    openConfirmModal,
    closeModal
  };
})(window);
