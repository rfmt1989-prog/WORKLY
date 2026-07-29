$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"
$pythonPath = Join-Path $backendPath ".venv\Scripts\python.exe"

function Test-Port([int]$Port) {
    return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

if (-not (Test-Path $pythonPath)) {
    Write-Host "A preparar o backend..."
    python -m venv (Join-Path $backendPath ".venv")
    & $pythonPath -m pip install -r (Join-Path $backendPath "requirements.txt")
}

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "A preparar o frontend..."
    Push-Location $frontendPath
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Port 8000)) {
    Write-Host "A iniciar o backend..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendPath'; & '$pythonPath' -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    )
}
else {
    Write-Host "Backend ja ativo na porta 8000."
}

$backendReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $health = Invoke-RestMethod "http://127.0.0.1:8000/api/health" -TimeoutSec 2
        if ($health.status -eq "ok") {
            $backendReady = $true
            break
        }
    }
    catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $backendReady) {
    throw "O backend nao respondeu. Consulte a janela WORKLY Backend."
}

if (-not (Test-Port 8081)) {
    Write-Host "A iniciar o frontend..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:8000/api'; Set-Location '$frontendPath'; npm run web -- --port 8081"
    )
}
else {
    Write-Host "Frontend ja ativo na porta 8081."
}

for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $response = Invoke-WebRequest "http://127.0.0.1:8081/login" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Start-Process "http://localhost:8081/login"
            Write-Host "WORKLY pronta: http://localhost:8081/login"
            exit 0
        }
    }
    catch {
        Start-Sleep -Seconds 1
    }
}

throw "O frontend nao respondeu. Consulte a janela WORKLY Frontend."
