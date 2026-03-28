$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $projectRoot "release"
$portableRoot = Join-Path $releaseRoot "portable"
$windowsSource = Join-Path $releaseRoot "win-unpacked"
$windowsTarget = Join-Path $portableRoot "windows"
$windowsAppTarget = Join-Path $windowsTarget "HachiAi Requirements Gathering Tool"
$macTarget = Join-Path $portableRoot "macos"
$windowsZip = Join-Path $releaseRoot "HachiAi-Portable-Windows.zip"
$macZip = Join-Path $releaseRoot "HachiAi-Portable-macOS-placeholder.zip"

if (-not (Test-Path $windowsSource)) {
  throw "Missing Windows portable app at $windowsSource. Run npm.cmd run build:win first."
}

if (Test-Path $portableRoot) {
  Remove-Item -LiteralPath $portableRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $windowsAppTarget | Out-Null
New-Item -ItemType Directory -Force -Path $macTarget | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot "USER_HANDOFF_GUIDE.md") -Destination (Join-Path $windowsTarget "USER_HANDOFF_GUIDE.md")
Copy-Item -LiteralPath (Join-Path $projectRoot "INSTALLATION_GUIDE.html") -Destination (Join-Path $windowsTarget "INSTALLATION_GUIDE.html")
Copy-Item -LiteralPath (Join-Path $projectRoot "build\license.txt") -Destination (Join-Path $windowsTarget "license.txt")
Copy-Item -Path (Join-Path $windowsSource "*") -Destination $windowsAppTarget -Recurse

$windowsReadme = @'
# Windows Portable Package

This folder already includes the app runtime and dependencies.

## How To Run

1. Open the `HachiAi Requirements Gathering Tool` folder.
2. Double-click `HachiAi Requirements Gathering Tool.exe`.

## Notes

- No Node.js, npm, Electron, or extra libraries need to be installed.
- Keep the full folder together. Do not move the `.exe` out by itself.
- Windows may still show SmartScreen warnings until the app is code-signed.
'@

Set-Content -LiteralPath (Join-Path $windowsTarget "README.txt") -Value $windowsReadme

$macReadme = @'
# macOS Portable Package

This folder is reserved for the macOS portable app bundle.

## Current Status

The actual macOS `.app` and `.dmg` cannot be created on this Windows machine.
They must be built on a real Mac by running:

npm install
npm run build:mac

## Expected Mac Output

- `HachiAi Requirements Gathering Tool.app`
- `HachiAi Requirements Gathering Tool-<version>-<arch>.dmg`
- `HachiAi Requirements Gathering Tool-<version>-<arch>.zip`

## Important Notes

- The macOS user should be able to open the `.app` directly after extracting the signed package.
- For the smoothest experience, the Mac build should be signed and notarized.
- Screen Recording and Accessibility permissions will still be required on first use.
'@

Set-Content -LiteralPath (Join-Path $macTarget "README.txt") -Value $macReadme
Copy-Item -LiteralPath (Join-Path $projectRoot "MACOS_SIGNING_GUIDE.md") -Destination (Join-Path $macTarget "MACOS_SIGNING_GUIDE.md")
Copy-Item -LiteralPath (Join-Path $projectRoot "USER_HANDOFF_GUIDE.md") -Destination (Join-Path $macTarget "USER_HANDOFF_GUIDE.md")

if (Test-Path $windowsZip) {
  Remove-Item -LiteralPath $windowsZip -Force
}

if (Test-Path $macZip) {
  Remove-Item -LiteralPath $macZip -Force
}

Compress-Archive -Path (Join-Path $windowsTarget "*") -DestinationPath $windowsZip -CompressionLevel Optimal
Compress-Archive -Path (Join-Path $macTarget "*") -DestinationPath $macZip -CompressionLevel Optimal

Write-Host "Created:"
Write-Host " - $windowsZip"
Write-Host " - $macZip"
Write-Host ""
Write-Host "Windows portable folder:"
Write-Host " - $windowsTarget"
Write-Host ""
Write-Host "macOS staging folder:"
Write-Host " - $macTarget"
