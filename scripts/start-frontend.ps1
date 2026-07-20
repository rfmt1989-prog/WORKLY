$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$Root\frontend\node_modules")) {
    throw "Dependências do frontend não encontradas. Executa primeiro .\scripts\setup.ps1"
}

Set-Location "$Root\frontend"
npm run web
