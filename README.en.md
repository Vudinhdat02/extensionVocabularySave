# Auto Vocab Saver

[Tiếng Việt](README.md) · **English**

A Chrome extension that automatically saves vocabulary whenever you copy text on a web page, so language learners can collect new words while reading without switching to another app.

## Features

- Saves the selected phrase (up to 4 words) on copy, via Ctrl+C or the context menu, including inside input fields.
- Skips duplicates, case-insensitively.
- Floating word list on the page: draggable, resizable, collapsible and hideable.
- CSV export (UTF-8) for use with Excel, Google Sheets, Anki and similar tools.
- Toolbar popup to enable/disable the extension and show/hide the word list.
- Data is stored locally with `chrome.storage.local` and never sent anywhere.

## Installation

1. Download the source (Code → Download ZIP) and extract it, or `git clone` this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the project folder.

Works in Chrome, Edge, Brave and other Chromium-based browsers that support Manifest V3.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Store the word list and the enabled state |
| Content script on `<all_urls>` | Listen for copy events and show the word list on any page |

## Structure

```
manifest.json   Extension manifest (Manifest V3)
content.js      Copy handling, word storage, floating list, CSV export
popup.html      Popup UI
popup.js        Enable/disable toggle, show/hide list
icon.png        Icon
```

## Author

Vũ Đình Đạt · [@Vudinhdat02](https://github.com/Vudinhdat02)
