/* js/app.js — Main app init, routing, PWA, import/export */

const AppUI = (() => {
  const PAGES = {
    dashboard: { title: '', render: () => DashboardPage.render() },
    training:  { title: '今日训练', render: () => TrainingPage.render() },
    records:   { title: '身体记录', render: () => RecordsPage.render() },
    progress:  { title: '进度趋势', render: () => ProgressPage.render() },
    photos:    { title: '体态照片', render: () => PhotosPage.render() }
  };

  let currentPage = 'dashboard';
  let deferredInstallPrompt = null;
  let toastTimer = null;

  // ——— Toast ———
  function toast(msg, duration = 2400) {
    const el = document.getElementById('toast');
    if (!el) return;
    clearTimeout(toastTimer);
    el.textContent = msg;
    el.classList.add('show');
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ——— Modal ———
  function showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); }, { once: true });
  }

  function closeModal() {
    document.getElementById('modal-overlay')?.classList.add('hidden');
  }

  // ——— Navigation ———
  function navigate(pageId) {
    if (!PAGES[pageId] || pageId === currentPage) return;
    document.getElementById(`page-${currentPage}`)?.classList.remove('active');
    document.getElementById(`page-${pageId}`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });
    document.getElementById('header-title').textContent = PAGES[pageId].title;
    currentPage = pageId;
    updateHeaderActions();
    PAGES[pageId].render();
    window.scrollTo(0, 0);
  }

  function updateHeaderActions() {
    const right = document.getElementById('header-right');
    const left = document.getElementById('header-left');
    if (!right || !left) return;
    right.innerHTML = '';
    left.innerHTML = '';

    if (currentPage === 'dashboard') {
      right.innerHTML = `
        <button class="header-btn" id="menu-btn" aria-label="更多">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>`;
      document.getElementById('menu-btn')?.addEventListener('click', showMenu);
    }

    if (deferredInstallPrompt && currentPage === 'dashboard') {
      left.innerHTML = `
        <button class="install-btn" id="install-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          安装
        </button>`;
      document.getElementById('install-btn')?.addEventListener('click', installPWA);
    }
  }

  // ——— Menu ———
  function showMenu() {
    const content = `
      <div class="modal-handle"></div>
      <div class="modal-title">数据管理</div>
      <button class="modal-btn primary" id="btn-export">导出 JSON 备份</button>
      <button class="modal-btn secondary" id="btn-import">导入 JSON 恢复</button>
      <button class="modal-btn danger" id="btn-clear">清除所有数据</button>
      <button class="modal-btn secondary" id="btn-close">取消</button>
    `;
    showModal(content);
    document.getElementById('btn-export')?.addEventListener('click', exportData);
    document.getElementById('btn-import')?.addEventListener('click', importData);
    document.getElementById('btn-clear')?.addEventListener('click', clearData);
    document.getElementById('btn-close')?.addEventListener('click', closeModal);
  }

  function exportData() {
    closeModal();
    const json = AppDB.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `posture-backup-${AppDB.dateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✓ 数据已导出');
  }

  function importData() {
    closeModal();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = AppDB.importJSON(ev.target.result);
        if (ok) {
          toast('✓ 数据已恢复');
          navigate('dashboard');
          DashboardPage.render();
        } else {
          toast('导入失败：文件格式无效');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearData() {
    closeModal();
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">确认清除</div>
      <p style="font-size:15px;color:var(--text-secondary);margin-bottom:20px;line-height:1.5">
        这将删除所有训练记录、身体数据和照片，且无法恢复。建议先导出备份。
      </p>
      <button class="modal-btn danger" id="confirm-clear">确认清除全部数据</button>
      <button class="modal-btn secondary" id="cancel-clear">取消</button>
    `);
    document.getElementById('confirm-clear')?.addEventListener('click', () => {
      AppDB.clearAll();
      closeModal();
      toast('已清除所有数据');
      navigate('dashboard');
    });
    document.getElementById('cancel-clear')?.addEventListener('click', closeModal);
  }

  // ——— PWA ———
  function installPWA() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; updateHeaderActions(); });
  }

  // ——— Init ———
  function init() {
    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.page));
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      updateHeaderActions();
    });

    // Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // Initial render
    // Set initial header title
    document.getElementById('header-title').textContent = PAGES[currentPage].title;
    updateHeaderActions();
    DashboardPage.render();

    // Handle color scheme changes for chart re-render
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentPage === 'progress') ProgressPage.render();
    });
  }

  return { toast, showModal, closeModal, navigate, init };
})();

document.addEventListener('DOMContentLoaded', () => AppUI.init());
