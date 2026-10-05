# Starts the Java servlet backend on CRM_PORT (default 8080) - Windows edition.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))  # repo root

if (-not (Get-ChildItem 'backend/out/classes' -ErrorAction SilentlyContinue)) {
  Write-Host "[run] classes not found - building first..."
  & "$PSScriptRoot/build.ps1"
}

& java -cp 'backend/out/classes;backend/lib/*' com.minicrm.Main
