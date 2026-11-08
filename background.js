// Service worker: nơi duy nhất ghi danh sách từ vựng, tránh mất dữ liệu khi nhiều tab/khung cùng lưu.

const DEFAULTS = { vocabList: [], isEnabled: true };

let queue = Promise.resolve();

// Chạy các thao tác ghi tuần tự.
function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function getState() {
  return chrome.storage.local.get(DEFAULTS);
}

async function saveWord(word) {
  const { vocabList, isEnabled } = await getState();
  if (!isEnabled) return { saved: false, reason: 'disabled' };

  const key = word.toLocaleLowerCase();
  if (vocabList.some(item => item.word.toLocaleLowerCase() === key)) {
    return { saved: false, reason: 'duplicate' };
  }

  vocabList.push({ word, addedAt: Date.now() });
  await chrome.storage.local.set({ vocabList });
  return { saved: true };
}

async function removeWord(word) {
  const { vocabList } = await getState();
  const key = word.toLocaleLowerCase();
  await chrome.storage.local.set({
    vocabList: vocabList.filter(item => item.word.toLocaleLowerCase() !== key)
  });
  return { ok: true };
}

async function clearWords() {
  await chrome.storage.local.set({ vocabList: [] });
  return { ok: true };
}

function notifyTopFrame(tabId, message) {
  if (tabId == null || tabId < 0) return;
  chrome.tabs.sendMessage(tabId, message, { frameId: 0 }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== 'string') return false;

  let task;
  switch (msg.type) {
    case 'save':
      if (typeof msg.word !== 'string' || !msg.word) return false;
      task = enqueue(() => saveWord(msg.word)).then(result => {
        if (result.reason !== 'disabled') {
          notifyTopFrame(sender.tab && sender.tab.id, { type: 'show_widget', ...result, word: msg.word });
        }
        return result;
      });
      break;
    case 'remove':
      task = enqueue(() => removeWord(String(msg.word || '')));
      break;
    case 'clear':
      task = enqueue(clearWords);
      break;
    default:
      return false;
  }

  task.then(sendResponse, err => sendResponse({ error: String(err) }));
  return true;
});

// Sau khi cài hoặc cập nhật, nạp lại content script vào các tab đang mở
// để không phải tải lại trang mới dùng được.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(tab =>
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content.js']
    }).catch(() => {})
  ));
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set(current);
  injectIntoOpenTabs();
});
