<#
.SYNOPSIS
  Levanta RoomiGo en local: base de datos (Docker), backend (Spring Boot) y frontend (Angular).

.DESCRIPTION
  - Abre Docker Desktop si está cerrado y arranca PostgreSQL con docker compose.
  - Abre una ventana para el backend y otra para el frontend (ahí se ven sus mensajes).
  - Con -Tunel abre además ngrok hacia el frontend, para que otras personas entren desde internet.
    El dominio se toma de MP_BACK_URL_BASE en api/.env (o del parámetro -Dominio).

.EXAMPLE
  .\iniciar.ps1
  .\iniciar.ps1 -Tunel
  powershell -ExecutionPolicy Bypass -File .\iniciar.ps1 -Tunel
#>
param(
    [switch]$Tunel,
    [string]$Dominio
)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
$api = Join-Path $raiz 'api'
$front = Join-Path $raiz 'frontend'

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "    $texto" -ForegroundColor Yellow }

function Esperar-Url($url, $segundos, $nombre) {
    $limite = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $limite) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -lt 500) { Ok "$nombre listo ($url)"; return $true }
        } catch { Start-Sleep -Seconds 2 }
    }
    Aviso "$nombre no respondió en $segundos s. Revisa su ventana."
    return $false
}

function Docker-Listo {
    # En PowerShell 5.1 el stderr de un comando externo corta el script con ErrorAction Stop
    $anterior = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & docker info *> $null; $listo = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $anterior
    return $listo
}

function Nativo([scriptblock]$bloque) {
    $anterior = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { & $bloque 2>$null } finally { $ErrorActionPreference = $anterior }
}

function Puerto-Ocupado($puerto) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $puerto -ErrorAction SilentlyContinue)
}

# ------------------------------------------------------------------ requisitos
Paso 'Comprobando requisitos'
if (-not (Test-Path (Join-Path $api '.env'))) {
    throw "Falta api\.env. Copia api\.env.example como api\.env y completa los valores (ver README)."
}
foreach ($cmd in 'docker', 'java', 'npm') {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "No se encontró '$cmd'. Revisa los requisitos en el README." }
}
Ok 'api\.env, Docker, Java y npm encontrados'

# ------------------------------------------------------------------ Docker + base de datos
Paso 'Base de datos (PostgreSQL en Docker)'
if (-not (Docker-Listo)) {
    $exe = @("$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe", "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe") |
        Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $exe) { throw 'Docker Desktop no está abierto y no se encontró para abrirlo. Ábrelo manualmente.' }
    Aviso 'Abriendo Docker Desktop (puede tardar un minuto)...'
    Start-Process $exe
    $limite = (Get-Date).AddMinutes(3)
    do { Start-Sleep -Seconds 3 } while (-not (Docker-Listo) -and (Get-Date) -lt $limite)
    if (-not (Docker-Listo)) { throw 'Docker no terminó de arrancar. Vuelve a ejecutar el script cuando esté listo.' }
}
Push-Location $api
try { Nativo { docker compose up -d } | Out-Null } finally { Pop-Location }
$limite = (Get-Date).AddMinutes(2)
do { Start-Sleep -Seconds 2; $estado = Nativo { docker inspect -f '{{.State.Health.Status}}' roomix-db } } while ($estado -ne 'healthy' -and (Get-Date) -lt $limite)
if ($estado -ne 'healthy') { throw 'La base de datos no quedó lista. Revisa: docker logs roomix-db' }
Ok 'PostgreSQL listo en 127.0.0.1:5432'

# ------------------------------------------------------------------ backend
Paso 'Backend (Spring Boot)'
if (Puerto-Ocupado 8081) {
    Aviso 'El puerto 8081 ya está en uso: se asume que el backend ya está corriendo.'
} else {
    Start-Process powershell -WorkingDirectory $api -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'RoomiGo - Backend'; .\mvnw.cmd spring-boot:run"
    Aviso 'Se abrió la ventana "RoomiGo - Backend".'
}

# ------------------------------------------------------------------ frontend
Paso 'Frontend (Angular)'
if (Puerto-Ocupado 4200) {
    Aviso 'El puerto 4200 ya está en uso: se asume que el frontend ya está corriendo.'
} else {
    $instalar = if (Test-Path (Join-Path $front 'node_modules')) { '' } else { 'npm install; ' }
    Start-Process powershell -WorkingDirectory $front -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'RoomiGo - Frontend'; ${instalar}npm start"
    Aviso 'Se abrió la ventana "RoomiGo - Frontend".'
}

Paso 'Esperando a que todo responda'
$backOk = Esperar-Url 'http://localhost:8081/health' 240 'Backend'
$frontOk = Esperar-Url 'http://localhost:4200/' 240 'Frontend'

# ------------------------------------------------------------------ túnel
$urlPublica = $null
if ($Tunel) {
    Paso 'Túnel público (ngrok)'
    if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) { throw 'No se encontró ngrok.' }
    if (-not $Dominio) {
        $linea = Get-Content (Join-Path $api '.env') | Where-Object { $_ -match '^MP_BACK_URL_BASE=' } | Select-Object -First 1
        if ($linea -match 'https://([^/\s]+)') { $Dominio = $Matches[1] }
    }
    if (-not $Dominio) { throw 'Indica el dominio de ngrok con -Dominio o define MP_BACK_URL_BASE en api\.env.' }
    Start-Process powershell -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'RoomiGo - Tunel'; ngrok http --url=$Dominio 4200"
    $urlPublica = "https://$Dominio"
    Aviso 'Se abrió la ventana "RoomiGo - Tunel".'
}

# ------------------------------------------------------------------ resumen
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  RoomiGo está corriendo' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "  Aplicación:   http://localhost:4200"
Write-Host "  API:          http://localhost:8081/api/v1"
Write-Host "  Swagger:      http://localhost:8081/swagger-ui.html"
if ($urlPublica) { Write-Host "  Pública:      $urlPublica   (compártela; pulsar 'Visit Site')" -ForegroundColor Green }
Write-Host ''
Write-Host '  Cuentas demo (contraseña Demo12345!):'
Write-Host '    inquilina.demo@roomix.test · propietario.demo@roomix.test'
Write-Host ''
Write-Host '  Para apagar todo:  .\detener.ps1' -ForegroundColor Cyan
if (-not ($backOk -and $frontOk)) { exit 1 }
