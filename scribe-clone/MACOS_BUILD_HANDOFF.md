# macOS Build Handoff

Use this on a real Mac to produce the runnable `.app` and distributable `.dmg`.

## 1. Prerequisites

- Xcode Command Line Tools installed
- Node.js 18 or later installed
- npm available
- Apple Developer account access if you want signing and notarization
- `Developer ID Application` certificate installed in Keychain if signing is required

Install Xcode Command Line Tools if needed:

```bash
xcode-select --install
```

## 2. Open The Project

```bash
cd /path/to/scribe-clone
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Optional: Set Signing And Notarization Variables

If you want users to open the app with fewer Gatekeeper warnings, set:

```bash
export CSC_NAME="Developer ID Application: Your Company Name (TEAMID)"
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="YOURTEAMID"
```

If you skip this, the app can still be built, but macOS may warn users more aggressively.

## 5. Build The macOS Artifacts

```bash
npm run build:mac
```

## 6. Expected Output

After the build completes, check:

- `release/mac-arm64/HachiAi Requirements Gathering Tool.app` on Apple Silicon Macs
- `release/mac/HachiAi Requirements Gathering Tool.app` or `release/mac-x64/HachiAi Requirements Gathering Tool.app` on Intel Macs
- `release/HachiAi Requirements Gathering Tool-<version>-<arch>.dmg`
- `release/HachiAi Requirements Gathering Tool-<version>-<arch>.zip`

## 7. What To Share

- Share the `.dmg` with end users for the cleanest install flow
- Optionally share the `.zip` if you want users to run the `.app` directly after extraction

## 8. Quick QA

- Open the `.app`
- Confirm the dashboard launches
- Start and stop a short recording
- Confirm macOS asks for Screen Recording and Accessibility permissions
- Confirm export still works

## 9. One-Block Command Set

For a basic unsigned macOS build:

```bash
cd /path/to/scribe-clone
npm install
npm run build:mac
```
