# 021 Guide to Lovable Chrome Extension

A Chrome extension that allows you to copy implementation guide content from from021.io and paste it into Lovable chat interface.

## Features

- Copy implementation guides, steps, and prompts from from021.io
- Store copied content for later use
- Paste content directly into Lovable chat with a single click
- Unobtrusive UI that appears only when needed

## Installation

### From Source Code (Developer Mode)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now be installed and visible in your toolbar

## Usage

### Copying Content from from021.io

1. Navigate to an implementation guide page on from021.io
2. A small floating UI will appear in the bottom right corner of the page
3. You can:
   - Click "Copy All Content" to copy the guide, steps, and prompt at once
   - Or use individual buttons to copy specific content

### Pasting Content into Lovable

1. Navigate to the Lovable chat interface (lovable.dev)
2. Click the extension icon in your toolbar to open the floating paste UI
3. Choose which content to paste:
   - "Paste Guide" for the implementation guide
   - "Paste Steps" for the implementation steps
   - "Paste Prompt" for the AI prompt
4. The selected content will be pasted into the chat input field

## Permissions

This extension requires the following permissions:
- `storage`: To store copied content between sessions
- `activeTab`: To interact with the current tab
- `clipboardWrite`: To copy content to clipboard
- `scripting`: To inject content scripts

## Files Structure

- `manifest.json`: Extension configuration
- `popup.html` & `popup.js`: Extension popup UI and logic
- `scripts/from021-content.js`: Content script for from021.io
- `scripts/lovable-content.js`: Content script for lovable.dev
- `scripts/background.js`: Background script for coordination
- `styles/`: CSS files for the UI components

## Troubleshooting

- **Content not copying**: Make sure you're on a valid implementation guide page on from021.io
- **Paste UI not appearing**: Try clicking the extension icon again
- **Content not pasting**: Make sure the chat input field is focused and active

## Privacy

This extension:
- Does not collect any personal data
- Only accesses content on from021.io and lovable.dev
- Does not send any data to external servers
- Stores copied content locally in your browser

## License

MIT License 