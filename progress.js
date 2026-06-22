/* js/progress.js */

const ProgressPage = (() => {
  let charts = {};

  function destroyAll() {
    Object.values(charts).forEach(c => { try { c.destroy(); } catch {} });
    charts = {};
  }

  function render() {
    destroyAll();
    const page = document.getElementById('page-progress');
    const records = AppDB.getRecords(); // sorted newest first
    const weekCounts = AppDB.getWeeklyTrainingCounts(8);

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#8e8e93' : '#8e8e93';

    page.innerHTML = `
      <div class="page-top"></div>

      <div class="chart-section">
        <div class="section-title">训练统计</div>
        <div class="chart-card">
          <div class="chart-title">每周训练次数</div>
          <div class="chart-container"><canvas id="chart-weekly"></canvas></div>
        </div>
      </div>

      ${records.length ? `
      <div class="chart-section">
        <div class="section-title">身体数据</div>
        <div class="chart-card" style="margin-bottom:12px">
          <div class="chart-title">体重趋势 (kg)</div>
          <div class="chart-container"><canvas id="chart-weight"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">腰围趋势 (cm)</div>
          <div class="chart-container"><canvas id="chart-waist"></canvas></div>
        </div>
      </div>

      <div class="chart-section">
        <div class="section-title">近期体征</div>
        <div class="chart-card">
          <div class="chart-title">睡眠 / 疲劳 / 疼痛</div>
          <div class="chart-container"><canvas id="chart-wellness"></canvas></div>
        </div>
      </div>` : `
      <div class="section">
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p>暂无身体记录数据<br>前往「记录」页面添加体征记录</p>
        </div>
      </div>`}
    `;

    // Chart defaults
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 0 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    };

    // Weekly training bar chart
    const weekEl = document.getElementById('chart-weekly');
    if (weekEl) {
      charts.weekly = new Chart(weekEl, {
        type: 'bar',
        data: {
          labels: weekCounts.map(w => w.label),
          datasets: [{
            label: '训练次数',
            data: weekCounts.map(w => w.count),
            backgroundColor: '#007AFF',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          ...baseOpts,
          scales: {
            ...baseOpts.scales,
            y: { ...baseOpts.scales.y, min: 0, max: 7, ticks: { color: textColor, stepSize: 1 } }
          },
          plugins: {
            ...baseOpts.plugins,
            legend: { display: false }
          }
        }
      });
    }

    if (!records.length) return;

    // Last 30 records for body charts
    const last30 = records.slice(0, 30).reverse();
    const chartLabels = last30.map(r => r.date.slice(5)); // MM-DD

    // Weight chart
    const weightEl = document.getElementById('chart-weight');
    const weightData = last30.map(r => r.weight);
    if (weightEl && weightData.some(v => v)) {
      charts.weight = new Chart(weightEl, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            data: weightData,
            borderColor: '#007AFF',
            backgroundColor: 'rgba(0,122,255,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#007AFF',
            fill: true,
            tension: 0.3,
            spanGaps: true
          }]
        },
        options: { ...baseOpts }
      });
    }

    // Waist chart
    const waistEl = document.getElementById('chart-waist');
    const waistData = last30.map(r => r.waist);
    if (waistEl && waistData.some(v => v)) {
      charts.waist = new Chart(waistEl, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            data: waistData,
            borderColor: '#FF9500',
            backgroundColor: 'rgba(255,149,0,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#FF9500',
            fill: true,
            tension: 0.3,
            spanGaps: true
          }]
        },
        options: { ...baseOpts }
      });
    }

    // Wellness chart (sleep/fatigue/pain)
    const wellnessEl = document.getElementById('chart-wellness');
    if (wellnessEl) {
      charts.wellness = new Chart(wellnessEl, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: '睡眠',
              data: last30.map(r => r.sleep),
              borderColor: '#34C759',
              borderWidth: 2,
              pointRadius: 2,
              fill: false,
              tension: 0.3,
              spanGaps: true
            },
            {
              label: '疲劳',
              data: last30.map(r => r.fatigue),
              borderColor: '#FF9500',
              borderWidth: 2,
              pointRadius: 2,
              fill: false,
              tension: 0.3,
              spanGaps: true
            },
            {
              label: '疼痛',
              data: last30.map(r => r.pain),
              borderColor: '#FF3B30',
              borderWidth: 2,
              pointRadius: 2,
              fill: false,
              tension: 0.3,
              spanGaps: true
            }
          ]
        },
        options: {
          ...baseOpts,
          scales: {
            ...baseOpts.scales,
            y: { ...baseOpts.scales.y, min: 0, max: 10, ticks: { color: textColor, stepSize: 2 } }
          },
          plugins: {
            legend: {
              display: true,
              labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 12 } }
            }
          }
        }
      });
    }
  }

  return { render };
})();
