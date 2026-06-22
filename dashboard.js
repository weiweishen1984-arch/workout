/* js/dashboard.js */

const DashboardPage = (() => {
  const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

  function render() {
    const page = document.getElementById('page-dashboard');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ws = AppDB.weekStart(today);
    const weekDone = AppDB.getWeeklyCompletion(ws);
    const streak = AppDB.getStreak();
    const pct = Math.round((weekDone / 7) * 100);
    const circumference = 2 * Math.PI * 52; // r=52 → 326.73
    const offset = circumference * (1 - weekDone / 7);
    const todayStr = AppDB.dateStr(today);
    const todayTraining = AppDB.getTodayTraining();
    const todayType = AppDB.getTodayTrainingType();
    const todayDone = todayTraining?.finished;

    // Build week day dots
    const weekDots = DAY_LABELS.map((label, i) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      const ds = AppDB.dateStr(d);
      const t = AppDB.getTraining(ds);
      const isToday = ds === todayStr;
      const isDone = t?.finished;
      const isFuture = d > today;
      let cls = 'week-day-dot';
      if (isDone) cls += ' done';
      if (isToday) cls += ' today';
      if (isFuture && !isToday) cls += ' rest';
      const content = isDone
        ? `<svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
        : (t?.type || (isToday ? todayType : ''));
      return `
        <div class="week-day">
          <span class="week-day-label">${label}</span>
          <div class="${cls}">${content}</div>
        </div>`;
    }).join('');

    page.innerHTML = `
      <div class="dashboard-title">
        <span class="dashboard-title-sub">Vivi's</span>
        <span class="dashboard-title-main">Home Workout</span>
      </div>

      <div class="dashboard-hero">
        <div class="hero-left">
          <div class="ring-wrap">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <circle class="ring-track" cx="60" cy="60" r="52"/>
              <circle class="ring-fill" id="ring-fill" cx="60" cy="60" r="52"
                style="stroke-dasharray:${circumference.toFixed(1)};stroke-dashoffset:${circumference.toFixed(1)}"/>
            </svg>
            <div class="ring-center">
              <span class="ring-pct" id="ring-pct">0%</span>
              <span class="ring-label">本周完成</span>
            </div>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-val accent">${streak}</span>
              <span class="stat-label">连续打卡天数</span>
            </div>
            <div class="stat-item">
              <span class="stat-val orange">${weekDone}/7</span>
              <span class="stat-label">本周训练次数</span>
            </div>
          </div>
        </div>
        <div class="hero-image-wrap">
          <img src="fitness-exercise-tool-set-sport-equipment-with-dumbbell-yoga-mat-mineral-water-health-care-healthy-concept-minimal-cartoon-purple-pastel-background-banner-3d-render-illustration_598821-1343.avif"
            alt="workout equipment">
        </div>
      </div>

      <div class="section">
        <div class="section-title">本周训练</div>
        <div class="card">
          <div class="week-grid">${weekDots}</div>
        </div>
      </div>

      <div class="today-banner ${todayDone ? 'done' : ''}">
        <div class="banner-info">
          <div class="banner-label">${todayDone ? '✓ 今日已完成' : '今日训练'}</div>
          <div class="banner-title">训练 ${todayType}${todayDone ? ' 完成！' : ' — 开始'}</div>
        </div>
        <button class="banner-btn" id="go-train-btn">${todayDone ? '查看' : '前往'}</button>
      </div>

      <div class="section">
        <div class="section-title">快捷操作</div>
        <div class="card-group">
          <div class="card-row" id="quick-record">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            <span style="flex:1;font-size:15px;font-weight:500">记录今日体征</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-tertiary)"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
          <div class="card-row" id="quick-photos">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--purple)"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <span style="flex:1;font-size:15px;font-weight:500">拍摄体态照片</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-tertiary)"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
          <div class="card-row" id="quick-progress">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--orange)"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
            <span style="flex:1;font-size:15px;font-weight:500">查看进度趋势</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-tertiary)"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
        </div>
      </div>
    `;

    // Animate ring after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ring = document.getElementById('ring-fill');
        const label = document.getElementById('ring-pct');
        if (ring) ring.style.strokeDashoffset = offset.toFixed(1);
        if (label) label.textContent = pct + '%';
      });
    });

    document.getElementById('go-train-btn')?.addEventListener('click', () => AppUI.navigate('training'));
    document.getElementById('quick-record')?.addEventListener('click', () => AppUI.navigate('records'));
    document.getElementById('quick-photos')?.addEventListener('click', () => AppUI.navigate('photos'));
    document.getElementById('quick-progress')?.addEventListener('click', () => AppUI.navigate('progress'));
  }

  return { render };
})();
