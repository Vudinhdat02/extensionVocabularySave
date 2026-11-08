document.addEventListener('DOMContentLoaded', () => {
  const toggleInput = document.getElementById('ext-toggle');
  const btnShowWidget = document.getElementById('btn-show-widget');

  // Lấy trạng thái lưu hiện tại
  chrome.storage.local.get({ isEnabled: true }, (result) => {
    toggleInput.checked = result.isEnabled;
  });

  // Bật / Tắt Extension
  toggleInput.addEventListener('change', () => {
    const isEnabled = toggleInput.checked;
    chrome.storage.local.set({ isEnabled: isEnabled }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "extension_status_changed", isEnabled: isEnabled },
            () => void chrome.runtime.lastError
          );
        }
      });
    });
  });

  // Nút Nhanh Bật/Ẩn Widget từ popup
  btnShowWidget.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "toggle_widget" },
            () => void chrome.runtime.lastError
          );
      }
    });
  });
});
