param(
  [string]$CsvDir = (Join-Path $PSScriptRoot "..\migration\access\csv"),
  [string]$Schema = "legacy_access",
  [string]$PgService = "postgres",
  [switch]$Truncate
)

$ErrorActionPreference = "Stop"

function Sanitize-Ident {
  param([Parameter(Mandatory = $true)][string]$Name)

  # Keep it deterministic and SQL-safe.
  $n = $Name.Trim().ToLowerInvariant()
  $n = $n -replace '\.csv$', ''
  $n = $n -replace '[^a-z0-9_]+', '_'   # spaces, accents, punctuation -> _
  $n = $n -replace '_+', '_'
  $n = $n.Trim('_')
  if ($n.Length -eq 0) { $n = "t" }
  if ($n[0] -match '[0-9]') { $n = "t_$n" }
  return $n
}

function Quote-Ident {
  param([Parameter(Mandatory = $true)][string]$Ident)
  '"' + ($Ident -replace '"', '""') + '"'
}

$csvDirPath = (Resolve-Path $CsvDir).Path
$csvFiles = Get-ChildItem -LiteralPath $csvDirPath -Filter "*.csv" | Sort-Object Name
if ($csvFiles.Count -eq 0) { throw "No CSV files found in: $csvDirPath" }

# Create schema
$createSchemaSql = "CREATE SCHEMA IF NOT EXISTS $(Quote-Ident $Schema);"
docker compose exec -T $PgService psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1 -c $createSchemaSql | Out-Host

$mapping = @()

foreach ($f in $csvFiles) {
  $origTable = $f.BaseName
  $table = Sanitize-Ident $f.Name

  # Read header row (CSV columns) robustly (handles quotes/commas)
  Add-Type -AssemblyName Microsoft.VisualBasic
  $parser = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($f.FullName)
  $parser.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $parser.SetDelimiters(",")
  $parser.HasFieldsEnclosedInQuotes = $true
  $cols = $parser.ReadFields()
  $parser.Close()

  if (-not $cols -or $cols.Count -eq 0) { Write-Warning "Skipping empty file: $($f.Name)"; continue }

  $sanCols = @()
  $colMap = @{}
  foreach ($c in $cols) {
    $sc = Sanitize-Ident $c
    if ($colMap.ContainsKey($sc)) {
      $i = 2
      while ($colMap.ContainsKey("${sc}_$i")) { $i++ }
      $sc = "${sc}_$i"
    }
    $colMap[$sc] = $c
    $sanCols += $sc
  }

  $qSchema = Quote-Ident $Schema
  $qTable = Quote-Ident $table
  $qCols = ($sanCols | ForEach-Object { Quote-Ident $_ }) -join ", "

  $createColsSql = ($sanCols | ForEach-Object { "$(Quote-Ident $_) text" }) -join ", "
  $createTableSql = "CREATE TABLE IF NOT EXISTS $qSchema.$qTable ($createColsSql);"
  docker compose exec -T $PgService psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1 -c $createTableSql | Out-Host

  if ($Truncate) {
    docker compose exec -T $PgService psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1 -c "TRUNCATE TABLE $qSchema.$qTable;" | Out-Host
  }

  # Stream CSV into \copy (client-side copy inside container, stdin from host)
  $copyCmd = "\copy $qSchema.$qTable ($qCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
  Get-Content -LiteralPath $f.FullName -Encoding UTF8 | docker compose exec -T $PgService psql -U postgres -d institut_gabriel_rita_db -v ON_ERROR_STOP=1 -c $copyCmd | Out-Host

  $mapping += [pscustomobject]@{
    source_csv = $f.Name
    legacy_schema = $Schema
    legacy_table = $table
    source_table_name = $origTable
    column_mapping = ($colMap.GetEnumerator() | Sort-Object Name | ForEach-Object { [pscustomobject]@{ legacy_column = $_.Key; source_column = $_.Value } })
  }
}

$outDir = Join-Path $PSScriptRoot "..\migration\access"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$mappingPath = Join-Path $outDir "legacy_import_mapping.json"
$mapping | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $mappingPath -Encoding UTF8

Write-Host "Imported $($mapping.Count) tables into schema '$Schema'."
Write-Host "Wrote mapping file: $mappingPath"

