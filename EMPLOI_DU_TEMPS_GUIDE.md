# 🚀 Démarrage Rapide - Emploi du Temps

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  Service Planning │────▶│  Service Reports │
│  (React)    │     │     (NestJS)      │     │     (Flask)      │
│  Port 5173  │     │     Port 3002     │     │     Port 8000     │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Option 1: Développement Local (Recommandé)

### Étape 1: Démarrer la base de données
```bash
docker-compose up -d postgres db-bootstrap
```

### Étape 2: Démarrer le Service Planning (Terminal 1)
```bash
cd service-planning
npm install
npm run start:dev
```
**Vérification**: http://localhost:3002/schedules

### Étape 3: Démarrer le Service Reports (Terminal 2)
```bash
cd report-service

# Créer le fichier .env.local s'il n'existe pas
cp .env.local.example .env.local

# Installer les dépendances Python (si nécessaire)
pip install -r requirements.txt

# Démarrer Flask
flask run --port 8000
```
**Vérification**: http://localhost:8000/api/reports/health

### Étape 4: Démarrer le Frontend (Terminal 3)
```bash
cd frontend
npm install
npm run dev
```
**Vérification**: http://localhost:5173

### Étape 5: Tester l'ensemble
```bash
node test-edt.js
```

---

## Option 2: Docker (Production)

### Démarrage complet
```bash
docker-compose up -d
```

### Vérification des services
```bash
docker-compose ps
docker-compose logs -f service-planning
docker-compose logs -f service-reports
```

### Accès
- **Frontend**: http://localhost/
- **Planning API**: http://localhost/api/planning/schedules
- **Reports API**: http://localhost/api/reports

---

## 🧪 Tests Rapides

### Test 1: Récupérer tous les EDT
```bash
curl http://localhost:3002/schedules
```

### Test 2: EDT d'une classe spécifique
```bash
curl http://localhost:3002/schedules/class/1
```

### Test 3: Générer un rapport PDF
```bash
curl -o edt.pdf "http://localhost:8000/api/reports/schedule/Terminale%20C?format=pdf"
```

### Test 4: Via le proxy frontend
```bash
curl http://localhost:5173/api/planning/schedules
```

---

## 🔧 Dépannage

### Problème: "Port already in use"
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### Problème: Service Reports ne démarre pas
```bash
cd report-service
pip install -r requirements.txt
export PLANNING_SERVICE_URL=http://localhost:3002/schedules
flask run --port 8000
```

### Problème: Frontend n'arrive pas à contacter l'API
Vérifier le proxy Vite dans `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api/planning': {
    target: 'http://localhost:3002',
    changeOrigin: true,
  },
}
```

---

## ✅ Checklist de vérification

- [ ] PostgreSQL est démarré (`docker-compose ps postgres`)
- [ ] Service Planning répond sur le port 3002
- [ ] Service Reports répond sur le port 8000
- [ ] Frontend est accessible sur le port 5173
- [ ] Les créneaux horaires s'affichent dans l'interface
- [ ] L'export PDF fonctionne
- [ ] La détection des conflits fonctionne

---

## 📚 Fonctionnalités à tester

### 1. Consultation
- [ ] Vue par classe
- [ ] Vue par enseignant
- [ ] Vue synthèse (multi-classes)
- [ ] Filtre Jour (08:00-17:00)
- [ ] Filtre Soir (17:30-21:00)
- [ ] Navigation semaine/mois

### 2. Création
- [ ] Cliquer sur "Nouveau créneau"
- [ ] Sélectionner une classe
- [ ] Sélectionner une matière
- [ ] Sélectionner un enseignant
- [ ] Choisir le jour et l'horaire
- [ ] Enregistrer

### 3. Modification
- [ ] Cliquer sur un créneau existant
- [ ] Modifier l'horaire
- [ ] Déplacer par drag & drop
- [ ] Sauvegarder

### 4. Suppression
- [ ] Survoler un créneau
- [ ] Cliquer sur l'icône poubelle
- [ ] Confirmer la suppression

### 5. Export
- [ ] Cliquer sur le bouton Download
- [ ] Choisir le format (PDF/DOCX/XLSX)
- [ ] Sélectionner la période (Jour/Soir/Complet)
- [ ] Télécharger

---

## 🎯 URLs Utiles

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Interface utilisateur |
| Planning API | http://localhost:3002 | API NestJS |
| Reports API | http://localhost:8000 | API Flask |
| Swagger Planning | http://localhost:3002/api | Documentation API |
| RabbitMQ Admin | http://localhost:15672 | Gestion des messages |
| PostgreSQL | localhost:5432 | Base de données |

---

## 💡 Astuces

### Voir les logs en temps réel
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f service-planning
```

### Redémarrer un service
```bash
docker-compose restart service-planning
```

### Nettoyer et reconstruire
```bash
docker-compose down -v
docker-compose up -d --build
```

### Mode debug pour Flask
```bash
cd report-service
export FLASK_ENV=development
export FLASK_DEBUG=1
flask run --port 8000 --debug
```

---

## 📞 Besoin d'aide ?

1. Consulter `VERIFICATION_EMPLOI_DU_TEMPS.md`
2. Exécuter `node test-edt.js` pour diagnostiquer
3. Vérifier les logs Docker
4. Tester chaque service individuellement avec curl
