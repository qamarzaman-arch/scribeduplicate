# macOS Signing And Notarization Guide

## Why macOS Shows Security Warnings

macOS warns about unsigned or unnotarized desktop apps downloaded outside the App Store.

To distribute a smoother installer experience, the app should be:

- signed with an Apple Developer ID Application certificate
- packaged as a DMG
- notarized by Apple
- stapled after notarization

## What You Need

- A Mac machine to create the production macOS installer
- An Apple Developer account
- A `Developer ID Application` certificate installed in Keychain
- Apple notarization credentials

## Recommended Environment Variables

Set these on the Mac build machine before running the build:

```bash
export CSC_NAME="Developer ID Application: Your Company Name (TEAMID)"
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="YOURTEAMID"
```

`CSC_NAME` should match the certificate name shown in Keychain Access.

## Build Command

Run this on macOS:

```bash
npm run build:mac
```

Electron Builder will create macOS release artifacts in `release/`.

## Expected Output

- `release/HachiAi Requirements Gathering Tool-<version>-<arch>.dmg`
- `release/HachiAi Requirements Gathering Tool-<version>-<arch>.zip`
- `release/mac-<arch>/HachiAi Requirements Gathering Tool.app`

## Important Notes

- This macOS build should be run on a real Mac, not Windows.
- For the smoothest end-user launch experience, the DMG should be signed and notarized.
- On first run, macOS will still ask users to grant Screen Recording and Accessibility permissions because the app records workflows across the system.
- The hardened runtime entitlements in `build/entitlements.mac.plist` and `build/entitlements.mac.inherit.plist` are included to support notarized Electron builds with native modules.
