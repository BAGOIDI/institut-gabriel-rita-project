# 🎯 Typesense + RabbitMQ - Point d'Entrée

> **Ce fichier est votre point de départ pour utiliser Typesense et RabbitMQ dans le projet Institut Gabriel Rita.**

---

## ⚡ En 30 Secondes

```bash
# 1. Démarrer les services
docker-compose up -d

# 2. Initialiser Typesense avec les données de la BD
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# 3. Tester que tout fonctionne
docker-compose exec backend bash /app/src/scripts/test-integration.sh
```

**C'est tout !** Typesense est maintenant chargé avec vos données et synchronisé via RabbitMQ.

---

## 📚 Documentation Complète

### Pour Commencer (Lire dans l'ordre)

1. **[QUICKSTART_TYPESENSE.md](QUICKSTART_TYPESENSE.md)** ⭐ **COMMENCEZ ICI**
   - Démarrage en 5 étapes
   - URLs importantes
   - Endpoints principaux

2. **[TYPESENSE_COMMANDS.md](TYPESENSE_COMMANDS.md)**
   - Toutes les commandes utiles
   - Exemples copy-paste
   - Dépannage rapide

3. **[TYPESENSE_SETUP_GUIDE.md](TYPESENSE_SETUP_GUIDE.md)**
   - Guide détaillé de configuration
   - Architecture complète
   - Procédures de dépannage

4. **[TYPESENSE_IMPLEMENTATION_SUMMARY.md](TYPESENSE_IMPLEMENTATION_SUMMARY.md)**
   - Synthèse technique
   - Ce qui a été implémenté
   - Architecture du flux de données

5. **[TYPESENSE_RABBITMQ_COMPLETE.md](TYPESENSE_RABBITMQ_COMPLETE.md)**
   - Résumé final
   - Checklist de validation
   - Prochaines étapes

---

## 🔍 Qu'est-ce Qui a Été Fait ?

### ✅ Infrastructure

- **Typesense**: Moteur de recherche installé et configuré (port 8108)
- **RabbitMQ**: Message broker opérationnel (ports 5672/15672)
- **Backend NestJS**: Connecté à Typesense et RabbitMQ
- **Collections auto-créées**: `students` et `teachers`

### ✅ Fonctionnalités

- **Indexation automatique**: Au démarrage, crée les collections
- **Indexation en masse**: Charge toute la base de données en une fois
- **Synchronisation temps réel**: Via événements RabbitMQ
- **API complète**: Endpoints pour indexer, resetter, tester
- **Scripts automatisés**: Initialisation et tests en un clic

### ✅ Flux de Données

```
PostgreSQL → Backend → Typesense
     ↓           ↑
service-core-scolarite (via RabbitMQ)
```

Quand vous créez un étudiant dans service-core-scolarite:
1. Il est sauvegardé dans PostgreSQL
2. Un événement `student.created` est émis via RabbitMQ
3. Le backend reçoit l'événement
4. L'étudiant est indexé dans Typesense automatiquement
5. **Résultat**: Searchable en < 1 seconde

---

## 🎯 Comment Ça Marche ?

### Initialisation (Manuel)

```bash
# Charge TOUTES les données depuis PostgreSQL
curl -X POST http://localhost:3000/api/search/index/all
```

### Synchronisation (Automatique)

```typescript
// Dans service-core-scolarite
this.rabbitClient.emit('student.created', studentData);
// → Le backend indexe automatiquement dans Typesense
```

### Recherche

```bash
# Dans Typesense directement
curl "http://localhost:8108/collections/students/documents/search?q=dupont"
```

---

## 📋 URLs Importantes

| Service | URL | Credentials |
|---------|-----|-------------|
| Typesense | http://localhost:8108 | - |
| RabbitMQ UI | http://localhost:15672 | admin / admin |
| Backend API | http://localhost:3000 | - |

---

## 🧪 Vérification Rapide

