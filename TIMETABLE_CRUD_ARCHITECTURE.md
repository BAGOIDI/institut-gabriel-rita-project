# CRUD Timetable Configuration - Architecture et Flux

## 📋 Vue d'ensemble

Le système de gestion des emplois du temps (Timetable) utilise une architecture microservices avec **3 services distincts** :

### Services impliqués

1. **service-planning** (NestJS) - Port 3002
   - Gère le **CRUD complet** des schedules (emplois du temps)
   - Endpoints : `/api/planning/schedules`
   
2. **service-reports** (Flask/Python) - Port 8000
   - Génère les **exports PDF/DOCX/XLSX** et WhatsApp
   - Endpoints : `/api/reports/schedule/*`
   
3. **service-core-scolarite** (NestJS) - Port 3000
   - Fournit les données de référence (classes, enseignants, matières)
   - Endpoints : `/api/core/classes`, `/api/core/teachers`, etc.

---

## 🔄 Flux CRUD Timetable

### 1. **CREATE** - Créer un créneau horaire

```
Frontend (Timetable.tsx)
  ↓ POST /api/planning/schedules
Traefik (reverse proxy)
  ↓ strip-prefix → /schedules
service-planning:3000/schedules
  ↓ ScheduleController.create()
ScheduleService.create(payload)
  ↓ Database PostgreSQL
  ✓ Retourne le schedule créé
```

**Payload exemple :**
```typescript
{
  dayOfWeek: 1,              // Lundi (1-6, Dimanche exclu)
  startTime: "07:30",
  endTime: "09:30",
  subjectId: 45,
  staffId: 12,
  classId: 8,
  roomName: "Salle A1"
}
```

---

### 2. **READ** - Récupérer les emplois du temps

```
Frontend (Timetable.tsx)
  ↓ GET /api/planning/schedules?classId=8&staffId=12
Traefik
  ↓ strip-prefix → /schedules?classId=8&staffId=12
service-planning:3000/schedules
  ↓ ScheduleController.findAll()
ScheduleService.findAll({ classId, staffId })
  ↓ Database PostgreSQL (JOIN avec classes, teachers, subjects)
  ✓ Retourne la liste des schedules filtrés
```

**Réponse :**
```json
[
  {
    "id": 123,
    "dayOfWeek": 1,
    "startTime": "07:30",
    "endTime": "09:30",
    "subjectName": "Mathématiques",
    "teacherName": "Jean Dupont",
    "className": "Terminale C",
    "roomName": "Salle A1"
  }
]
```

---

### 3. **UPDATE** - Modifier un créneau

```
Frontend (Timetable.tsx)
  ↓ PUT /api/planning/schedules/123
Traefik
  ↓ strip-prefix → /schedules/123
service-planning:3000/schedules/123
  ↓ ScheduleController.update(123, payload)
ScheduleService.update(123, payload)
  ↓ Database PostgreSQL UPDATE
  ✓ Retourne le schedule mis à jour
```

**Cas d'usage :**
- Modification manuelle via le modal
- Drag & Drop (handleDrop)

---

### 4. **DELETE** - Supprimer un créneau

```
Frontend (Timetable.tsx)
  ↓ DELETE /api/planning/schedules/123
Traefik
  ↓ strip-prefix → /schedules/123
service-planning:3000/schedules/123
  ↓ ScheduleController.remove(123)
ScheduleService.remove(123)
  ↓ Database PostgreSQL DELETE
  ✓ Confirmation de suppression
```

---

## 📤 Export Timetable

### Flux d'export PDF/DOCX/XLSX

```
Frontend (ScheduleExportModal.tsx)
  ↓ Utilise report.service.ts
  ↓ GET /api/reports/schedule/{className}?format=pdf&period=all
Traefik
  ↓ strip-prefix → /schedule/{className}?format=pdf&period=all
service-reports:5000/schedule/{className}
  ↓ Flask route
  ↓ Appelle service-planning pour récupérer les données
  ↓ Génère le PDF avec templates Jinja2/WeasyPrint
  ↓ Retourne le Blob PDF
Frontend
  ↓ Téléchargement automatique
```

### Formats supportés

- **PDF** : Document finalisé, idéal pour affichage/impression
- **DOCX** : Document Word modifiable
- **XLSX** : Feuille Excel pour analyses
- **WhatsApp** : Envoi via WAHA (texte formaté)

---

## 🗂️ Fichiers clés

### Frontend

| Fichier | Rôle |
|---------|------|
| `frontend/src/pages/Timetable.tsx` | Page principale, affichage et CRUD |
| `frontend/src/components/ScheduleExportModal.tsx` | Modal d'export |
| `frontend/src/services/report.service.ts` | Service API pour exports |
| `frontend/src/lib/translations.ts` | Traductions FR/EN |

### Backend

| Service | Controller | Service | Repository |
|---------|------------|---------|------------|
| **service-planning** | `schedule.controller.ts` | `schedule.service.ts` | `schedule.repository.ts` |
| **service-reports** | `routes/reports.py` | `services/pdf_service.py` | - |
| **service-core** | `classes.controller.ts`, `staff.controller.ts` | - | - |

