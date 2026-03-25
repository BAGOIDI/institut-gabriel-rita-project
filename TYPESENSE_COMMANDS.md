# ⚡ Commandes Rapides - Typesense + RabbitMQ

## 🚀 Démarrage en 5 étapes

### Étape 1: Démarrer Docker
```bash
docker-compose up -d
```

### Étape 2: Attendre que les services soient prêts
```bash
# Vérifier l'état
docker-compose ps

# Ou voir les logs
docker-compose logs -f
```

### Étape 3: Initialiser Typesense
```bash
# Exécuter le script d'initialisation
docker-compose exec backend bash /app/src/scripts/init-typesense.sh
```

### Étape 4: Tester l'intégration
```bash
# Exécuter les tests
docker-compose exec backend bash /app/src/scripts/test-integration.sh
```

### Étape 5: Vérifier les résultats
```bash
# Voir les collections Typesense
curl http://localhost:8108/collections

# Voir le nombre de documents
curl http://localhost:8108/collections/students | jq .num_documents
curl http://localhost:8108/collections/teachers | jq .num_documents
```

---

## 🔧 Commandes Utiles

### Initialisation

```bash
# Reset et indexation complète
curl -X POST http://localhost:3000/api/search/reset-collections
curl -X POST http://localhost:3000/api/search/index/all

# Indexer séparément
curl -X POST http://localhost:3000/api/search/index/students
curl -X POST http://localhost:3000/api/search/index/teachers
```

### Vérification

```bash
# Santé Typesense
curl http://localhost:3000/api/search/health

# Santé RabbitMQ
curl http://localhost:3000/api/rabbitmq/health

# Stats database
curl http://localhost:3000/api/database/stats
```

### Test des événements

```bash
# Envoyer un événement test
curl -X POST http://localhost:3000/api/rabbitmq/test/student-created
curl -X POST http://localhost:3000/api/rabbitmq/test/teacher-created

# Tout tester
curl -X POST http://localhost:3000/api/rabbitmq/test/all
```

### Recherche dans Typesense

```bash
# Rechercher un étudiant
curl "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name,email"

# Rechercher un enseignant
curl "http://localhost:8108/collections/teachers/documents/search?q=informatique&query_by=specialty"

# Voir tous les documents
curl "http://localhost:8108/collections/students/documents/search?q=*&per_page=5"
curl "http://localhost:8108/collections/teachers/documents/search?q=*&per_page=5"
```

---

## 🛠️ Dépannage

### Redémarrer un service
```bash
docker-compose restart backend
docker-compose restart typesense
docker-compose restart rabbitmq
```

### Voir les logs
```bash
# Backend
docker-compose logs -f backend

# Typesense
docker-compose logs -f typesense

# RabbitMQ
docker-compose logs -f rabbitmq

# Tous ensemble
docker-compose logs -f
```

### Reconstruire complètement
```bash
# Arrêter tout
docker-compose down

# Nettoyer les volumes (attention: efface les données!)
docker-compose down -v

# Reconstruire
docker-compose up -d --build
```

### Tuer et recréer un container
```bash
docker-compose kill backend
docker-compose rm -f backend
docker-compose up -d backend
```

---

## 📊 URLs Importantes

| Service | URL | Credentials |
|---------|-----|-------------|
| Typesense | http://localhost:8108 | - |
| RabbitMQ UI | http://localhost:15672 | admin / admin |
| Backend API | http://localhost:3000 | - |
| Frontend | http://localhost | - |
| Traefik Dashboard | http://localhost:8080 | - |

---

## ✅ Checklist de Validation

Après initialisation, exécutez:

```bash
# 1. Typesense répond
curl http://localhost:8108/health

# 2. RabbitMQ répond
curl -u admin:admin http://localhost:15672/api/healthchecks/node

# 3. Backend répond
curl http://localhost:3000/api/database/check

# 4. Collections existent
curl http://localhost:8108/collections

# 5. Documents indexés
curl http://localhost:8108/collections/students | jq .num_documents
curl http://localhost:8108/collections/teachers | jq .num_documents

# 6. Recherche fonctionne
curl "http://localhost:8108/collections/students/documents/search?q=*"
```

---

## 🎯 Workflow Complet

```bash
# 1. Démarrer
docker-compose up -d

# 2. Attendre (logs)
docker-compose logs -f

# 3. Dans un autre terminal, initialiser
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# 4. Tester
docker-compose exec backend bash /app/src/scripts/test-integration.sh

# 5. Utiliser la recherche
curl "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name"
```

---

## 📝 Notes

- **Premier démarrage**: L'indexation peut prendre quelques minutes selon la taille de la DB
- **Événements temps réel**: Les nouveaux étudiants/profs sont automatiquement indexés via RabbitMQ
- **Persistence**: Les données Typesense sont conservées dans le volume Docker
- **API Keys**: La clé par défaut est `xyz` (à changer en production)

---

**Pour plus de détails**: 
- [QUICKSTART_TYPESENSE.md](QUICKSTART_TYPESENSE.md)
- [TYPESENSE_SETUP_GUIDE.md](TYPESENSE_SETUP_GUIDE.md)
- [TYPESENSE_IMPLEMENTATION_SUMMARY.md](TYPESENSE_IMPLEMENTATION_SUMMARY.md)
