/* js/training.js */

const TrainingPage = (() => {
  // Active timer state: { [exerciseId]: { remaining, intervalId } }
  const timers = {};
  let audioCtx = null;

  // ——— Audio ———
  function unlockAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Play a silent buffer — required to unlock iOS Safari audio
    try {
      const buf = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start(0);
    } catch {}
  }

  function beep(freq = 880, duration = 0.08, gain = 0.25) {
    try {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  function beepFinish() {
    beep(1046, 0.12, 0.3);
    setTimeout(() => beep(1318, 0.2, 0.35), 160);
  }

  // ——— Timer ———
  function startTimer(id) {
    unlockAudio(); // must be called on user tap to unlock iOS audio
    if (timers[id]) { stopTimer(id); return; }

    const duration = EXERCISES[id].duration;
    timers[id] = { remaining: duration };

    updateTimerBtn(id);

    timers[id].intervalId = setInterval(() => {
      timers[id].remaining--;
      const r = timers[id].remaining;

      if (r > 0) beep(r <= 3 ? 880 : 660, 0.07, 0.2);
      if (r <= 0) {
        clearInterval(timers[id].intervalId);
        delete timers[id];
        beepFinish();
        updateTimerBtn(id, true);
        return;
      }
      updateTimerBtn(id);
    }, 1000);
  }

  function stopTimer(id) {
    if (timers[id]) {
      clearInterval(timers[id].intervalId);
      delete timers[id];
    }
    updateTimerBtn(id);
  }

  function stopAllTimers() {
    Object.keys(timers).forEach(id => {
      clearInterval(timers[id].intervalId);
      delete timers[id];
    });
  }

  function updateTimerBtn(id, finished = false) {
    const btn = document.getElementById(`timer-btn-${id}`);
    if (!btn) return;
    if (finished) {
      btn.textContent = '✓';
      btn.style.background = 'var(--green)';
      btn.style.color = '#fff';
      setTimeout(() => {
        if (!timers[id]) {
          btn.textContent = EXERCISES[id].duration + 's';
          btn.style.background = '';
          btn.style.color = '';
        }
      }, 2000);
      return;
    }
    if (timers[id]) {
      const r = timers[id].remaining;
      btn.textContent = r + 's';
      btn.style.background = r <= 3 ? 'var(--red)' : 'var(--orange)';
      btn.style.color = '#fff';
    } else {
      btn.textContent = EXERCISES[id].duration + 's';
      btn.style.background = '';
      btn.style.color = '';
    }
  }

  // ——— Render ———
  function render() {
    stopAllTimers();
    const page = document.getElementById('page-training');
    const todayType = AppDB.getTodayTrainingType();
    if (!AppDB.getTodayTraining()) AppDB.initTodayTraining(todayType);
    const training = AppDB.getTodayTraining();
    renderContent(page, training);
  }

  function renderContent(page, training) {
    const exercises = TRAINING_PLANS[training.type];
    const done = training.exercises || {};
    const completedCount = exercises.filter(id => done[id]).length;

    const exerciseItems = exercises.map(id => {
      const ex = EXERCISES[id];
      const checked = !!done[id];
      return `
        <div class="exercise-card ${checked ? 'checked' : ''}" id="ex-card-${id}">
          <div class="exercise-main">
            <div class="exercise-check ${checked ? 'checked' : ''}" id="check-${id}" data-id="${id}">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <div class="exercise-info">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-reps">${ex.sets} · ${ex.reps}</div>
            </div>
            <button class="timer-btn" id="timer-btn-${id}" data-timer="${id}"
              aria-label="计时 ${ex.duration} 秒">${ex.duration}s</button>
            <button class="exercise-expand-btn" data-expand="${id}" aria-label="展开说明">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
          </div>
          <div class="exercise-desc" id="desc-${id}">${ex.desc}</div>
        </div>`;
    }).join('');

    const btnText = training.finished
      ? `✓ 今日训练已完成`
      : `完成今日训练 (${completedCount}/${exercises.length})`;

    page.innerHTML = `
      <div class="training-header">
        <div class="section-title" style="margin-bottom:8px">
          ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
        <div class="type-toggle">
          <button class="type-btn ${training.type === 'A' ? 'active' : ''}" id="type-a-btn">训练 A</button>
          <button class="type-btn ${training.type === 'B' ? 'active' : ''}" id="type-b-btn">训练 B</button>
        </div>
      </div>

      <div class="exercise-list">${exerciseItems}</div>

      ${training.finished ? `
        <div class="training-done-msg">
          🎉 完成于 ${new Date(training.finishedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>` : ''}

      <div class="complete-wrap">
        <button class="complete-btn" id="complete-btn" ${training.finished ? 'disabled' : ''}>
          ${btnText}
        </button>
      </div>
    `;

    // Timer buttons
    page.querySelectorAll('[data-timer]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        startTimer(btn.dataset.timer);
      });
    });

    // Exercise check
    page.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        if (AppDB.getTodayTraining()?.finished) return;
        AppDB.toggleExercise(el.dataset.id);
        render();
      });
    });

    // Exercise card click
    page.querySelectorAll('.exercise-main').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-expand]') || e.target.closest('[data-timer]')) return;
        if (AppDB.getTodayTraining()?.finished) return;
        const checkEl = el.querySelector('[data-id]');
        if (checkEl) { AppDB.toggleExercise(checkEl.dataset.id); render(); }
      });
    });

    // Expand buttons
    page.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const desc = document.getElementById(`desc-${btn.dataset.expand}`);
        btn.classList.toggle('open');
        desc?.classList.toggle('open');
      });
    });

    // Type toggle
    const canSwitch = !training.finished && !Object.values(training.exercises).some(Boolean);
    document.getElementById('type-a-btn')?.addEventListener('click', () => {
      if (!canSwitch) { AppUI.toast('已开始训练，无法切换类型'); return; }
      switchType('A');
    });
    document.getElementById('type-b-btn')?.addEventListener('click', () => {
      if (!canSwitch) { AppUI.toast('已开始训练，无法切换类型'); return; }
      switchType('B');
    });

    // Complete
    document.getElementById('complete-btn')?.addEventListener('click', () => {
      stopAllTimers();
      AppDB.completeTraining();
      AppUI.toast('🎉 太棒了！今日训练完成');
      render();
    });
  }

  function switchType(type) {
    const db = AppDB.get();
    const today = AppDB.dateStr();
    const exercises = {};
    TRAINING_PLANS[type].forEach(id => { exercises[id] = false; });
    db.trainings[today] = { type, exercises, finished: false, startedAt: Date.now(), finishedAt: null };
    AppDB.save(db);
    render();
  }

  return { render };
})();
