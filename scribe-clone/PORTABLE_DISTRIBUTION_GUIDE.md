# Portable Distribution Guide

## Goal

Prepare OS-specific folders so users can run the app without installing Node.js, npm, Electron, or extra libraries.

## Windows

The Windows portable package is created from `release/win-unpacked/`.

Users should:

1. Extract the zip file
2. Open the extracted `HachiAi Requirements Gathering Tool` folder
3. Double-click `HachiAi Requirements Gathering Tool.exe`

Important:

- The full folder must stay together because the `.exe` depends on the bundled files around it.
- This is portable, but it is still a packaged desktop app, not a single standalone file.

## macOS

The macOS portable package must be created on a Mac.

Users should:

1. Extract the signed macOS zip or open the DMG
2. Open `HachiAi Requirements Gathering Tool.app` directly, or drag it to `Applications`

Important:

- The actual `.app` bundle and `.dmg` cannot be built on Windows.
- A Mac build is still required for the final distributable.