```bash
# 1. Typesense répond ?
curl http://localhost:8108/health

# 2. Backend répond ?
curl http://localhost:3000/api/search/health

# 3. Collections existent ?
curl http://localhost:8108/collections

# 4. Nombre de documents ?
curl http://localhost:8108/collections/students | jq .num_documents
curl http://localhost:8108/collections/teachers | jq .num_documents
```

---

## 🛠️ En Cas de Problème

### Reset Complet

```bash
# 1. Reset des collections
curl -X POST http://localhost:3000/api/search/reset-collections

# 2. Réindexer
curl -X POST http://localhost:3000/api/search/index/all
```

### Voir les Logs

```bash
# Backend
docker-compose logs -f backend

# Typesense
docker-compose logs -f typesense

# RabbitMQ
docker-compose logs -f rabbitmq
```

### Redémarrer

```bash
docker-compose restart backend typesense rabbitmq
```

---

## 📖 Endpoints API Principaux

### Database
```bash
GET /api/database/stats    # Statistiques DB
GET /api/database/check    # Vérifier connexion
```

### Typesense
```bash
GET  /api/search/health              # Santé Typesense
POST /api/search/index/students      # Indexer étudiants
POST /api/search/index/teachers      # Indexer enseignants
POST /api/search/index/all           # Tout indexer
POST /api/search/reset-collections   # Reset complet
```

### RabbitMQ Test
```bash
GET  /api/rabbitmq/health                 # Santé RabbitMQ
POST /api/rabbitmq/test/student-created   # Test event
POST /api/rabbitmq/test/teacher-created   # Test event
```

---

## 🎓 Exemple Complet

```bash
# Scénario: Vous voulez rechercher des étudiants

# Étape 1: Initialiser (une seule fois)
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# Étape 2: Vérifier que c'est indexé
curl http://localhost:8108/collections/students | jq .num_documents
# → Affiche: 150 (par exemple)

# Étape 3: Rechercher
curl "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name,last_name"

# Résultat: Tous les étudiants prénommés Jean
```

---

## ✅ Checklist de Succès

Après initialisation:

- [ ] Typesense accessible (http://localhost:8108)
- [ ] RabbitMQ accessible (http://localhost:15672)
- [ ] Backend répond (http://localhost:3000/api/search/health)
- [ ] Collections créées (`curl http://localhost:8108/collections`)
- [ ] Documents dans `students` (> 0)
- [ ] Documents dans `teachers` (> 0)
- [ ] Recherche fonctionne (tester une requête)

---

## 🚀 Prochaine Étape

**Maintenant que Typesense est opérationnel:**

1. **Tester la recherche**
   ```bash
   curl "http://localhost:8108/collections/students/documents/search?q=*"
   ```

2. **Intégrer dans le frontend**
   - Utiliser le SearchService existant
   - Ajouter une barre de recherche
   - Afficher les résultats

3. **Personnaliser**
   - Ajuster les champs de recherche
   - Configurer les facettes
   - Optimiser la pertinence

---

## 📞 Besoin d'Aide ?

### Documentation Détaillée

- ⭐ **[QUICKSTART_TYPESENSE.md](QUICKSTART_TYPESENSE.md)** - Pour démarrer
- 📖 **[TYPESENSE_SETUP_GUIDE.md](TYPESENSE_SETUP_GUIDE.md)** - Guide complet
- ⚡ **[TYPESENSE_COMMANDS.md](TYPESENSE_COMMANDS.md)** - Commandes rapides
- 📋 **[TYPESENSE_IMPLEMENTATION_SUMMARY.md](TYPESENSE_IMPLEMENTATION_SUMMARY.md)** - Technique

### Logs et Debugging

```bash
# Voir tous les logs
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend | grep -i typesense

# Typesense uniquement
docker-compose logs -f typesense
```

---

## 🎉 C'est Tout !

Vous avez maintenant:
- ✅ Typesense configuré et chargé avec vos données
- ✅ RabbitMQ opérationnel pour la synchro temps réel
- ✅ Une API complète pour gérer l'indexation
- ✅ Des scripts automatisés
- ✅ Une documentation complète

**Tout est prêt !** 🚀

---

*Dernière mise à jour: Mars 2026*  
*Pour l'Institut Gabriel Rita*
