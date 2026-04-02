param(
  [string]$SqlPath = (Join-Path $PSScriptRoot "..\\migration\\load_new_data_from_legacy.sql")
)

$ErrorActionPreference = "Stop"

$sql = (Resolve-Path $SqlPath).Path
Write-Host "Running reset+load script: $sql"

Get-Content -LiteralPath $sql -Encoding UTF8 | docker compose exec -T postgres psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1

$subjectsSql = (Resolve-Path (Join-Path $PSScriptRoot "..\\migration\\import_subjects_from_legacy.sql")).Path
Write-Host "Running subjects import script: $subjectsSql"
Get-Content -LiteralPath $subjectsSql -Encoding UTF8 | docker compose exec -T postgres psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1

$tscSql = (Resolve-Path (Join-Path $PSScriptRoot "..\\migration\\populate_teacher_subject_class_from_legacy.sql")).Path
Write-Host "Running teacher-subject-class script: $tscSql"
Get-Content -LiteralPath $tscSql -Encoding UTF8 | docker compose exec -T postgres psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1

