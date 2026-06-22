/* js/photos.js */

const PhotosPage = (() => {
  let currentDate = AppDB.dateStr();
  const TYPES = [
    { id: 'front', label: '正面' },
    { id: 'side', label: '侧面' },
    { id: 'back', label: '背面' }
  ];

  function render() {
    currentDate = AppDB.dateStr();
    const page = document.getElementById('page-photos');
    const dates = AppDB.getAllPhotoDates();
    const photos = AppDB.getPhotos(currentDate);

    const slots = TYPES.map(t => {
      const src = photos[t.id];
      return `
        <div class="photo-slot" id="slot-${t.id}">
          ${src
            ? `<img src="${src}" alt="${t.label}">
               <div class="photo-label">${t.label}</div>
               <button class="photo-del-btn" data-del="${t.id}" aria-label="删除${t.label}照片">
                 <svg viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
               </button>`
            : `<div class="photo-slot-placeholder">
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                 <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                 <span>${t.label}</span>
               </div>
               <div class="photo-label">${t.label}</div>`
          }
          <input type="file" accept="image/*" capture="environment"
            class="photo-input" id="upload-${t.id}" data-type="${t.id}">
        </div>`;
    }).join('');

    const datesList = dates.filter(d => d !== currentDate).slice(0, 20).map(d => {
      const p = AppDB.getPhotos(d);
      const thumbs = TYPES
        .filter(t => p[t.id])
        .map(t => `<img class="photo-thumb-mini" src="${p[t.id]}" alt="${t.label}">`)
        .join('');
      return `
        <div class="photo-date-row" data-nav-date="${d}">
          <div style="flex:1">
            <div style="font-size:15px;font-weight:600">${d}</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">${TYPES.filter(t => p[t.id]).map(t => t.label).join('、')}</div>
          </div>
          <div class="photo-date-thumbs">${thumbs}</div>
        </div>`;
    }).join('');

    page.innerHTML = `
      <div class="page-top"></div>

      <div class="section">
        <div class="section-title">今日 · ${currentDate}</div>
        <div style="padding:0 0 4px;font-size:13px;color:var(--text-tertiary)">点击格子选择或更换照片</div>
      </div>

      <div class="photo-grid">${slots}</div>

      ${datesList ? `
        <div class="section">
          <div class="section-title">历史记录</div>
        </div>
        <div class="photo-dates-list">${datesList}</div>` : ''}
    `;

    // Slot click → trigger file input
    TYPES.forEach(t => {
      const slot = document.getElementById(`slot-${t.id}`);
      const input = document.getElementById(`upload-${t.id}`);
      slot?.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) return;
        input?.click();
      });
      input?.addEventListener('change', (e) => handleUpload(e, t.id));
    });

    // Delete buttons
    page.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        AppDB.deletePhoto(currentDate, btn.dataset.del);
        AppUI.toast('照片已删除');
        render();
      });
    });

    // Historical date navigation
    page.querySelectorAll('[data-nav-date]').forEach(row => {
      row.addEventListener('click', () => showDateModal(row.dataset.navDate));
    });
  }

  async function handleUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    AppUI.toast('正在处理照片…');
    try {
      const dataUrl = await resizeImage(file, 900, 0.75);
      const ok = AppDB.savePhoto(currentDate, type, dataUrl);
      if (ok) { AppUI.toast('✓ 照片已保存'); render(); }
    } catch {
      AppUI.toast('照片处理失败，请重试');
    }
    event.target.value = '';
  }

  function resizeImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function showDateModal(date) {
    const photos = AppDB.getPhotos(date);
    const content = `
      <div class="modal-handle"></div>
      <div class="modal-title">${date}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        ${TYPES.map(t => photos[t.id]
          ? `<div style="border-radius:10px;overflow:hidden;aspect-ratio:3/4">
               <img src="${photos[t.id]}" style="width:100%;height:100%;object-fit:cover" alt="${t.label}">
               <div style="text-align:center;font-size:12px;color:var(--text-tertiary);padding:6px">${t.label}</div>
             </div>`
          : `<div style="border-radius:10px;background:var(--bg-card-2);aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:12px">${t.label}</div>`
        ).join('')}
      </div>
      <button class="modal-btn secondary" id="modal-close-btn">关闭</button>
    `;
    AppUI.showModal(content);
    document.getElementById('modal-close-btn')?.addEventListener('click', AppUI.closeModal);
  }

  return { render };
})();
