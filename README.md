# 🏫 Institut Gabriel Rita - Système de Gestion Scolaire

[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://docs.docker.com/compose/)
[![NestJS](https://img.shields.io/badge/NestJS-%5E10.0.0-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-%5E18.2.0-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-green)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Système de gestion scolaire moderne basé sur une architecture microservices avec interface utilisateur intuitive.

## 📋 Table des matières

- [Description](#description)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Services](#services)
- [API Endpoints](#api-endpoints)
- [🔍 Typesense & Recherche](#-typesense--recherche)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Tests](#tests)
- [Contribuer](#contribuer)
- [Licence](#licence)

## 📖 Description

Le **Système de Gestion Scolaire Institut Gabriel Rita** est une solution complète de gestion éducative conçue pour les établissements d'enseignement. Cette plateforme permet de gérer efficacement les étudiants, le personnel, les finances, les emplois du temps et les rapports académiques.

## 🏗️ Architecture

L'application suit une architecture microservices moderne :

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Traefik       │    │   PostgreSQL    │
│   (React)       │◄──►│   (Reverse      │◄──►│   (Base de      │
│   Port: 5173    │    │   Proxy)        │    │   données)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Finance       │    │   Core          │
│   Port: 3003    │    │   Port: 3004    │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                     │                     │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Planning      │    │   Reports       │    │   RabbitMQ      │
│   Port: 3002    │    │   Port: 8000    │    │   Ports: 5672   │
└─────────────────┘    └─────────────────┘    │        15672    │
                                               └─────────────────┘
```

## ✨ Fonctionnalités

### 🎓 Gestion Académique
- **Gestion des étudiants** : Inscriptions, dossiers, historique académique
- **Gestion du personnel** : Professeurs, administrateurs, personnels
- **Gestion des classes** : Création, affectation, organisation
- **Emplois du temps** : Planification interactive et gestion des disponibilités

### 💰 Gestion Financière
- **Paiements** : Suivi des frais de scolarité et paiements
- **Facturation** : Génération de factures automatiques
- **Rapports financiers** : Analyse et reporting des flux financiers

### 📊 Tableau de bord
- **Statistiques en temps réel** : Vue d'ensemble de l'établissement
- **Notifications** : Alertes et mises à jour instantanées
- **Analytics** : Tableaux de bord personnalisables

### 📝 Rapports
- **Rapports académiques** : Performances, fréquentation, résultats
- **Rapports financiers** : États des paiements, moratoires
- **Export PDF** : Génération de documents professionnels

## 🛠️ Prérequis

- **Docker** >= 20.10
- **Docker Compose** >= 1.29
- **Git** >= 2.30
- **Mémoire** : 4GB minimum
- **Espace disque** : 2GB minimum

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://gitlab.com/abel.kofisallc/institut-gabriel-rita-project.git
cd institut-gabriel-rita-project
```

### 2. Configuration de l'environnement

Copier le fichier d'environnement :

```bash
cp .env.example .env
```

### 3. Construction des services

```bash
docker-compose build
```

## ⚙️ Configuration

### Variables d'environnement principales

```env
# Base de données
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=scolarite_db

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin

# Configuration frontend
VITE_API_URL=http://localhost:80
```

### Configuration des services

Chaque microservice peut être configuré individuellement via ses variables d'environnement dans le `docker-compose.yml`.

## ▶️ Démarrage

### Démarrage complet

```bash
docker-compose up -d
```

### Démarrage sélectif

```bash
# Infrastructure seulement
docker-compose up -d postgres rabbitmq redis traefik

# Services backend
docker-compose up -d service-core-scolarite service-dashboard service-finance service-planning

# Interface utilisateur
docker-compose up -d school-frontend
```

### Vérification de l'état

```bash
docker-compose ps
```

## 📦 Services

| Service | Port | Description | Statut |
|---------|------|-------------|--------|
| **Frontend** | 5173 | Interface utilisateur React | ✅ |
| **API Core** | 3000 | Gestion des données principales | ✅ |
| **Dashboard** | 3003 | Tableau de bord et websockets | ✅ |
| **Finance** | 3004 | Gestion financière | ✅ |
| **Planning** | 3002 | Emplois du temps | ✅ |
| **Reports** | 8000 | Génération de rapports | ✅ |
| **PostgreSQL** | 5432 | Base de données | ✅ |
| **RabbitMQ** | 5672/15672 | Message broker | ✅ |
| **Redis** | 6379 | Cache et sessions | ✅ |
| **Traefik** | 80/8080 | Reverse proxy | ✅ |

### URLs d'accès

- **Application** : http://localhost:5173
- **Traefik Dashboard** : http://localhost:8080
- **RabbitMQ Management** : http://localhost:15672
- **API Documentation** : http://localhost/api/core/docs
- **Typesense** : http://localhost:8108

## 🔍 Typesense & Recherche

Le système intègre Typesense pour la recherche rapide et RabbitMQ pour la synchronisation en temps réel.

### Initialisation Rapide

```bash
# 1. Démarrer les services
docker-compose up -d

# 2. Initialiser Typesense avec les données
docker-compose exec backend bash /app/src/scripts/init-typesense.sh

# 3. Tester l'intégration
docker-compose exec backend bash /app/src/scripts/test-integration.sh
```

### Endpoints de Recherche

```bash
# Indexer tous les étudiants et enseignants
curl -X POST http://localhost:3000/api/search/index/all

# Vérifier la santé de Typesense
curl http://localhost:3000/api/search/health

# Rechercher dans Typesense
curl "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name,email"
```

### Documentation Complète

- [📖 Guide de configuration](TYPESENSE_SETUP_GUIDE.md)
- [⚡ Commandes rapides](TYPESENSE_COMMANDS.md)
- [🚀 Démarrage rapide](QUICKSTART_TYPESENSE.md)
- [📋 Synthèse d'implémentation](TYPESENSE_IMPLEMENTATION_SUMMARY.md)

### Architecture de Synchronisation

```
service-core-scolarite
    ↓ (événement via RabbitMQ)
    student.created / teacher.created
    ↓
backend (NestJS)
    ↓ (indexe dans Typesense)
Typesense (collection: students / teachers)
```

### Fonctionnalités Clés

- ✅ **Indexation automatique** via événements RabbitMQ
- ✅ **Indexation en masse** pour l'initialisation
- ✅ **Mise à jour en temps réel** des indexes
- ✅ **Recherche full-text** rapide et pertinente
- ✅ **Filtrage par facettes** (status, specialty, etc.)

## 🌐 API Endpoints

### Core API (`/api/core`)
- `GET /students` - Liste des étudiants
- `POST /students` - Création d'étudiant
- `GET /classes` - Liste des classes
- `GET /staff` - Liste du personnel

### Dashboard API (`/api/dashboard`)
- `GET /summary` - Résumé des statistiques
- `GET /events` - Événements en temps réel
- WebSocket `/` - Connexion temps réel

### Finance API (`/api/finance`)
- `GET /payments` - Liste des paiements
- `POST /payments` - Enregistrement de paiement
- `GET /invoices` - Liste des factures

### Planning API (`/api/planning`)
- `GET /schedules` - Emplois du temps
- `POST /schedules` - Création d'emploi du temps

## 🧪 Développement

### Développement local

```bash
# Démarrer l'infrastructure
docker-compose up -d postgres rabbitmq redis

# Démarrer un service en mode développement (exemple)
cd service-dashboard
npm install
npm run start:dev
```

### Structure du projet

```
institut-gabriel-rita-project/
├── frontend/              # Application React
├── service-core-scolarite/ # Service principal (NestJS)
├── service-dashboard/     # Tableau de bord (NestJS)
├── service-finance/       # Gestion financière (NestJS)
├── service-planning/      # Emplois du temps (NestJS)
├── service-reports/       # Génération de rapports (Python)
├── database/              # Scripts de base de données
├── docker-compose.yml     # Configuration Docker
└── .env                   # Variables d'environnement
```

### Commandes utiles

```bash
# Logs des services
docker-compose logs -f service-dashboard

# Redémarrage d'un service
docker-compose restart service-core-scolarite

# Arrêt complet
docker-compose down

# Nettoyage complet
docker-compose down -v --remove-orphans
```

## 🚀 Déploiement

### Environnements

Le projet supporte plusieurs environnements :

- **Développement** : `docker-compose.yml`
- **Production** : `docker-compose.prod.yml` (à créer)
- **Staging** : `docker-compose.staging.yml` (à créer)

### Déploiement production

```bash
# Construction pour production
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrage
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Tests

### Tests frontend

```bash
cd frontend
npm test
npm run test:coverage
```

### Tests backend

```bash
cd service-core-scolarite
npm run test
npm run test:e2e
npm run test:cov
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le repository
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Standards de codage

- **Frontend** : React avec TypeScript, ESLint, Prettier
- **Backend** : NestJS avec TypeScript, ESLint
- **Commits** : Conventional Commits
- **Branches** : GitFlow

### Processus de review

1. Code review par au moins un développeur
2. Tests automatisés passés
3. Documentation mise à jour
4. Merge dans `develop` puis `main`

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

## 👥 Auteurs et remerciements

### Équipe de développement
- **Chef de projet** : Abel KOFI
- **Développeurs backend** : Équipe NestJS
- **Développeurs frontend** : Équipe React
- **DevOps** : Équipe infrastructure

### Technologies utilisées

- **Frontend** : React, TypeScript, TailwindCSS
- **Backend** : NestJS, PostgreSQL, RabbitMQ
- **Infrastructure** : Docker, Traefik, Redis
- **Monitoring** : Traefik Dashboard

### Remerciements

Merci à toutes les personnes qui ont contribué à ce projet et à la communauté open source.

## 📞 Support

Pour tout support technique :

- **Email** : support@institut-gabriel-rita.edu
- **Issues** : [GitHub Issues](https://gitlab.com/abel.kofisallc/institut-gabriel-rita-project/-/issues)
- **Documentation** : [Wiki du projet](https://gitlab.com/abel.kofisallc/institut-gabriel-rita-project/-/wikis/home)

## 🚧 Roadmap

### Version 2.0 (à venir)
- [ ] Intégration avec les systèmes de gestion des notes
- [ ] Application mobile native
- [ ] Système de messagerie intégré
- [ ] Module de gestion des bibliothèques
- [ ] Intégration avec les systèmes de paiement en ligne

### Version 1.5 (en cours)
- [x] Amélioration de l'interface utilisateur
- [x] Optimisation des performances
- [x] Ajout de nouveaux rapports
- [ ] Tests automatisés étendus

---

*Développé avec ❤️ pour l'Institut Gabriel Rita*
