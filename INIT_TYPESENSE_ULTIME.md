# 🎯 Guide Ultime - Initialiser Typesense en 5 Minutes

## ✅ Étape 1: Vérifier que Typesense tourne

```powershell
docker-compose ps typesense
```

Doit afficher: `Up` et `0.0.0.0:8108->8108/tcp`

---

## 📊 Étape 2: Créer les collections (déjà fait !)

La collection **students** est déjà créée ✅

Pour créer **teachers**, exécutez dans PowerShell :

```powershell
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
        @{ name = "fullName"; type = "string"; sort = $true }
    )
    default_sorting_field = "fullName"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8108/collections" -Method Post -Headers @{"Content-Type"="application/json"; "X-TYPESENSE-API-KEY"="xyz"} -Body $teachersSchema
```

---

## 📝 Étape 3: Indexer des étudiants

Ouvrez PowerShell et exécutez :

```powershell
# Données étudiants
$students = @(
    @{ id = "1"; first_name = "Jean"; last_name = "Dupont"; email = "jean.dupont@student.cm"; status = "ACTIVE"; full_name = "Jean Dupont" },
    @{ id = "2"; first_name = "Marie"; last_name = "Curie"; email = "marie.curie@student.cm"; status = "ACTIVE"; full_name = "Marie Curie" },
    @{ id = "3"; first_name = "Pierre"; last_name = "Ngomo"; email = "pierre.ngomo@student.cm"; status = "ACTIVE"; full_name = "Pierre Ngomo" }
)

# Convertir en NDJSON (une ligne par document)
$ndjson = $students | ForEach-Object { $_ | ConvertTo-Json -Compress }

# Envoyer à Typesense
$headers = @{
    "Content-Type" = "application/json"
    "X-TYPESENSE-API-KEY" = "xyz"
}

$body = $ndjson -join "`n"
Invoke-RestMethod -Uri "http://localhost:8108/collections/students/documents/import?action=upsert" -Method Post -Headers $headers -Body $body

Write-Host "✅ Étudiants indexés !" -ForegroundColor Green
```

---

## 📝 Étape 4: Indexer des enseignants

```powershell
# Données enseignants
$teachers = @(
    @{ id = "1"; firstName = "Albert"; lastName = "Einstein"; email = "albert.e@prof.cm"; specialty = "Physique"; contractType = "TEACHING"; status = "ACTIVE"; fullName = "Albert Einstein" },
    @{ id = "2"; firstName = "Isaac"; lastName = "Newton"; email = "isaac.n@prof.cm"; specialty = "Mathematiques"; contractType = "TEACHING"; status = "ACTIVE"; fullName = "Isaac Newton" },
    @{ id = "3"; firstName = "Louis"; lastName = "Pasteur"; email = "louis.p@prof.cm"; specialty = "Chimie"; contractType = "TEACHING"; status = "ACTIVE"; fullName = "Louis Pasteur" }
)

$ndjson = $teachers | ForEach-Object { $_ | ConvertTo-Json -Compress }
$headers = @{
    "Content-Type" = "application/json"
    "X-TYPESENSE-API-KEY" = "xyz"
}
$body = $ndjson -join "`n"

Invoke-RestMethod -Uri "http://localhost:8108/collections/teachers/documents/import?action=upsert" -Method Post -Headers $headers -Body $body

Write-Host "✅ Enseignants indexés !" -ForegroundColor Green
```

---

## 🔍 Étape 5: Tester la recherche

### Rechercher un étudiant

```powershell
$result = Invoke-RestMethod -Uri "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}
$result.hits | Format-Table
```

### Rechercher un enseignant par matière

```powershell
$result = Invoke-RestMethod -Uri "http://localhost:8108/collections/teachers/documents/search?q=physique&query_by=specialty" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}
$result.hits | Format-Table
```

### Voir tous les documents

```powershell
# Students
$s = Invoke-RestMethod -Uri "http://localhost:8108/collections/students" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}
Write-Host "Students: $($s.num_documents) documents"

# Teachers
$t = Invoke-RestMethod -Uri "http://localhost:8108/collections/teachers" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}
Write-Host "Teachers: $($t.num_documents) documents"
```

---

## 🎉 Résultat Final

Après avoir exécuté ces commandes, vous aurez :

- ✅ **3 étudiants** indexés dans Typesense
- ✅ **3 enseignants** indexés
- ✅ Recherche fonctionnelle
- ✅ Filtres par facettes (status, specialty, contractType)

---

## 🌐 Interface Web

Typesense n'a pas d'interface web native, mais vous pouvez utiliser :

- **Typesense Dashboard**: https://github.com/typesense/dashboard
- **Postman/Insomnia**: Pour tester l'API
- **curl/PowerShell**: Comme montré ci-dessus

---

## 📚 Exemples de Requêtes

```powershell
# Recherche floue
Invoke-RestMethod "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name&num_typos=1" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}

# Avec filtre
Invoke-RestMethod "http://localhost:8108/collections/students/documents/search?q=*&filter_by=status:=ACTIVE" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}

# Tri
Invoke-RestMethod "http://localhost:8108/collections/students/documents/search?q=*&sort_by=full_name:asc" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}

# Facettes
Invoke-RestMethod "http://localhost:8108/collections/teachers/documents/search?q=*&facet_by=specialty" -Headers @{"X-TYPESENSE-API-KEY"="xyz"}
```

---

## ✅ Checklist Finale

- [x] Typesense tourne (port 8108)
- [ ] Collection teachers créée
- [ ] 3 étudiants indexés
- [ ] 3 enseignants indexés
- [ ] Recherche testée et fonctionnelle

---

*Une fois tout cela fait, Typesense sera opérationnel avec vos données !*
