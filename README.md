# HachiAi Requirements Gathering Tool

## 🔗 Connecting Antigravity IDE to Jules
To fully integrate Jules with your Antigravity IDE environment:
1. Ensure the **Jules Antigravity Extension** is installed in your Antigravity IDE.
2. Open this project folder (`scribe-clone`) in Antigravity.
3. Jules will automatically detect the environment and provide context-aware assistance for this repository.

A professional-grade, cross-platform desktop application for recording user processes and generating editable step-by-step documentation with screenshots. HachiAi is built to work seamlessly across both web applications and native desktop apps.

## 🚀 Key Features

*   **System-Wide Recording**: Captures mouse clicks, keyboard input, and window switching across the entire OS.
*   **Intelligent Step Generation**: Automatically converts raw action logs into human-readable instructions using advanced AI logic and "Smart Grouping."
*   **Interactive Editor**: Professional UI to reorder steps (drag-and-drop), modify descriptions, and annotate screenshots.
*   **Advanced Annotations**: Highlight key areas or redact sensitive information directly on captured screenshots.
*   **Pro-Level Export**: Export your guides as beautifully styled, responsive HTML or print-optimized PDF reports.
*   **Privacy & Security**: Automatically detects and masks sensitive contexts (passwords, login screens) and PII patterns (emails, phone numbers).
*   **Local-First Storage**: All recordings and screenshots are stored locally on your device for maximum privacy.
*   **Global Shortcuts**: Use `Ctrl+Shift+R` (or `Cmd+Shift+R`) to start and stop recordings from anywhere in the system.

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TailwindCSS, Zustand (State Management).
*   **Backend**: Electron, Node.js.
*   **Core Engines**: `uiohook-napi` (Input tracking), `screenshot-desktop` (Screen capture), `sharp` (Image optimization), `active-win` (Window detection).
*   **Data Persistence**: `electron-store`.

## 📦 Prerequisites

*   **Node.js**: Version 18 or later.
*   **npm** or **yarn**.
*   **OS Permissions**:
    *   **macOS**: Requires "Screen Recording" and "Accessibility" permissions for the terminal or the app.
    *   **Linux**: May require `libxtst-dev`, `libpng-dev`, and `g++` dependencies for `uiohook-napi`.

## ⚙️ Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/hachiai-requirements-tool.git
    cd hachiai-requirements-tool/scribe-clone
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## 🏃 Running the Application

### Development Mode
Start the application in development mode with hot-reloading:
```bash
npm run dev
```

### Building for Production
Package the application for your current operating system:
```bash
npm run build
```
The executable will be located in the `release/` directory.

To build specifically for Windows:
```powershell
npm.cmd run build:win
```

To build specifically for macOS on a Mac:
```bash
npm run build:mac
```

## 🧪 Testing
Run the Vitest-based unit tests for the AI service and core logic:
```bash
npm test
```

## 📖 Usage Guide

1.  **Start Recording**: Click "New Guide" on the Dashboard or use the `Ctrl+Shift+R` shortcut.
2.  **Control Recording**: Use the floating overlay to Pause or Stop. HachiAi will automatically capture a screenshot and metadata for every click or significant action.
3.  **Edit Guide**: After stopping, the Editor will open. You can:
    *   Drag the left handle of a step to reorder.
    *   Edit action descriptions in the text fields.
    *   Click the "Annotate" icon to highlight areas or blur sensitive content on screenshots.
4.  **Save & Export**: Click "Save Guide" to persist it to your local dashboard. Use "Export HTML" or "Export PDF" to generate professional documentation.

---
© 2025 HachiAi - Empowering process documentation with intelligence.
