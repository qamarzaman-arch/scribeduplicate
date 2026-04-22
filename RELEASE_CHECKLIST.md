# Release Checklist

Use this checklist before handing installers to end users.

## 1. Final App Verification

- Run `npm.cmd run dev`
- Record a short workflow
- Confirm screenshots, annotation, redact, and exports work
- Confirm the first-run privacy agreement appears on a fresh profile
- Confirm the HachiAi logo and Windows icon appear correctly

## 2. Windows Build Preparation

- Close all running app windows
- Make sure `build/icon.ico` exists
- Make sure `build/license.txt` contains the legal language you want to ship
- Make sure `build/vendor/winCodeSign-2.6.0/` exists

## 3. Build Commands

Development build:

```powershell
npm.cmd run dev
```

Windows installer build:

```powershell
npm.cmd run build:win
```

This project now seeds a repo-local Electron Builder cache automatically, so the Windows installer build does not depend on Developer Mode or Administrator symlink permissions.

macOS installer build:

```bash
npm run build:mac
```

Run the macOS build on a Mac machine. Signing and notarization details are in `MACOS_SIGNING_GUIDE.md`.

## 4. Expected Output

- Standalone packaged app: `release/win-unpacked/`
- Installer setup file: `release/HachiAi Requirements Gathering Tool-<version>-Setup.exe`
- macOS app bundle: `release/mac-<arch>/HachiAi Requirements Gathering Tool.app`
- macOS installer disk image: `release/HachiAi Requirements Gathering Tool-<version>-<arch>.dmg`

## 5. Manual Installer QA

- Install on a clean Windows machine
- Launch without installing Node.js, npm, or any extra dependencies
- Confirm recording starts and stops successfully
- Confirm screenshots save locally
- Confirm HTML, PDF, and DOCX export prompts open correctly
- Confirm Start Menu and desktop shortcuts are created
- Confirm uninstall removes the app cleanly
- Open the DMG on a clean Mac
- Drag the app into `/Applications`
- Launch the app and confirm it opens successfully
- Confirm recording starts and stops successfully on macOS
- Confirm Screen Recording and Accessibility permission prompts can be granted cleanly

## 6. Distribution Notes

- The installer already bundles Electron and runtime dependencies
- Users should not need to install any separate prerequisite packages
- Users may still need to grant OS-level screen/accessibility permissions depending on their system policy
- Windows distribution notes are in `WINDOWS_SIGNING_GUIDE.md`
- macOS distribution notes are in `MACOS_SIGNING_GUIDE.md`
