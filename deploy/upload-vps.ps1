# Subir el proyecto al VPS (cuando SSH funcione)
# Uso desde la raíz del repo:
#   .\deploy\upload-vps.ps1 -VpsHost 62.238.8.136 -User root

param(
  [Parameter(Mandatory = $true)]
  [string]$VpsHost,
  [string]$User = "root",
  [string]$RemoteDir = "/root/CalculoArancelAsuntos"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "Origen: $Root"
Write-Host "Destino: ${User}@${VpsHost}:${RemoteDir}"

ssh -o StrictHostKeyChecking=accept-new "${User}@${VpsHost}" "mkdir -p $RemoteDir"

Push-Location $Root
try {
  tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=dist -czf - . |
    ssh "${User}@${VpsHost}" "tar -xzf - -C $RemoteDir"
  Write-Host "Subida OK. En el VPS:"
  Write-Host "  cd $RemoteDir/deploy && cp .env.example .env && nano .env"
  Write-Host "  docker compose up -d --build"
}
finally {
  Pop-Location
}
