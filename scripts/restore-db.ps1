$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath
)

if (!(Test-Path $BackupPath)) {
  throw "Backup file not found: $BackupPath"
}

$dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "institut_gabriel_rita_db" }

Write-Host "Restoring PostgreSQL database '$dbName' as user '$dbUser'..."
Write-Host "Input: $BackupPath"

docker compose exec -T postgres pg_restore -U $dbUser -d $dbName --clean --if-exists < $BackupPath

Write-Host "Restore completed."

