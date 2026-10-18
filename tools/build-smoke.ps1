# Restore + build + test (workaround for broken `dotnet restore` on this machine)
# Usage: tools\build-smoke.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$nuget = Join-Path $env:TEMP "nuget.exe"
if (-not (Test-Path $nuget)) {
    Write-Host "Downloading nuget.exe..."
    curl.exe -L -o $nuget https://dist.nuget.org/win-x86-commandline/latest/nuget.exe
}

Write-Host "== Restore (nuget.exe) =="
& $nuget restore AlgorithmsLab2.slnx -NonInteractive
if ($LASTEXITCODE -ne 0) { throw "restore failed" }

Write-Host "== Build =="
dotnet build AlgorithmsLab2.slnx --no-restore -c Release
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "== Test =="
dotnet test tests\AlgorithmsLab2.Tests\AlgorithmsLab2.Tests.csproj --no-restore -c Release --no-build
if ($LASTEXITCODE -ne 0) { throw "tests failed" }

Write-Host "OK"
