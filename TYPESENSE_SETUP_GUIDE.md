# Typesense & RabbitMQ - Guide d'initialisation

Ce document explique comment charger la base de données dans Typesense et vérifier la communication avec RabbitMQ.

## 📋 Prérequis

- Docker et Docker Compose installés
- Les services doivent être démarrés (postgres, rabbitmq, typesense, backend)

## 🚀 Démarrage des services

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que les services sont prêts
docker-compose ps
```

Services requis:
- ✅ `postgres` - Base de données
- ✅ `rabbitmq` - Message broker (port 15672 pour l'UI)
- ✅ `typesense` - Moteur de recherche (port 8108)
- ✅ `backend` - API NestJS (port 3000)

## 🔧 Initialisation de Typesense

### Option 1: Script automatique (Recommandé)

Le script va:
1. Attendre que tous les services soient prêts
2. Créer les collections dans Typesense
3. Charger toutes les données depuis la base

```bash
# Rendre le script exécutable
chmod +x backend/src/scripts/init-typesense.sh

# Exécuter le script
docker-compose exec backend bash /app/src/scripts/init-typesense.sh
```

### Option 2: Via les endpoints API

#### 1. Vérifier la santé de Typesense

```bash
curl http://localhost:3000/api/search/health
```

Réponse attendue:
```json
{
  "service": "typesense",
  "healthy": true,
  "timestamp": "2026-03-18T..."
}
```

#### 2. Vérifier les données en base

```bash
curl http://localhost:3000/api/database/stats
```

Réponse attendue:
```json
{
  "students": {
    "total": 150,
    "sample": [...]
  },
  "teachers": {
    "total": 25,
    "sample": [...]
  }
}
```

#### 3. Lancer l'indexation complète

```bash
# Indexer étudiants ET enseignants
curl -X POST http://localhost:3000/api/search/index/all

# Ou indexer séparément
curl -X POST http://localhost:3000/api/search/index/students
curl -X POST http://localhost:3000/api/search/index/teachers
```

#### 4. Réinitialiser les collections (si nécessaire)

```bash
curl -X POST http://localhost:3000/api/search/reset-collections
```

## 🔍 Vérification dans Typesense

### Via l'interface Typesense

1. Ouvrez: http://localhost:8108
2. Collections disponibles:
   - `students` - Tous les étudiants indexés
   - `teachers` - Tous les enseignants indexés

### Via l'API Typesense

```bash
# Voir les collections
curl http://localhost:8108/collections

# Voir les documents students
curl "http://localhost:8108/collections/students/documents/search?q=*"

# Voir les documents teachers
curl "http://localhost:8108/collections/teachers/documents/search?q=*"
```

## 🐰 Vérification RabbitMQ

### Interface de management RabbitMQ

1. Ouvrez: http://localhost:15672
2. Login: `admin` / Password: `admin`
3. Vérifiez:
   - Queue: `school_events`
   - Messages publiés/consommés

### Événements écoutés par le backend

Le backend écoute ces événements via RabbitMQ:

- `student.created` - Crée les comptes externes et indexe dans Typesense
- `teacher.created` - Indexe l'enseignant dans Typesense
- `teacher.updated` - Met à jour l'index Typesense
- `teacher.deleted` - Supprime de l'index Typesense

### Tester l'envoi d'événement

Depuis service-core-scolarite:

```typescript
// Création d'un enseignant
this.rabbitClient.emit('teacher.created', {
  id: 1,
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@example.com',
  specialty: 'Mathématiques',
  contractType: 'TEACHING',
  status: 'ACTIVE'
});
```

Le backend va automatiquement:
1. Recevoir l'événement via RabbitMQ
2. Indexer l'enseignant dans Typesense
3. Logger: `✅ Typesense Teacher Index Updated (created)`

## 📊 Endpoints API utiles

### Database
- `GET /api/database/stats` - Statistiques de la base
- `GET /api/database/check` - Vérifier connexion DB

### Search (Typesense)
- `GET /api/search/health` - Santé Typesense
- `POST /api/search/index/students` - Indexer tous les étudiants
- `POST /api/search/index/teachers` - Indexer tous les enseignants
- `POST /api/search/index/all` - Tout indexer
- `POST /api/search/reset-collections` - Reset collections

## 🔍 Recherche dans Typesense

### Exemple de recherche d'étudiants

```bash
curl "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name,email"
```

### Exemple de recherche d'enseignants

```bash
curl "http://localhost:8108/collections/teachers/documents/search?q=mathematiques&query_by=specialty"
```

## 🛠️ Dépannage

### Typesense n'est pas accessible

```bash
# Vérifier le container
docker-compose ps typesense

# Voir les logs
docker-compose logs typesense

# Redémarrer
docker-compose restart typesense
```

### RabbitMQ ne fonctionne pas

```bash
# Vérifier le container
docker-compose ps rabbitmq

# Voir les logs
docker-compose logs rabbitmq

# Accéder à l'UI
http://localhost:15672
```

### Le backend ne se connecte pas

Vérifier les variables d'environnement dans `.env`:

```env
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=xyz

RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=admin_school
DATABASE_PASSWORD=secure_password_123
DATABASE_NAME=school_db
```

### Réindexer après une modification

```bash
# Reset complet
curl -X POST http://localhost:3000/api/search/reset-collections

# Réindexer tout
curl -X POST http://localhost:3000/api/search/index/all
```

## 📈 Monitoring

### Logs du backend

```bash
docker-compose logs -f backend
```

### Compter les documents dans Typesense

```bash
# Students
curl "http://localhost:8108/collections/students" | jq .num_documents

# Teachers  
curl "http://localhost:8108/collections/teachers" | jq .num_documents
```

## ✅ Checklist de validation

- [ ] Services Docker démarrés (`docker-compose ps`)
- [ ] Typesense accessible (http://localhost:8108)
- [ ] RabbitMQ accessible (http://localhost:15672)
- [ ] Backend API répond (http://localhost:3000/api/database/check)
- [ ] Collections créées (`curl http://localhost:8108/collections`)
- [ ] Données indexées (vérifier num_documents)
- [ ] Recherche fonctionnelle (tester une requête)
- [ ] Événements RabbitMQ fonctionnels (créer un étudiant/prof)

## 🎯 Prochaines étapes

Après l'initialisation:

1. **Frontend**: Intégrer la recherche dans l'UI
2. **Sync automatique**: Les nouveaux étudiants/profs seront automatiquement indexés via RabbitMQ
3. **Optimisation**: Ajuster les champs de recherche et facets selon les besoins

---

**Support**: Pour toute question, consultez les logs ou vérifiez la configuration des services.
