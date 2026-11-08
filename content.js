let widgetContainer = null;
let saveQueue = Promise.resolve();

function createVocabWidget() {
  let existingWidget = document.getElementById('vocab-saver-widget');
  if (existingWidget) {
    existingWidget.style.display = 'flex';
    return;
  }

  widgetContainer = document.createElement('div');
  widgetContainer.id = 'vocab-saver-widget';
  widgetContainer.innerHTML = `
    <div id="vocab-widget-header">
      <span id="vocab-widget-title">📚 Từ Vựng Đã Lưu</span>
      <div id="vocab-widget-actions">
        <button id="vocab-btn-csv" title="Tải File CSV">📥 CSV</button>
        <button id="vocab-btn-clear" title="Xóa tất cả">🗑️</button>
        <button id="vocab-widget-toggle" title="Thu nhỏ">_</button>
        <button id="vocab-widget-close" title="Tắt Widget">✕</button>
      </div>
    </div>
    <div id="vocab-widget-body">
      <table id="vocab-widget-table">
        <thead>
          <tr>
            <th>Từ vựng</th>
          </tr>
        </thead>
        <tbody id="vocab-widget-tbody"></tbody>
      </table>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #vocab-saver-widget {
      position: fixed;
      top: 15px;
      right: 15px;
      width: 330px;
      height: 380px;
      min-width: 250px;
      min-height: 150px;
      background: #ffffff;
      border: 1px solid #d0d0d0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      border-radius: 8px;
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #333;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      resize: both;
    }
    #vocab-widget-header {
      background: #1976D2;
      color: white;
      padding: 8px 10px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
      flex-shrink: 0;
    }
    #vocab-widget-title {
      pointer-events: none;
    }
    #vocab-widget-actions {
      display: flex;
      gap: 4px;
    }
    #vocab-widget-actions button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      border-radius: 4px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
    }
    #vocab-widget-actions button:hover {
      background: rgba(255,255,255,0.4);
    }
    #vocab-widget-close:hover {
      background: #d32f2f !important;
    }
    #vocab-widget-body {
      padding: 6px;
      overflow-y: auto;
      flex-grow: 1;
    }
    #vocab-widget-table {
      width: 100%;
      border-collapse: collapse;
    }
    #vocab-widget-table th {
      background: #f0f0f0;
      text-align: left;
      padding: 6px;
      border-bottom: 2px solid #ccc;
      position: sticky;
      top: 0;
    }
    #vocab-widget-table td {
      padding: 6px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
      word-break: break-word;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(widgetContainer);

  makeWidgetDraggable(widgetContainer, document.getElementById('vocab-widget-header'));

  // Thu nhỏ / Mở rộng popup
  document.getElementById('vocab-widget-toggle').addEventListener('click', () => {
    const body = document.getElementById('vocab-widget-body');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      widgetContainer.style.height = '380px';
      widgetContainer.style.resize = 'both';
    } else {
      body.style.display = 'none';
      widgetContainer.style.height = 'auto';
      widgetContainer.style.resize = 'none';
    }
  });

  // Nút X ẩn Widget
  document.getElementById('vocab-widget-close').addEventListener('click', () => {
    if (widgetContainer) widgetContainer.style.display = 'none';
  });

  document.getElementById('vocab-btn-csv').addEventListener('click', exportToCSV);

  document.getElementById('vocab-btn-clear').addEventListener('click', () => {
    if (confirm('Xóa tất cả từ vựng trong danh sách?')) {
      chrome.storage.local.set({ vocabList: [] }, loadWidgetData);
    }
  });

  loadWidgetData();
}

function makeWidgetDraggable(elmnt, header) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (e.target.tagName === 'BUTTON') return;

    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.right = 'auto';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function exportToCSV() {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = result.vocabList;
    if (vocabList.length === 0) {
      alert('Danh sách từ vựng đang trống!');
      return;
    }

    let csvContent = "\uFEFFTừ vựng\n";
    vocabList.forEach(item => {
      const word = `"${item.word.replace(/"/g, '""')}"`;
      csvContent += `${word}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_list_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function loadWidgetData() {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const tbody = document.getElementById('vocab-widget-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    result.vocabList.forEach(item => {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const word = document.createElement('b');
      word.textContent = item.word;
      td.appendChild(word);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  });
}

// Lắng nghe tín hiệu mở/ẩn từ popup
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggle_widget") {
    const existing = document.getElementById('vocab-saver-widget');
    if (!existing) {
      createVocabWidget();
    } else {
      if (existing.style.display === 'none') {
        existing.style.display = 'flex';
        loadWidgetData();
      } else {
        existing.style.display = 'none';
      }
    }
  } else if (request.action === "extension_status_changed") {
    const existing = document.getElementById('vocab-saver-widget');
    if (!request.isEnabled && existing) {
      existing.style.display = 'none';
    }
  }
});

// Ctrl+C (và các thao tác Copy khác) sẽ lưu ngay phần chữ đang được chọn.
document.addEventListener('copy', () => {
  const selectedText = getSelectedText();
  if (!selectedText || selectedText.split(/\s+/).length > 4) return;

  chrome.storage.local.get({ isEnabled: true }, (result) => {
    if (!result.isEnabled) return;

    saveQueue = saveQueue.then(() => saveVocabulary(selectedText));
  });
});

function getSelectedText() {
  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== null && end !== null && start !== end) {
      return activeElement.value.slice(start, end).trim();
    }
  }

  return window.getSelection().toString().trim();
}

function saveVocabulary(word) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ vocabList: [] }, (result) => {
      const vocabList = result.vocabList;
      const exists = vocabList.some(
        item => item.word.toLowerCase() === word.toLowerCase()
      );

      if (!exists) vocabList.push({ word });

      chrome.storage.local.set({ vocabList }, () => {
        const existing = document.getElementById('vocab-saver-widget');
        if (existing) {
          existing.style.display = 'flex';
        } else {
          createVocabWidget();
        }
        loadWidgetData();
        resolve();
      });
    });
  });
}

