$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Python = "$Root\.venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    throw "Ambiente Python não encontrado. Executa primeiro .\scripts\setup.ps1"
}

Set-Location "$Root\backend"
& $Python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
