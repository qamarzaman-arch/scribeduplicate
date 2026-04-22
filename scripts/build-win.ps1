$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$cacheRoot = Join-Path $projectRoot ".cache\electron-builder"
$bundledWinCodeSignDir = Join-Path $projectRoot "build\vendor\winCodeSign-2.6.0"
$winCodeSignCacheDir = Join-Path $cacheRoot "winCodeSign\winCodeSign-2.6.0"

if (-not (Test-Path $bundledWinCodeSignDir)) {
  throw "Missing required packaging dependency cache at $bundledWinCodeSignDir"
}

if (-not (Test-Path $winCodeSignCacheDir)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $winCodeSignCacheDir) | Out-Null
  Copy-Item -Recurse -Force $bundledWinCodeSignDir $winCodeSignCacheDir
}

$env:ELECTRON_BUILDER_CACHE = $cacheRoot

Push-Location $projectRoot
try {
  & npm.cmd exec vite build
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  & npm.cmd exec electron-builder -- --win nsis
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
