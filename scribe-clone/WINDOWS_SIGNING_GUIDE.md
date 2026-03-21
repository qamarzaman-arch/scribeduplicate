# Windows Signing Guide

## Why The Windows Warning Appears

Windows shows a warning for unsigned installers and unsigned desktop apps.

To remove that warning properly, the installer must be built with a trusted Windows code-signing certificate.

## What You Need

- A trusted Windows code-signing certificate in `.pfx` format
- The certificate password

## Environment Variables To Set

Before building, set these in PowerShell:

```powershell
$env:WIN_CSC_LINK = "C:\full\path\to\your-certificate.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-certificate-password"
```

## Build Command

After setting those variables, build normally:

```powershell
npm.cmd run build:win
```

Electron Builder will use the certificate automatically and sign:

- the app executable
- the uninstaller
- the installer

## Important Note

If you do not use a trusted certificate, Windows SmartScreen may still warn users.

This warning cannot be removed permanently by changing app code, icons, or installer settings alone.
