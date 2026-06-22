/* js/records.js */

const RecordsPage = (() => {
  function render() {
    const page = document.getElementById('page-records');
    const latest = AppDB.getLatestRecord();
    const isToday = latest?.date === AppDB.dateStr();

    const lastBar = latest ? `
      <div class="last-record-bar">
        ${latest.weight ? `<div class="last-rec-item"><div class="last-rec-val">${latest.weight}</div><div class="last-rec-label">体重 kg</div></div>` : ''}
        ${latest.waist ? `<div class="last-rec-item"><div class="last-rec-val">${latest.waist}</div><div class="last-rec-label">腰围 cm</div></div>` : ''}
        ${latest.sleep ? `<div class="last-rec-item"><div class="last-rec-val">${latest.sleep}</div><div class="last-rec-label">睡眠</div></div>` : ''}
        ${latest.fatigue ? `<div class="last-rec-item"><div class="last-rec-val">${latest.fatigue}</div><div class="last-rec-label">疲劳</div></div>` : ''}
        ${latest.pain !== undefined ? `<div class="last-rec-item"><div class="last-rec-val">${latest.pain}</div><div class="last-rec-label">疼痛</div></div>` : ''}
        <div class="last-rec-item"><div class="last-rec-val" style="font-size:12px;color:var(--text-tertiary)">${latest.date}</div><div class="last-rec-label">${isToday ? '今日' : '最近'}</div></div>
      </div>` : '';

    const defaults = isToday && latest ? latest : {};

    page.innerHTML = `
      <div class="page-top"></div>
      ${lastBar}
      <form class="records-form" id="records-form" autocomplete="off">

        <div class="form-field">
          <div class="form-label">
            <span>体重</span>
            <span class="form-label-val" id="weight-val">${defaults.weight || ''}</span>
          </div>
          <div class="form-row">
            <input class="form-input" type="number" id="field-weight" name="weight"
              placeholder="kg" step="0.1" min="30" max="200" value="${defaults.weight || ''}">
            <input class="form-input" type="number" id="field-waist" name="waist"
              placeholder="腰围 cm" step="0.5" min="40" max="200" value="${defaults.waist || ''}">
          </div>
        </div>

        <div class="form-field">
          <div class="form-label">
            <span>睡眠质量</span>
            <span class="form-label-val" id="sleep-val">${defaults.sleep || 5} / 10</span>
          </div>
          <div class="range-wrap">
            <input type="range" id="field-sleep" min="1" max="10" step="1" value="${defaults.sleep || 5}">
          </div>
          <div class="range-ticks">
            <span>差</span><span>一般</span><span>好</span><span>很好</span><span>极好</span>
          </div>
        </div>

        <div class="form-field">
          <div class="form-label">
            <span>疲劳程度</span>
            <span class="form-label-val" id="fatigue-val">${defaults.fatigue || 5} / 10</span>
          </div>
          <div class="range-wrap">
            <input type="range" id="field-fatigue" min="1" max="10" step="1" value="${defaults.fatigue || 5}">
          </div>
          <div class="range-ticks">
            <span>无</span><span>轻微</span><span>中度</span><span>较重</span><span>严重</span>
          </div>
        </div>

        <div class="form-field">
          <div class="form-label">
            <span>疼痛评分</span>
            <span class="form-label-val" id="pain-val">${defaults.pain ?? 0} / 10</span>
          </div>
          <div class="range-wrap">
            <input type="range" id="field-pain" min="0" max="10" step="1" value="${defaults.pain ?? 0}">
          </div>
          <div class="range-ticks">
            <span>0 无</span><span>3 轻</span><span>5 中</span><span>7 重</span><span>10 剧</span>
          </div>
        </div>

        <button type="submit" class="submit-btn">保存今日记录</button>
      </form>
    `;

    // Live range label updates
    bindRange('field-sleep', 'sleep-val', v => `${v} / 10`);
    bindRange('field-fatigue', 'fatigue-val', v => `${v} / 10`);
    bindRange('field-pain', 'pain-val', v => `${v} / 10`);

    // Form submit
    document.getElementById('records-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById('field-weight').value) || null;
      const waist = parseFloat(document.getElementById('field-waist').value) || null;
      const sleep = parseInt(document.getElementById('field-sleep').value);
      const fatigue = parseInt(document.getElementById('field-fatigue').value);
      const pain = parseInt(document.getElementById('field-pain').value);

      if (!weight && !waist) {
        AppUI.toast('请至少填写体重或腰围');
        return;
      }

      AppDB.addRecord({ weight, waist, sleep, fatigue, pain });
      AppUI.toast('✓ 记录已保存');
      render(); // refresh with new data
    });
  }

  function bindRange(inputId, labelId, formatter) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (!input || !label) return;
    input.addEventListener('input', () => { label.textContent = formatter(input.value); });
  }

  return { render };
})();
