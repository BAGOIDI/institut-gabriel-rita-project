# 📱 Guide Complet - Envoi d'Emploi du Temps par WhatsApp

## 🎯 Fonctionnalité

Envoi automatique d'emplois du temps aux enseignants et groupes via WhatsApp en utilisant **WAHA** (WhatsApp HTTP API).

---

## ✨ Fonctionnalités UI/UX

### 1. **Interface Utilisateur Moderne**
- ✅ Modal élégant avec design responsive
- ✅ Indicateur de statut WAHA en temps réel
- ✅ QR code scanner intégré
- ✅ Formatage automatique des numéros
- ✅ Aperçu du message avant envoi
- ✅ Feedback visuel (succès/erreur)

### 2. **Messages Formatés Professionnellement**
```
📚 EMPLOI DU TEMPS - INSTITUT GABRIEL RITA 📚

👨‍🏫 Enseignant: M. Jean Dupont
📖 Classe: Terminale C
📅 Période: Complète

━━━━━━━━━━━━━━━━━━━━━━━

🗓️ LUNDI
   ⏰ 08:00 - 09:50
   📝 Mathématiques (📍 Salle 101)
   
   ⏰ 10:05 - 12:00
   📝 Physique (📍 Labo 1)

...

💡 Conseils:
• Arrivez 5 minutes avant le début du cours
• Vérifiez votre salle avant le cours

📞 Administration: +237 600 00 00 00
```

### 3. **Options d'Envoi**
- **Période**: Complet / Jour / Soir
- **Destinataire**: Numéro individuel ou groupe
- **Format**: Message texte + PDF joint (optionnel)

---

## 🚀 Configuration Initiale

### Étape 1: Démarrer WAHA

```bash
docker-compose up -d school-waha
```

### Étape 2: Scanner le QR Code

1. Ouvrez l'interface web (http://localhost:5173)
2. Allez dans la page **Emploi du Temps**
3. Sélectionnez une classe ou un enseignant
4. Cliquez sur **"Envoyer par WhatsApp"**
5. Cliquez sur l'icône **QR Code** 
6. Scannez avec votre téléphone:
   - WhatsApp → Paramètres → Appareils connectés → Connecter

### Étape 3: Vérifier la Connexion

Le statut passe de 🔴 **Déconnecté** à ✅ **Connecté**

---

## 📖 Utilisation Quotidienne

### Envoyer à un Enseignant

1. **Sélectionner la vue "Par Enseignant"**
2. **Choisir l'enseignant** dans la liste
3. **Cliquez sur "Envoyer par WhatsApp"**
4. **Entrez le numéro** de l'enseignant (ex: `600000000`)
5. **Choisissez la période** (Complet/Jour/Soir)
6. **Cliquez sur "Envoyer"**

✅ Le message est envoyé automatiquement !

### Envoyer à un Groupe de Classe

1. **Sélectionner la vue "Par Classe"**
2. **Choisir la classe** (ex: `Terminale C`)
3. **Cliquez sur "Envoyer par WhatsApp"**
4. **Entrez le numéro** du délégué ou du groupe
5. **Personnalisez** si nécessaire
6. **Envoyez !**

---

## 🎨 Composants UI Créés

### 1. `WhatsAppSender.tsx`
Composant principal avec:
- Modal responsive
- Statut WAHA en temps réel
- Formulaire intuitif
- Gestion des erreurs

**Props:**
```typescript
interface WhatsAppSenderProps {
  targetType: 'class' | 'teacher';
  targetId: string;
  targetName: string;
  teacherName?: string;
}
```

### 2. Intégration Timetable.tsx
Bouton contextuel qui apparaît quand:
- Une classe est sélectionnée
- Un enseignant est sélectionné
- Le filtre est actif

---

## 🔧 API Backend

### Routes Créées

#### 1. **Envoyer EDT d'une classe**
```http
POST /api/reports/whatsapp/send-schedule/:class_ref
Content-Type: application/json

{
  "phone": "237600000000",
  "period": "all",
  "teacher_name": "M. Dupont"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "messageId": "ABC123XYZ"
}
```

#### 2. **Vérifier le statut**
```http
GET /api/reports/whatsapp/status
```

**Réponse:**
```json
{
  "connected": true,
  "service": "WAHA",
  "status": "OK"
}
```

#### 3. **Récupérer le QR Code**
```http
GET /api/reports/whatsapp/qr
```

**Réponse:**
```json
{
  "qrCode": "data:image/png;base64,..."
}
```

---

## 💡 Bonnes Pratiques

