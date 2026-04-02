$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$backupPath = Join-Path $backupDir "institut_gabriel_rita_db-$timestamp.dump"

$dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "institut_gabriel_rita_db" }

Write-Host "Backing up PostgreSQL database '$dbName' as user '$dbUser'..."
Write-Host "Output: $backupPath"

docker compose exec -T postgres pg_dump -U $dbUser -d $dbName -Fc > $backupPath

if (!(Test-Path $backupPath) -or ((Get-Item $backupPath).Length -eq 0)) {
  throw "Backup file was not created or is empty: $backupPath"
}

Write-Host "Backup completed."

