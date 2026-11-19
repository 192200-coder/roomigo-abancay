<#
.SYNOPSIS
  Apaga RoomiGo: backend (8081), frontend (4200), túnel de ngrok y la base de datos de Docker.
  Los datos de la base se conservan (quedan en el volumen de Docker).

.EXAMPLE
  .\detener.ps1
  .\detener.ps1 -DejarBase    # apaga todo menos PostgreSQL
#>
param([switch]$DejarBase)

foreach ($puerto in 8081, 4200) {
    $conexiones = Get-NetTCPConnection -State Listen -LocalPort $puerto -ErrorAction SilentlyContinue
    foreach ($id in ($conexiones | Select-Object -ExpandProperty OwningProcess -Unique)) {
        $p = Get-Process -Id $id -ErrorAction SilentlyContinue
        if ($p) { Stop-Process -Id $id -Force; Write-Host "Detenido $($p.ProcessName) (puerto $puerto)" -ForegroundColor Green }
    }
}

Get-Process ngrok -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force; Write-Host 'Detenido ngrok (túnel)' -ForegroundColor Green }

# Cierra las ventanas que abrió iniciar.ps1
Get-Process powershell -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowTitle -like 'RoomiGo - *' } |
    ForEach-Object { Stop-Process -Id $_.Id -Force }

if (-not $DejarBase) {
    Push-Location (Join-Path $PSScriptRoot 'api')
    try { $ErrorActionPreference = 'Continue'; docker compose stop 2>$null | Out-Null; Write-Host 'Base de datos detenida (los datos se conservan)' -ForegroundColor Green }
    finally { Pop-Location }
}
Write-Host 'Listo.'