---

## 🔧 Configuration Traefik

### Routes Docker labels

```yaml
# service-planning
- "traefik.http.routers.planning.rule=Host(`localhost`) && PathPrefix(`/api/planning`)"
- "traefik.http.middlewares.planning-strip.stripprefix.prefixes=/api/planning"
- "traefik.http.routers.planning.middlewares=planning-strip"
- "traefik.http.services.planning.loadbalancer.server.port=3000"

# service-reports
- "traefik.http.routers.reports.rule=Host(`localhost`) && PathPrefix(`/api/reports`)"
- "traefik.http.middlewares.reports-strip.stripprefix.prefixes=/api/reports"
- "traefik.http.routers.reports.middlewares=reports-strip"
- "traefik.http.services.reports.loadbalancer.server.port=5000"
```

---

## ✅ Points de vigilance

### 1. **Données de référence**
Les IDs (`classId`, `staffId`, `subjectId`) doivent exister dans `service-core-scolarite`.

### 2. **Contraintes métier**
- Pas de cours le Dimanche (`dayOfWeek > 6`)
- Respect des créneaux horaires prédéfinis
- Gestion des conflits (un prof ne peut pas être dans 2 classes en même temps)

### 3. **Fallback report.service**
Si `service-reports` n'est pas disponible, le frontend utilise `service-core` pour récupérer les listes (classes, enseignants).

---

## 🚀 Commandes de test

### Vérifier le CRUD

```bash
# Lister tous les schedules
curl http://localhost/api/planning/schedules

# Récupérer les schedules d'une classe
curl http://localhost/api/planning/schedules/class/8

# Créer un schedule
curl -X POST http://localhost/api/planning/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": 1,
    "startTime": "07:30",
    "endTime": "09:30",
    "subjectId": 45,
    "staffId": 12,
    "classId": 8,
    "roomName": "Salle A1"
  }'

# Mettre à jour
curl -X PUT http://localhost/api/planning/schedules/123 \
  -H "Content-Type: application/json" \
  -d '{"startTime": "08:00"}'

# Supprimer
curl -X DELETE http://localhost/api/planning/schedules/123
```

### Tester l'export PDF

```bash
# Export PDF d'une classe
curl -o edt.pdf "http://localhost/api/reports/schedule/Terminale%20C?format=pdf&period=all"

# Export WhatsApp
curl -X POST http://localhost/api/reports/whatsapp/send-schedule/8 \
  -H "Content-Type: application/json" \
  -d '{"phone": "2250707070707", "period": "all"}'
```

---

## 📊 Schéma d'architecture

```
┌─────────────┐
│  Frontend   │
│   (React)   │
└──────┬──────┘
       │
       ├──────────────────┬─────────────────────┬──────────────────┐
       │                  │                     │                  │
       ▼                  ▼                     ▼                  ▼
┌─────────────┐   ┌─────────────┐      ┌─────────────┐   ┌─────────────┐
│   Traefik   │   │   Traefik   │      │   Traefik   │   │   Traefik   │
│  (Reverse   │   │  (Reverse   │      │  (Reverse   │   │  (Reverse   │
│   Proxy)    │   │   Proxy)    │      │   Proxy)    │   │   Proxy)    │
└──────┬──────┘   └──────┬──────┘      └──────┬──────┘   └──────┬──────┘
       │                 │                     │                 │
       │ /api/planning   │ /api/reports        │ /api/core       │ /api/finance
       ▼                 ▼                     ▼                 ▼
┌─────────────┐   ┌─────────────┐      ┌─────────────┐   ┌─────────────┐
│  service-   │   │  service-   │      │  service-   │   │  service-   │
│  planning   │   │  reports    │      │   core      │   │  finance    │
│  (NestJS)   │   │  (Flask)    │      │  (NestJS)   │   │  (NestJS)   │
│             │   │             │      │             │   │             │
│ CRUD Schedules│ │ PDF/Excel   │      │ Classes     │   │ Paiements   │
│ Drag&Drop   │   │ WhatsApp    │      │ Teachers    │   │ Factures    │
└──────┬──────┘   └──────┬──────┘      └──────┬──────┘   └──────┬──────┘
       │                 │                     │                 │
       └─────────────────┴──────────┬──────────┴─────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   PostgreSQL DB   │
                          │  (institut_db)    │
                          └───────────────────┘
```

---

## 🎯 Résumé

✅ **CRUD Timetable** = `service-planning` (NestJS)  
✅ **Exports PDF/Excel** = `service-reports` (Flask)  
✅ **Données de référence** = `service-core-scolarite` (NestJS)  
✅ **Routing** = Traefik avec strip-prefix  
✅ **Base de données** = PostgreSQL unique pour tous les services  

Cette architecture microservices assure une **séparation des responsabilités** claire et une **évolutivité** optimale.
