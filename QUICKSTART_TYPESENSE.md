# 🚀 Démarrage Rapide - Typesense + RabbitMQ

## Installation et Initialisation

### Étape 1: Démarrer les services

```bash
# Démarrer tous les services Docker
docker-compose up -d

# Attendre que les services soient prêts (2-3 minutes)
docker-compose ps
```

### Étape 2: Initialiser Typesense avec les données

**Option A: Script automatique (Recommandé)**

```bash
# Windows PowerShell
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# Si le script échoue, exécutez manuellement:
# 1. Reset des collections
curl -X POST http://localhost:3000/api/search/reset-collections

# 2. Indexation complète
curl -X POST http://localhost:3000/api/search/index/all
```

**Option B: Commandes manuelles**

```bash
# 1. Vérifier Typesense
curl http://localhost:3000/api/search/health

# 2. Vérifier la base de données
curl http://localhost:3000/api/database/stats

# 3. indexer les étudiants
curl -X POST http://localhost:3000/api/search/index/students

# 4. Indexer les enseignants
curl -X POST http://localhost:3000/api/search/index/teachers
```

### Étape 3: Tester l'intégration complète

```bash
# Exécuter les tests d'intégration
docker-compose exec backend bash /app/src/scripts/test-integration.sh
```

## 🎯 URLs Importantes

| Service | URL | Login/Mot de passe |
|---------|-----|-------------------|
| **Typesense** | http://localhost:8108 | - |
| **RabbitMQ UI** | http://localhost:15672 | admin / admin |
| **Backend API** | http://localhost:3000 | - |
| **PostgreSQL** | localhost:5432 | postgres / postgres |

## 📡 Endpoints API Principaux

### Database
```bash
GET  http://localhost:3000/api/database/stats    # Statistiques DB
GET  http://localhost:3000/api/database/check    # Vérifier connexion
```

### Typesense
```bash
GET  http://localhost:3000/api/search/health           # Santé Typesense
POST http://localhost:3000/api/search/index/students   # Indexer étudiants
POST http://localhost:3000/api/search/index/teachers   # Indexer enseignants
POST http://localhost:3000/api/search/index/all        # Tout indexer
POST http://localhost:3000/api/search/reset-collections # Reset
```

### RabbitMQ Test
```bash
GET  http://localhost:3000/api/rabbitmq/health              # Santé RabbitMQ
POST http://localhost:3000/api/rabbitmq/test/student-created # Test event
POST http://localhost:3000/api/rabbitmq/test/teacher-created # Test event
```

## 🔍 Recherche dans Typesense

### Via API Typesense directe

```bash
# Rechercher des étudiants
curl "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name,email"

# Rechercher des enseignants
curl "http://localhost:8108/collections/teachers/documents/search?q=informatique&query_by=specialty"

# Voir toutes les collections
curl http://localhost:8108/collections
```

### Via le Frontend

Le frontend peut utiliser le service de recherche:

```typescript
import { SearchService } from './services/search.service';

// Rechercher des étudiants
const results = await SearchService.search(
  'students',
  'dupont',
  'first_name,last_name,email'
);

// Rechercher des enseignants
const teachers = await SearchService.search(
  'teachers',
  'mathematiques',
  'specialty,full_name'
);
```

## 🐰 Flux RabbitMQ

### Événements émis par les services

Depuis `service-core-scolarite`:

```typescript
// Création d'un étudiant
this.rabbitClient.emit('student.created', studentData);

// Création d'un enseignant
this.rabbitClient.emit('teacher.created', teacherData);

// Mise à jour d'un enseignant
this.rabbitClient.emit('teacher.updated', teacherData);

// Suppression d'un enseignant
this.rabbitClient.emit('teacher.deleted', { id });
```

### Événements consommés par le backend

Le backend ([`student-events.controller.ts`](backend/src/events/student-events.controller.ts)) écoute:

- `student.created` → Crée LMS + SnipeIT + Indexe Typesense
- `teacher.created` → Indexe dans Typesense
- `teacher.updated` → Met à jour l'index Typesense
- `teacher.deleted` → Supprime de Typesense

## ✅ Checklist de Validation

Après initialisation, vérifiez:

- [ ] Typesense accessible: http://localhost:8108
- [ ] RabbitMQ accessible: http://localhost:15672
- [ ] Backend répond: http://localhost:3000/api/database/check
- [ ] Collections créées: `curl http://localhost:8108/collections`
- [ ] Documents indexés:
  - Students: `curl http://localhost:8108/collections/students`
  - Teachers: `curl http://localhost:8108/collections/teachers`
- [ ] Recherche fonctionne: tester une requête simple

## 🛠️ Dépannage

### Les services ne démarrent pas

```bash
# Voir les logs
docker-compose logs backend
docker-compose logs typesense
docker-compose logs rabbitmq

# Redémarrer un service
docker-compose restart backend

# Reconstruire
docker-compose down
docker-compose up -d --build
```

### Typesense est vide

```bash
# Reset complet
curl -X POST http://localhost:3000/api/search/reset-collections

# Réindexer
curl -X POST http://localhost:3000/api/search/index/all
```

### RabbitMQ ne fonctionne pas

```bash
# Vérifier la queue
curl -u admin:admin http://localhost:15672/api/queues/%2F/school_events

# Purger la queue (si nécessaire)
curl -u admin:admin -X POST http://localhost:15672/api/queues/%2F/school_events/purge
```

### Erreurs d'indexation

Vérifier les logs du backend:

```bash
docker-compose logs -f backend | grep -i typesense
```

## 📊 Monitoring

### Logs en temps réel

```bash
# Backend
docker-compose logs -f backend

# Typesense
docker-compose logs -f typesense

# RabbitMQ
docker-compose logs -f rabbitmq
```

### Statistiques

```bash
# Nombre de documents dans Typesense
curl http://localhost:8108/collections/students | jq .num_documents
curl http://localhost:8108/collections/teachers | jq .num_documents

# Messages RabbitMQ
curl -u admin:admin http://localhost:15672/api/queues/%2F/school_events | jq .messages
```

## 🎓 Exemple Complet

```bash
# 1. Démarrer
docker-compose up -d

# 2. Attendre (voir logs)
docker-compose logs -f

# 3. Initialiser Typesense
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# 4. Tester
docker-compose exec backend bash /app/src/scripts/test-integration.sh

# 5. Utiliser
curl "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name,last_name"
```

---

**Documentation complète**: [TYPESENSE_SETUP_GUIDE.md](TYPESENSE_SETUP_GUIDE.md)
