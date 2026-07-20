$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Python = Get-Command py -ErrorAction SilentlyContinue
if ($Python) {
    & py -3 -m venv .venv
} else {
    & python -m venv .venv
}

& "$Root\.venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r "$Root\backend\requirements.txt"

Push-Location "$Root\frontend"
try {
    npm ci
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "WORKLY preparada com sucesso." -ForegroundColor Green
Write-Host "Abre dois terminais e executa os scripts start-backend.ps1 e start-frontend.ps1."
