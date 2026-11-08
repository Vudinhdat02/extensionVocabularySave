(() => {
  // Kiểm tra extension còn hoạt động. Sau khi extension được cập nhật hoặc tải lại,
  // script cũ trên các tab đang mở bị "mồ côi" và mọi lệnh gọi chrome.* sẽ lỗi.
  function alive() {
    try {
      return !!(chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  // Script có thể được nạp lại vào cùng một trang khi extension được cài, cập nhật hoặc tải lại.
  // Kết nối của bản cũ tới extension có thể đã hỏng dù vẫn trông như còn hoạt động,
  // nên bản mới luôn gỡ bản cũ và thay thế.
  const prev = globalThis.__autoVocabSaver;
  if (prev) {
    try { prev.dispose(); } catch (e) {}
  }

  const MAX_WORDS = 4;
  const MAX_LENGTH = 60;
  const IS_TOP = window === window.top;
  const HOST_ID = 'auto-vocab-saver-host';

  const disposers = [];
  function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    disposers.push(() => target.removeEventListener(type, handler, options));
  }

  function send(message) {
    if (!alive()) return Promise.resolve(null);
    try {
      return chrome.runtime.sendMessage(message).catch(() => null);
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // ===================== Lấy và chuẩn hoá đoạn chữ được sao chép =====================

  function deepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  function getSelectedText() {
    const el = deepActiveElement();
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      try {
        const { selectionStart: start, selectionEnd: end } = el;
        if (start != null && end != null && start !== end) {
          return el.value.slice(start, end);
        }
      } catch (e) {
        // Một số kiểu input (email, number) không hỗ trợ selectionStart.
      }
    }
    const sel = window.getSelection();
    return sel ? sel.toString() : '';
  }

  function normalize(text) {
    const cleaned = String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      .trim();
    if (!cleaned || cleaned.length > MAX_LENGTH) return '';
    if (cleaned.split(' ').length > MAX_WORDS) return '';
    return cleaned;
  }

  function onCopy() {
    if (!alive()) return;
    const word = normalize(getSelectedText());
    if (word) send({ type: 'save', word });
  }

  // Bắt ở pha capture trên window để trang web không chặn được bằng stopPropagation.
  on(window, 'copy', onCopy, true);
  on(window, 'cut', onCopy, true);

  // ===================== Bảng từ vựng (chỉ ở khung trên cùng) =====================

  let host = null;
  let root = null;
  let els = null;
  let collapsed = false;

  const STYLE = `
    :host { all: initial; }
    .widget {
      position: fixed; top: 16px; right: 16px;
      width: 320px; height: 380px; min-width: 240px; min-height: 44px;
      display: flex; flex-direction: column;
      background: #fff; color: #222;
      border: 1px solid #d0d0d0; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
      font: 13px/1.4 Arial, Helvetica, sans-serif;
      overflow: hidden; resize: both; box-sizing: border-box;
      z-index: 2147483647;
    }
    .widget.collapsed { height: auto !important; resize: none; }
    .widget.collapsed .body, .widget.collapsed .footer { display: none; }
    .header {
      display: flex; align-items: center; justify-content: space-between; gap: 6px;
      padding: 8px 10px; background: #1976D2; color: #fff;
      font-weight: bold; cursor: move; user-select: none; touch-action: none; flex-shrink: 0;
    }
    .actions { display: flex; gap: 4px; }
    button {
      font: bold 11px Arial, Helvetica, sans-serif; color: #fff;
      background: rgba(255,255,255,.2); border: 0; border-radius: 4px;
      padding: 3px 7px; cursor: pointer; margin: 0;
    }
    button:hover { background: rgba(255,255,255,.4); }
    .close:hover { background: #d32f2f; }
    .body { flex: 1; overflow-y: auto; padding: 4px 0; }
    ul { list-style: none; margin: 0; padding: 0; }
    li {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 6px 10px; border-bottom: 1px solid #eee; word-break: break-word;
    }
    li.new { background: #fff8e1; }
    li b { font-weight: bold; }
    li button { color: #999; background: transparent; padding: 0 4px; font-size: 14px; }
    li button:hover { color: #d32f2f; background: transparent; }
    .empty { padding: 16px 10px; color: #888; text-align: center; }
    .footer {
      padding: 6px 10px; border-top: 1px solid #eee; color: #666;
      font-size: 12px; flex-shrink: 0; background: #fafafa;
    }
  `;

  function buildWidget() {
    if (host && host.isConnected) return true;
    const parent = document.body || document.documentElement;
    if (!parent) return false;

    const stale = document.getElementById(HOST_ID);
    if (stale) stale.remove();

    host = document.createElement('div');
    host.id = HOST_ID;
    root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>${STYLE}</style>
      <div class="widget">
        <div class="header">
          <span>📚 Từ vựng đã lưu</span>
          <div class="actions">
            <button class="csv" title="Tải file CSV">CSV</button>
            <button class="clear" title="Xóa tất cả">Xóa</button>
            <button class="min" title="Thu nhỏ">_</button>
            <button class="close" title="Ẩn bảng">✕</button>
          </div>
        </div>
        <div class="body"><ul></ul></div>
        <div class="footer"></div>
      </div>
    `;
    els = {
      widget: root.querySelector('.widget'),
      header: root.querySelector('.header'),
      list: root.querySelector('ul'),
      footer: root.querySelector('.footer')
    };

    root.querySelector('.csv').addEventListener('click', exportCsv);
    root.querySelector('.clear').addEventListener('click', () => {
      if (confirm('Xóa tất cả từ vựng trong danh sách?')) send({ type: 'clear' });
    });
    root.querySelector('.min').addEventListener('click', () => {
      collapsed = !collapsed;
      els.widget.classList.toggle('collapsed', collapsed);
    });
    root.querySelector('.close').addEventListener('click', hideWidget);
    els.list.addEventListener('click', e => {
      const btn = e.target.closest('button[data-word]');
      if (btn) send({ type: 'remove', word: btn.dataset.word });
    });
    // Không để phím tắt của trang web nhận sự kiện gõ phím trong bảng.
    ['keydown', 'keyup', 'keypress'].forEach(t =>
      els.widget.addEventListener(t, e => e.stopPropagation()));

    makeDraggable(els.widget, els.header);
    parent.appendChild(host);
    return true;
  }

  function makeDraggable(widget, handle) {
    let startX = 0, startY = 0, originLeft = 0, originTop = 0, dragging = false;

    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const rect = widget.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      originLeft = rect.left; originTop = rect.top;
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', e => {
      if (!dragging) return;
      const maxLeft = Math.max(0, window.innerWidth - widget.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - handle.offsetHeight);
      const left = Math.min(maxLeft, Math.max(0, originLeft + e.clientX - startX));
      const top = Math.min(maxTop, Math.max(0, originTop + e.clientY - startY));
      widget.style.left = left + 'px';
      widget.style.top = top + 'px';
      widget.style.right = 'auto';
    });
    const stop = e => {
      if (!dragging) return;
      dragging = false;
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function isVisible() {
    return !!(host && host.isConnected && host.style.display !== 'none');
  }

  function showWidget(highlight) {
    if (!buildWidget()) return;
    host.style.display = '';
    render(highlight);
  }

  function hideWidget() {
    if (host) host.style.display = 'none';
  }

  function render(highlight) {
    if (!els || !alive()) return;
    chrome.storage.local.get({ vocabList: [] }, ({ vocabList }) => {
      if (chrome.runtime.lastError || !els) return;
      els.list.textContent = '';
      if (!vocabList.length) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'Chưa có từ nào. Bôi đen một từ và nhấn Ctrl+C để lưu.';
        els.list.appendChild(li);
      }
      const key = highlight ? highlight.toLocaleLowerCase() : null;
      let highlighted = null;
      vocabList.forEach(item => {
        const li = document.createElement('li');
        const b = document.createElement('b');
        b.textContent = item.word;
        const del = document.createElement('button');
        del.textContent = '×';
        del.title = 'Xóa từ này';
        del.dataset.word = item.word;
        li.append(b, del);
        if (key && item.word.toLocaleLowerCase() === key) {
          li.classList.add('new');
          highlighted = li;
        }
        els.list.appendChild(li);
      });
      els.footer.textContent = `Tổng số từ: ${vocabList.length}`;
      if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
    });
  }

  function exportCsv() {
    if (!alive()) return;
    chrome.storage.local.get({ vocabList: [] }, ({ vocabList }) => {
      if (chrome.runtime.lastError) return;
      if (!vocabList.length) {
        alert('Danh sách từ vựng đang trống!');
        return;
      }
      const rows = vocabList.map(item => `"${item.word.replace(/"/g, '""')}"`);
      const csv = '﻿Từ vựng\r\n' + rows.join('\r\n') + '\r\n';
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab_list_${new Date().toISOString().slice(0, 10)}.csv`;
      root.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  // ===================== Nhận tín hiệu từ service worker / popup =====================

  function onMessage(msg, sender, sendResponse) {
    if (!alive() || !msg || !IS_TOP) return;
    if (msg.type === 'show_widget') {
      showWidget(msg.word);
    } else if (msg.type === 'toggle_widget') {
      if (isVisible()) hideWidget();
      else showWidget();
      sendResponse({ visible: isVisible() });
    } else if (msg.type === 'ping') {
      sendResponse({ ok: true });
    }
  }

  function onStorageChanged(changes, area) {
    if (area !== 'local' || !IS_TOP || !alive()) return;
    if (changes.isEnabled && changes.isEnabled.newValue === false) hideWidget();
    if (changes.vocabList && isVisible()) render();
  }

  if (alive()) {
    chrome.runtime.onMessage.addListener(onMessage);
    chrome.storage.onChanged.addListener(onStorageChanged);
  }

  globalThis.__autoVocabSaver = {
    isAlive: alive,
    dispose() {
      disposers.forEach(fn => fn());
      try {
        chrome.runtime.onMessage.removeListener(onMessage);
        chrome.storage.onChanged.removeListener(onStorageChanged);
      } catch (e) {}
      if (host) host.remove();
    }
  };
})();
