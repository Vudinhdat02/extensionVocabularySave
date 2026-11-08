# Auto Vocab Saver

[Tiếng Việt](README.md) · **English**

A Chrome extension that automatically saves vocabulary whenever you copy text on a web page, so language learners can collect new words while reading without switching to another app.

## Features

- Saves the selected phrase (up to 4 words) on copy or cut, via keyboard or the context menu, including inside input fields and iframes. Leading and trailing punctuation is stripped.
- Skips duplicates, case-insensitively.
- Floating word list on the page: draggable, resizable, collapsible, hideable, with per-word removal. Rendered in a Shadow DOM so page styles do not affect it.
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
| `scripting` | Re-inject the script into open tabs after install or update, without reloading pages |
| `<all_urls>` host access | Listen for copy events and show the word list on any page |

The extension cannot run on browser pages (`chrome://`, `edge://`), extension stores or the built-in PDF viewer.

## Structure

```
manifest.json   Extension manifest (Manifest V3)
background.js   Service worker: serialized word storage, injection into open tabs
content.js      Copy handling, floating list, CSV export
popup.html      Popup UI
popup.js        Enable/disable toggle, show/hide list
icon.png        Icon
```

## Author

Vũ Đình Đạt · [@Vudinhdat02](https://github.com/Vudinhdat02)
