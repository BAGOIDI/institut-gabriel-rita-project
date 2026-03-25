# 📦 Script d'Import PostgreSQL → Typesense
# Ce script extrait les données de PostgreSQL et les charge dans Typesense

param(
    [string]$PostgresHost = "localhost",
    [string]$PostgresPort = "5432",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgres",
    [string]$PostgresDb = "institut_gabriel_rita_db",
    [string]$TypesenseHost = "localhost",
    [string]$TypesensePort = "8108",
    [string]$TypesenseApiKey = "xyz"
)

Write-Host "🚀 Import PostgreSQL → Typesense" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Configuration Typesense
$TypesenseBaseUrl = "http://$TypesenseHost:$TypesensePort"
$Headers = @{
    "Content-Type" = "application/json"
    "X-TYPESENSE-API-KEY" = $TypesenseApiKey
}

# Configuration PostgreSQL
$Env:PGPASSWORD = $PostgresPassword

Function Test-Connection {
    param([string]$Url)
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Vérifier que Typesense est accessible
Write-Host "🔍 Vérification de la connexion à Typesense..." -ForegroundColor Yellow
if (!(Test-Connection "$TypesenseBaseUrl/health")) {
    Write-Host "❌ Typesense n'est pas accessible à l'adresse $TypesenseBaseUrl" -ForegroundColor Red
    Write-Host "   Vérifiez que le container typesense tourne :" -ForegroundColor Yellow
    Write-Host "   docker-compose ps typesense" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ Typesense est accessible" -ForegroundColor Green
Write-Host ""

# Créer la collection Students
Write-Host "📚 Création de la collection 'students'..." -ForegroundColor Yellow
try {
    $studentsSchema = @{
        name = "students"
        fields = @(
            @{ name = "id"; type = "string" },
            @{ name = "first_name"; type = "string" },
            @{ name = "last_name"; type = "string" },
            @{ name = "email"; type = "string" },
            @{ name = "status"; type = "string"; facet = $true },
            @{ name = "full_name"; type = "string" }
        )
        default_sorting_field = "full_name"
    } | ConvertTo-Json -Depth 10
    
    # Essayer de créer, ignorer si existe déjà
    try {
        Invoke-RestMethod -Uri "$TypesenseBaseUrl/collections" -Method Post -Headers $Headers -Body $studentsSchema | Out-Null
        Write-Host "✅ Collection 'students' créée avec succès" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "ℹ️  Collection 'students' existe déjà" -ForegroundColor Gray
        } else {
            throw
        }
    }
} catch {
    Write-Host "❌ Erreur lors de la création de la collection students: $($_.Exception.Message)" -ForegroundColor Red
}

# Créer la collection Teachers
Write-Host "📚 Création de la collection 'teachers'..." -ForegroundColor Yellow
try {
    $teachersSchema = @{
        name = "teachers"
        fields = @(
            @{ name = "id"; type = "string" },
            @{ name = "firstName"; type = "string" },
            @{ name = "lastName"; type = "string" },
            @{ name = "email"; type = "string" },
            @{ name = "specialty"; type = "string"; facet = $true },
            @{ name = "contractType"; type = "string"; facet = $true },
            @{ name = "status"; type = "string"; facet = $true },
            @{ name = "fullName"; type = "string" }
        )
        default_sorting_field = "fullName"
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$TypesenseBaseUrl/collections" -Method Post -Headers $Headers -Body $teachersSchema | Out-Null
        Write-Host "✅ Collection 'teachers' créée avec succès" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "ℹ️  Collection 'teachers' existe déjà" -ForegroundColor Gray
        } else {
            throw
        }
    }
} catch {
    Write-Host "❌ Erreur lors de la création de la collection teachers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Fonction pour exécuter une requête PostgreSQL
Function Invoke-PostgresQuery {
    param([string]$Query)
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    try {
        & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -t -A -F '|' -c $Query | Out-File -FilePath $tempFile -Encoding UTF8
        
        $content = Get-Content $tempFile -Raw
        if ([string]::IsNullOrWhiteSpace($content)) {
            return @()
        }
        
        $lines = $content -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
        
        return $lines | ForEach-Object {
            $fields = $_ -split '\|'
            return $fields
        }
    } catch {
        Write-Host "❌ Erreur PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}

# Import des étudiants depuis PostgreSQL
Write-Host "📥 Extraction des étudiants depuis PostgreSQL..." -ForegroundColor Yellow

# Vérifier si psql est disponible
try {
    $psqlVersion = & psql --version
    Write-Host "✅ psql trouvé: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ psql n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "   Installez PostgreSQL client ou utilisez pgAdmin" -ForegroundColor Yellow
    exit 1
}

# Requête pour récupérer les étudiants
$studentQuery = @"
SELECT id, first_name, last_name, email, status 
FROM students 
WHERE id IS NOT NULL
LIMIT 1000;
"@

Write-Host "📊 Exécution de la requête..." -ForegroundColor Yellow
$studentsData = Invoke-PostgresQuery -Query $studentQuery

if ($studentsData.Count -eq 0) {
    Write-Host "⚠️  Aucun étudiant trouvé dans la base de données" -ForegroundColor Yellow
} else {
    Write-Host "✅ $($studentsData.Count) étudiants trouvés" -ForegroundColor Green
    
    # Formater les documents pour Typesense
    $studentDocuments = @()
    foreach ($row in $studentsData) {
        $fields = $row -split '\|'
        if ($fields.Count -ge 4) {
            $doc = @{
                id = $fields[0].ToString()
                first_name = $fields[1].ToString()
                last_name = $fields[2].ToString()
                email = $fields[3].ToString()
                status = if ($fields.Count -gt 4) { $fields[4].ToString() } else { "ACTIVE" }
                full_name = "$($fields[1]) $($fields[2])".Trim()
            }
            $studentDocuments += $doc
        }
    }
    
    if ($studentDocuments.Count -gt 0) {
        Write-Host "📤 Indexation de $($studentDocuments.Count) étudiants dans Typesense..." -ForegroundColor Yellow
        
        try {
            $jsonBody = $studentDocuments | ConvertTo-Json -Depth 10
            
            $importUrl = "$TypesenseBaseUrl/collections/students/documents/import?action=upsert"
            $result = Invoke-RestMethod -Uri $importUrl -Method Post -Headers $Headers -Body $jsonBody
            
            Write-Host "✅ $($studentDocuments.Count) étudiants indexés avec succès" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erreur lors de l'indexation: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Import des enseignants depuis PostgreSQL
Write-Host "📥 Extraction des enseignants depuis PostgreSQL..." -ForegroundColor Yellow

$teacherQuery = @"
SELECT id, "firstName", "lastName", email, specialty, "contractType", status 
FROM staff 
WHERE "contractType" = 'TEACHING' AND id IS NOT NULL
LIMIT 1000;
"@

$teachersData = Invoke-PostgresQuery -Query $teacherQuery

if ($teachersData.Count -eq 0) {
    Write-Host "⚠️  Aucun enseignant trouvé dans la base de données" -ForegroundColor Yellow
} else {
    Write-Host "✅ $($teachersData.Count) enseignants trouvés" -ForegroundColor Green
    
    # Formater les documents pour Typesense
    $teacherDocuments = @()
    foreach ($row in $teachersData) {
        $fields = $row -split '\|'
        if ($fields.Count -ge 6) {
            $doc = @{
                id = $fields[0].ToString()
                firstName = $fields[1].ToString()
                lastName = $fields[2].ToString()
                email = $fields[3].ToString()
                specialty = $fields[4].ToString()
                contractType = $fields[5].ToString()
                status = if ($fields.Count -gt 6) { $fields[6].ToString() } else { "ACTIVE" }
                fullName = "$($fields[1]) $($fields[2])".Trim()
            }
            $teacherDocuments += $doc
        }
    }
    
    if ($teacherDocuments.Count -gt 0) {
        Write-Host "📤 Indexation de $($teacherDocuments.Count) enseignants dans Typesense..." -ForegroundColor Yellow
        
        try {
            $jsonBody = $teacherDocuments | ConvertTo-Json -Depth 10
            
            $importUrl = "$TypesenseBaseUrl/collections/teachers/documents/import?action=upsert"
            $result = Invoke-RestMethod -Uri $importUrl -Method Post -Headers $Headers -Body $jsonBody
            
            Write-Host "✅ $($teacherDocuments.Count) enseignants indexés avec succès" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erreur lors de l'indexation: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📊 Résumé de l'indexation" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Récupérer les statistiques
try {
    $studentsCollection = Invoke-RestMethod -Uri "$TypesenseBaseUrl/collections/students" -Method Get -Headers $Headers
    $teachersCollection = Invoke-RestMethod -Uri "$TypesenseBaseUrl/collections/teachers" -Method Get -Headers $Headers
    
    Write-Host ""
    Write-Host "✅ Students: $($studentsCollection.num_documents) documents" -ForegroundColor Green
    Write-Host "✅ Teachers: $($teachersCollection.num_documents) documents" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Import terminé avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Vous pouvez maintenant rechercher :" -ForegroundColor Cyan
    Write-Host "   curl `"$TypesenseBaseUrl/collections/students/documents/search?q=dupont&query_by=first_name,last_name`"" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Impossible de récupérer les statistiques" -ForegroundColor Yellow
    Write-Host "   Mais l'import a probablement réussi" -ForegroundColor Gray
}
