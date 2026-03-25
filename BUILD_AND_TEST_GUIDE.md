# 🚀 Procédure de Build et Test - Typesense + RabbitMQ

## Situation Actuelle

Le backend `service-core-scolarite` est en cours de rebuild avec les nouveaux modules Typesense et RabbitMQ.

---

## ⏳ Après la Fin du Build

### Étape 1: Redémarrer le service

Une fois le build terminé (quand vous voyez "Built successfully"), exécutez :

```powershell
# Redémarrer le service avec la nouvelle image
docker-compose up -d service-core-scolarite
```

### Étape 2: Attendre le démarrage

```powershell
# Attendre 15 secondes que le service démarre
Start-Sleep -Seconds 15
```

### Étape 3: Vérifier que les endpoints sont disponibles

```powershell
# Tester l'endpoint de santé Typesense
curl.exe -s http://localhost/api/core/search/health

# Tester l'endpoint database check
curl.exe -s http://localhost/api/core/database/check

# Tester l'endpoint RabbitMQ health
curl.exe -s http://localhost/api/core/rabbitmq/health
```

**Si vous obtenez des réponses JSON** (pas d'erreur 404), c'est bon ! ✅

### Étape 4: Lancer l'indexation

```powershell
# Indexer tous les étudiants et enseignants
curl.exe -X POST http://localhost/api/core/search/index/all

# Ou indexer séparément
curl.exe -X POST http://localhost/api/core/search/index/students
curl.exe -X POST http://localhost/api/core/search/index/teachers
```

### Étape 5: Vérifier dans Typesense

```powershell
# Voir les collections
curl.exe -s http://localhost:8108/collections

# Voir le nombre d'étudiants indexés
curl.exe -s http://localhost:8108/collections/students | ConvertFrom-Json | Select-Object -ExpandProperty num_documents

# Voir le nombre d'enseignants indexés
curl.exe -s http://localhost:8108/collections/teachers | ConvertFrom-Json | Select-Object -ExpandProperty num_documents
```

---

## 🔍 URLs Correctes avec Traefik

Avec Traefik, les endpoints sont accessibles via :

| Endpoint | URL Complète |
|----------|-------------|
| **Database Check** | http://localhost/api/core/database/check |
| **Search Health** | http://localhost/api/core/search/health |
| **RabbitMQ Health** | http://localhost/api/core/rabbitmq/health |
| **Index All** | http://localhost/api/core/search/index/all (POST) |
| **Index Students** | http://localhost/api/core/search/index/students (POST) |
| **Index Teachers** | http://localhost/api/core/search/index/teachers (POST) |
| **Reset Collections** | http://localhost/api/core/search/reset-collections (POST) |

---

## 🧪 Script PowerShell Complet

Copiez-collez ce script une fois le build terminé :

```powershell
Write-Host "🔄 Attente du démarrage du service..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "`n🏥 Vérification de Typesense..." -ForegroundColor Cyan
$typesenseHealth = curl.exe -s http://localhost/api/core/search/health
Write-Host $typesenseHealth

Write-Host "`n💾 Vérification de la base de données..." -ForegroundColor Cyan
$dbCheck = curl.exe -s http://localhost/api/core/database/check
Write-Host $dbCheck

Write-Host "`n🐰 Vérification de RabbitMQ..." -ForegroundColor Cyan
$rabbitHealth = curl.exe -s http://localhost/api/core/rabbitmq/health
Write-Host $rabbitHealth

Write-Host "`n📊 Lancement de l'indexation complète..." -ForegroundColor Cyan
$indexResult = curl.exe -s -X POST http://localhost/api/core/search/index/all
Write-Host $indexResult

Write-Host "`n✅ Vérification dans Typesense..." -ForegroundColor Cyan
$students = curl.exe -s http://localhost:8108/collections/students | ConvertFrom-Json
$teachers = curl.exe -s http://localhost:8108/collections/teachers | ConvertFrom-Json

Write-Host "   Étudiants indexés: $($students.num_documents)" -ForegroundColor Green
Write-Host "   Enseignants indexés: $($teachers.num_documents)" -ForegroundColor Green

Write-Host "`n🎉 Initialisation terminée !" -ForegroundColor Green
```

---

## 🛠️ En Cas de Problème

### Erreur 404 sur les endpoints

Signifie que le module n'est pas chargé. Vérifiez les logs :

```powershell
docker-compose logs service-core-scolarite --tail 50
```

Cherchez les lignes contenant :
- `SearchModule`
- `DatabaseModule`
- `RabbitMQTestModule`

### Le service ne démarre pas

Vérifiez les erreurs de compilation :

```powershell
docker-compose logs service-core-scolarite | Select-String -Pattern "Error|error|ERROR"
```

### Typesense inaccessible

Vérifiez que Typesense tourne :

```powershell
docker-compose ps typesense
curl.exe -s http://localhost:8108/health
```

---

## 📝 Notes Importantes

1. **Traefik modifie les URLs** : 
   - Sans Traefik: `http://localhost:3000/api/...`
   - Avec Traefik: `http://localhost/api/core/...`

2. **Le prefix `/api/core`** vient de la configuration Traefik dans `docker-compose.yml`

3. **Les endpoints directs** (sans Traefik) sont toujours accessibles :
   ```powershell
   curl.exe -s http://localhost:3000/api/core/search/health
   ```

---

## ✅ Checklist de Succès

Après exécution, vous devriez avoir :

- [ ] Typesense health retourne `{"healthy": true}`
- [ ] Database check retourne des statistiques
- [ ] RabbitMQ health retourne `{"connected": true}`
- [ ] L'indexation affiche `"success": true`
- [ ] Les collections Typesense ont des documents (> 0)
- [ ] La recherche fonctionne dans Typesense

---

## 🎯 Prochaine Étape

Une fois tout fonctionnel, testez la recherche :

```powershell
# Rechercher un étudiant
curl.exe -s "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name,last_name,email"

# Rechercher un enseignant  
curl.exe -s "http://localhost:8108/collections/teachers/documents/search?q=informatique&query_by=specialty"
```

---

*Ce guide tient compte de la configuration Traefik actuelle*
