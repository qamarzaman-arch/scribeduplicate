# HachiAi Requirements Gathering Tool

## What To Share With Users

For Windows, share:

- `HachiAi Requirements Gathering Tool-1.0.0-Setup.exe`

For macOS, share:

- `HachiAi Requirements Gathering Tool-1.0.0-<arch>.dmg`

Users do not need to install Node.js, npm, Electron, or any other dependency separately.

## What Users Should Do

### Windows

1. Run the `Setup.exe` installer.
2. Complete the installation steps.
3. A desktop shortcut and Start Menu shortcut will be created during installation.
4. Launch `HachiAi Requirements Gathering Tool` from the desktop shortcut or Start Menu.
5. Accept the privacy agreement on first launch.
6. Start using the app.

### macOS

1. Open the `.dmg` file.
2. Drag `HachiAi Requirements Gathering Tool` into the `Applications` folder.
3. Open the app from `Applications`.
4. Accept the privacy agreement on first launch.
5. Grant Screen Recording and Accessibility permissions if macOS requests them.
6. Start using the app.

## Important Notes For Users

- The app may ask for Windows screen-recording, accessibility, or input-monitoring related permissions depending on system policy.
- On macOS, the app will require Screen Recording and Accessibility permissions for workflow capture.
- These permissions are required for workflow capture and screenshot generation.
- If Windows SmartScreen shows a warning, click `More info` and then `Run anyway` if you trust the installer source.
- This warning happens because the installer is not code-signed yet. It is not something that can be removed reliably for all clients without Windows trust or signing reputation.
- If macOS warns that the app cannot be opened, the DMG or app has not been signed and notarized yet.

## What Is Included In The Installer

- The desktop application
- Electron runtime
- Required app dependencies
- App icons and branding assets

Nothing else needs to be downloaded separately.

## Recommended Message To Send Users

Please install the attached `HachiAi Requirements Gathering Tool-1.0.0-Setup.exe`.
After installation, open the app from the desktop or Start Menu, accept the privacy prompt, and begin recording your workflow.
No additional dependencies or setup are required.

For Mac users, send the `.dmg` file instead and ask them to drag the app into `Applications`, then grant permissions on first launch.
