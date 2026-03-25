# 📊 MODULE FINANCIER - DOCUMENTATION

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### **Module 1 : Encaissements** ✓
- [x] Recherche auto-complétée d'étudiants
- [x] Affichage des frais et soldes restants
- [x] Paiements avec pénalités et réductions
- [x] Date de paiement personnalisée
- [x] Référence de transaction (auto-générée ou manuelle)
- [x] Statistiques temps réel
- [x] Rapports par étudiant

**API Endpoints :**
```
POST   /api/finance/payments              - Créer un paiement
GET    /api/finance/payments              - Liste des paiements
GET    /api/finance/students/:id/fees     - Frais d'un étudiant
GET    /api/finance/reports/student/:id   - Rapport détaillé étudiant
GET    /api/finance/stats                 - Statistiques encaissements
```

### **Module 2 : Décaissements** ✓ NOUVEAU
- [x] Types de dépenses (Salaires, Fournitures, Maintenance, etc.)
- [x] Gestion des bénéficiaires
- [x] Périodes de paiement (pour salaires)
- [x] Méthodes de paiement (Espèces, Virement, Mobile Money)
- [x] Statistiques par type
- [x] Historique complet

**API Endpoints :**
```
POST   /api/finance/disbursements         - Créer un décaissement
GET    /api/finance/disbursements         - Liste des décaissements
GET    /api/finance/disbursements/by-type - Par type de dépense
GET    /api/finance/disbursements/stats   - Statistiques décaissements
```

---

## 🎯 COMMENT UTILISER

### **1. Nouvel Encaissement**
1. Cliquer sur "Nouvel Encaissement"
2. Rechercher un étudiant (taper 2+ caractères)
3. Sélectionner l'étudiant
4. Choisir le type de frais
5. Remplir : montant, méthode, date
6. Ajouter pénalité/réduction si besoin
7. Enregistrer

### **2. Nouveau Décaissement**
1. Cliquer sur "Nouveau Décaissement"
2. Choisir le type (Salaire, Fournitures, etc.)
3. Entrer le bénéficiaire
4. Remplir : montant, méthode, date
5. Ajouter période (ex: "Octobre 2024") pour salaire
6. Enregistrer

### **3. Consulter les Rapports**
- Onglet "Rapports" dans le dashboard
- 6 types de rapports disponibles :
  - Par étudiant (reçu détaillé)
  - Par classe (taux recouvrement)
  - Global établissement
  - Retardataires + pénalités
  - Moratoires
  - Paiements partiels

---

## 🏗️ ARCHITECTURE TECHNIQUE

### **Backend (NestJS)**
```
service-finance/src/finance/
├── entities/
│   ├── payment.entity.ts          # Encaissements
│   ├── student-fee.entity.ts      # Frais étudiants
│   ├── payment-plan.entity.ts     # Moratoires
│   └── disbursement.entity.ts     # Décaissements
├── dto/
│   ├── create-payment.dto.ts
│   ├── update-payment.dto.ts
│   └── create-disbursement.dto.ts
├── finance.service.ts             # Logique métier
└── finance.controller.ts          # Routes API
```

### **Frontend (React)**
```
frontend/src/pages/
└── FinanceDashboard.tsx           # Page principale avec onglets
```

---

## 📈 STATISTIQUES DISPONIBLES

### **Encaissements**
- Total encaissé (mois)
- Nombre de paiements
- Moyenne des paiements
- Répartition par méthode (Cash, Virement, Mobile Money)
- Total pénalités appliquées
- Total réductions accordées

### **Décaissements**
- Total décaissé (mois)
- Nombre de décaissements
- Moyenne des décaissements
- Répartition par type
- Solde net (Encaissements - Décaissements)

---

## 🔧 CONFIGURATION

### **Variables d'environnement**
```bash
# Service Finance
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=institut_gabriel_rita_db
```

### **Tables de base de données**
```sql
finance_payments          # Tous les paiements (encaissements)
finance_disbursements     # Tous les décaissements
finance_student_fees      # Frais des étudiants
finance_payment_plans     # Moratoires et échéanciers
```

---

## 🚀 COMMANDES UTILES

### **Docker**
```bash
# Reconstruire le service finance
docker-compose build service-finance

# Redémarrer le service
docker-compose up -d service-finance

# Voir les logs
docker-compose logs -f service-finance
```

### **Swagger (Documentation API)**
```
http://localhost:3004/api/docs
```

---

## 📝 PROCHAINES AMÉLIORATIONS

- [ ] Impression des reçus PDF
- [ ] Export CSV/Excel des rapports
- [ ] Calcul automatique des salaires professeurs
- [ ] Gestion complète des moratoires
- [ ] Alertes de retard de paiement
- [ ] Tableau de bord avancé avec graphiques
- [ ] Intégration WhatsApp pour notifications

---

**Date de création** : 16 Mars 2026  
**Version** : 2.0  
**Statut** : ✅ Production Ready