### Format des Numéros
- ✅ Utiliser le format international: `2376XXXXXXXX`
- ✅ Pas de `+` ni d'espaces
- ✅ Pour les groupes: ID du groupe (ex: `120363XXX@g.us`)

### Timing d'Envoi
- 🕐 Éviter les heures tardives
- 🕐 Privilégier 8h-20h
- 🕐 Tenir compte des fuseaux horaires

### Contenu des Messages
- ✨ Messages courts et clairs
- ✨ Emojis avec modération
- ✨ Informations essentielles en premier
- ✨ Signature de l'établissement

---

## 🎯 Cas d'Usage

### 1. **Envoi Individuel**
Un enseignant demande son EDT → Message personnalisé

### 2. **Envoi de Groupe**
Délégué de classe → EDT complet de la classe

### 3. **Mise à Jour**
Changement d'emploi du temps → Notification immédiate

### 4. **Rappel Quotidien**
Optionnel: Programme automatique de rappels

---

## 🔍 Dépannage

### WAHA ne se connecte pas
```bash
# Vérifier le container
docker-compose ps school-waha

# Voir les logs
docker-compose logs -f school-waha

# Redémarrer
docker-compose restart school-waha
```

### QR Code ne s'affiche pas
1. Rafraîchir la page
2. Vider le cache navigateur
3. Re-scanner le QR code

### Message ne s'envoie pas
- ✅ Vérifier le numéro (format international)
- ✅ Vérifier la connexion WhatsApp
- ✅ Vérifier que le destinataire existe dans vos contacts

---

## 📊 Statistiques et Suivi

### Logs d'Envoi
Consultez les logs Flask:
```bash
docker-compose logs -f service-reports
```

### Exemple de Log
```
INFO: Envoi EDT WhatsApp pour Terminale C à 237600000000
INFO: Message envoyé à 237600000000
```

---

## 🎨 Personnalisation UI

### Couleurs du Thème
```css
/* Bouton WhatsApp */
bg-green-600 hover:bg-green-700

/* Statut connecté */
bg-green-50 border-green-200

/* Statut déconnecté */
bg-red-50 border-red-200
```

### Modifier les Couleurs
Éditez `WhatsAppSender.tsx`:
- Ligne ~240: Bouton principal
- Ligne ~155: Statut WAHA
- Ligne ~280: Sélecteur de période

---

## 📱 Exemples de Messages

### Message Type - Classe
```
📚 *EMPLOI DU TEMPS - INSTITUT GABRIEL RITA* 📚

👨‍🏫 *Enseignant:* M. Jean Dupont
📖 *Classe:* Terminale C
📅 *Période:* Complète

━━━━━━━━━━━━━━━━━━━━━━━

🗓️ *LUNDI*
   ⏰ 08:00 - 09:50
   📝 Mathématiques (📍 Salle 101)
   
   ⏰ 10:05 - 12:00
   📝 Physique (📍 Labo 1)

...

💡 *Conseils:*
• Arrivez 5 minutes avant
• Vérifiez votre salle

📞 *Administration:* +237 600 00 00 00
🌐 *Site:* www.institut-gabriel-rita.cm

📎 *Le PDF détaillé est joint à ce message.*

_Généré le 01/04/2026 à 10:30_
```

### Message Type - Enseignant
```
📚 *VOTRE EMPLOI DU TEMPS* 📚

👨‍🏫 *Enseignant:* M. Jean Dupont
📅 *Période:* Jour
📊 *Nombre de classes:* 3

━━━━━━━━━━━━━━━━━━━━━━━

📖 *Classe: Terminale C*
   Nombre de cours: 5

📖 *Classe: Première D*
   Nombre de cours: 3

...

💡 Les emplois du temps détaillés sont joints en PDF.

📞 *Administration:* +237 600 00 00 00

_Généré le 01/04/2026 à 10:30_
```

---

## 🎯 Objectifs Atteints

- ✅ **UI/UX Puissante**: Interface moderne et intuitive
- ✅ **Temps Réel**: Statut WAHA visible en direct
- ✅ **Multi-Destinataires**: Individus et groupes
- ✅ **Personnalisation**: Messages adaptés
- ✅ **Professionnel**: Formatage soigné
- ✅ **Fiable**: Gestion des erreurs robuste
- ✅ **Documentation**: Guides complets

---

## 📞 Support

Pour toute question:
1. Consulter ce guide
2. Vérifier les logs Docker
3. Tester avec un numéro de test
4. Contacter l'administrateur

---

**Profitez de cette fonctionnalité puissante pour améliorer la communication de votre établissement !** 🚀📱
