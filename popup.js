const toggleInput = document.getElementById('ext-toggle');
const btnShowWidget = document.getElementById('btn-show-widget');
const countEl = document.getElementById('word-count');
const noteEl = document.getElementById('note');

function showNote(text) {
  noteEl.textContent = text;
  noteEl.hidden = !text;
}

function renderCount(list) {
  countEl.textContent = `Đã lưu: ${list.length} từ`;
}

chrome.storage.local.get({ isEnabled: true, vocabList: [] }, ({ isEnabled, vocabList }) => {
  toggleInput.checked = isEnabled;
  renderCount(vocabList);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.vocabList) renderCount(changes.vocabList.newValue || []);
});

toggleInput.addEventListener('change', () => {
  chrome.storage.local.set({ isEnabled: toggleInput.checked });
});

async function sendToggle(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: 'toggle_widget' }, { frameId: 0 });
}

btnShowWidget.addEventListener('click', async () => {
  showNote('');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  try {
    await sendToggle(tab.id);
    window.close();
    return;
  } catch (e) {
    // Trang chưa có content script (mở trước khi cài extension): thử nạp rồi gửi lại.
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] });
    await sendToggle(tab.id);
    window.close();
  } catch (e) {
    showNote('Trình duyệt không cho phép tiện ích chạy trên trang này (trang cài đặt, cửa hàng tiện ích, trình xem PDF...).');
  }
});
