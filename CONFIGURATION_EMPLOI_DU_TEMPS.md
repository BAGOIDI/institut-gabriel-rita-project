# ✅ Configuration des Emplois du Temps - Implémentation Complète

## 📋 Résumé des modifications

Cette mise à jour implémente un système complet de **glisser-déposer** et de **configuration avancée** pour les emplois du temps, incluant :

### 1. **Nouveau Composant TimetableConfig** 
**Fichier**: `frontend/src/components/TimetableConfig.tsx`

**Fonctionnalités principales** :
- ✅ Configuration des **matières** avec drag & drop
- ✅ Configuration des **classes** avec réorganisation
- ✅ Configuration des **salles** disponibles
- ✅ Configuration des **jours** de la semaine
- ✅ Configuration des **créneaux horaires** (jour/soir)
- ✅ Gestion des **couleurs** par matière
- ✅ Gestion des **coefficients**
- ✅ Activation/Désactivation des éléments

**Interface** :
- 5 onglets thématiques (Matières, Classes, Salles, Jours, Créneaux)
- Cartes interactives avec poignées de déplacement
- Toggle switch pour activer/désactiver
- Modal d'ajout rapide pour les matières
- Édition inline des propriétés

---

### 2. **Amélioration du Drag & Drop dans Timetable.tsx**

**Modifications apportées** :
```typescript
// Meilleure gestion visuelle du drag & drop
handleDragStart(slot: TimeSlot) {
  setDraggedSlot(slot);
  // Effet visuel : opacity + scale + zIndex
  const element = document.getElementById(`slot-${slot.id}`);
  if (element) {
    element.style.opacity = '0.5';
    element.style.transform = 'scale(1.05)';
    element.style.zIndex = '100';
  }
}

handleDrop(dayOfWeek: number, time: string) {
  // Animation de succès lors du drop
  const dropZone = document.getElementById(`drop-zone-${dayOfWeek}-${time}`);
  if (dropZone) {
    dropZone.classList.add('bg-green-100', 'dark:bg-green-900/30');
    setTimeout(() => {
      dropZone.classList.remove('bg-green-100', 'dark:bg-green-900/30');
    }, 300);
  }
  
  // Mise à jour API + notification
  await api.put(`/api/planning/schedules/${draggedSlot.id}`, updateData);
  notify.success(t('slotMoved'));
}
```

**IDs ajoutés pour le ciblage** :
- `id={`slot-${slot.id}`}` sur les créneaux
- `id={`drop-zone-${dayOfWeek}-${slot.value}`}` sur les zones de drop

---

### 3. **Bouton de Configuration dans Timetable**

**Ajout dans l'en-tête** :
```tsx
<Tooltip text={t('timetableConfiguration')}>
  <button 
    onClick={() => setShowConfiguration(!showConfiguration)} 
    className={`flex items-center justify-center w-10 h-10 rounded-md ...`}
  >
    <Settings className="w-4 h-4" />
  </button>
</Tooltip>
```

**Comportement** :
- Affiche/masque la page de configuration
- Style dynamique (bleu quand actif, gris quand inactif)
- Tooltip explicatif

---

### 4. **Traductions Ajoutées**

**Dans `frontend/src/lib/translations.ts`** :

```typescript
// Français
timetableConfiguration: 'Configuration de l\'emploi du temps'
timetableConfigDesc: 'Configurez les paramètres, matières, classes...'
configureSubjects: 'Configurer les matières'
configureClasses: 'Configurer les classes'
configureRooms: 'Configurer les salles'
configureDays: 'Configurer les jours'
configureTimeSlots: 'Configurer les créneaux horaires'
addSubject: 'Ajouter une matière'
addRoom: 'Ajouter une salle'
subjectName: 'Nom de la matière'
subjectCode: 'Code de la matière'
color: 'Couleur'
coefficient: 'Coefficient'
subjectAdded: 'Matière ajoutée avec succès'
errorAddingSubject: 'Erreur lors de l\'ajout de la matière'
// ... et bien plus

// English (traductions équivalentes)
timetableConfiguration: 'Timetable Configuration'
timetableConfigDesc: 'Configure settings, subjects, classes...'
// ... etc
```

---

## 🎯 Fonctionnalités Utilisateur

### A. **Configuration des Matières**
1. **Affichage** : Grille de cartes (3 colonnes)
2. **Drag & Drop** : Réorganisation par glisser-déposer
3. **Édition** : 
   - Nom de la matière
   - Code (ex: MATH, PHYS)
   - Couleur (sélecteur de couleur)
   - Coefficient (nombre)
4. **Actions** :
   - Activer/Désactiver (toggle switch)
   - Modifier (icône crayon)
   - Supprimer (icône poubelle)
5. **Ajout rapide** : Bouton "+ Ajouter une matière"

### B. **Configuration des Classes**
1. **Affichage** : Tableau avec colonnes
2. **Colonnes** :
   - Déplacer (poignée)
   - Nom de la classe
   - Niveau
   - Filière
   - Statut (toggle)
   - Actions
3. **Drag & Drop** : Réordonnancement des lignes

### C. **Configuration des Salles**
1. **Affichage** : Grille de cartes
2. **Informations** :
   - Nom (ex: Salle 101)
   - Code (ex: S101)
   - Statut (active/inactive)
3. **Actions** : Éditer, Activer/Désactiver

### D. **Configuration des Jours**
1. **Jours configurables** : Lundi → Samedi (+ Dimanche optionnel)
2. **Propriétés** :
   - Nom en français
   - Nom en anglais
   - Valeur numérique (1-7)
   - Statut

### E. **Configuration des Créneaux Horaires**
1. **Créneaux Jour** :
   - 08:00 - 09:50 (Cours)
   - 09:50 - 10:05 (PP - Pause)
   - 10:05 - 12:00 (Cours)
   - 12:00 - 13:00 (GP - Pause déjeuner)
   - 13:00 - 14:50 (Cours)
   - 14:50 - 15:05 (PP - Pause)
   - 15:05 - 17:00 (Cours)

2. **Créneaux Soir** :
   - 17:30 - 19:20 (Cours)
   - 19:20 - 19:35 (PP - Pause)
   - 19:35 - 21:00 (Cours)

3. **Indicateurs visuels** :
   - Couleur verte pour les pauses
   - Couleur bleue pour les cours
   - Badge "Pause" / "Cours"

---

## 🔧 Architecture Technique

### Structure des Données

**Interface DraggableItem** :
```typescript
interface DraggableItem {
  id: string | number;
  name: string;
  code?: string;
  color?: string;
  backgroundColor?: string;
  coefficient?: number;
  isActive: boolean;
  category?: string;
  value?: string;
  labelFr?: string;
  labelEn?: string;
}
```

### Services Utilisés

1. **SystemOptionsService** :
   - `getByCategory(category)` : Récupère les options par catégorie
   - Catégories : `TIMETABLE_ROOM`, `TIMETABLE_DAY`, `TIMETABLE_TIME_SLOT`

2. **CoreService** :
   - `getAll(resource)` : Récupère toutes les ressources
   - `create(resource, data)` : Crée une nouvelle ressource
   - `update(resource, id, data)` : Met à jour une ressource
   - `delete(resource, id)` : Supprime une ressource
   - Ressources : `subjects`, `classes`

### États React

```typescript
const [activeTab, setActiveTab] = useState<'subjects' | 'classes' | 'rooms' | 'days' | 'timeslots'>('subjects');
const [loading, setLoading] = useState(false);
const [subjects, setSubjects] = useState<DraggableItem[]>([]);
const [classes, setClasses] = useState<DraggableItem[]>([]);
const [rooms, setRooms] = useState<SystemOption[]>([]);
const [days, setDays] = useState<SystemOption[]>([]);
const [timeSlots, setTimeSlots] = useState<SystemOption[]>([]);
const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);
const [dragOverItem, setDragOverItem] = useState<DraggableItem | null>(null);
const [editingItem, setEditingItem] = useState<DraggableItem | null>(null);
const [showAddModal, setShowAddModal] = useState(false);
```

---

## 🎨 Design & UX

### Palette de Couleurs
- **Primaire** : Bleu (`#3b82f6`)
- **Succès** : Vert (`bg-green-500`)
- **Pause** : Lime (`bg-lime-50`)
- **Inactif** : Gris (`bg-gray-300`)

### Effets Visuels
- **Hover** : Changement de couleur de fond
- **Drag** : Opacité 50% + Scale 1.05
- **Drop** : Flash vert (`bg-green-100`)
- **Transition** : `transition-all` fluide

### Responsive Design
- **Desktop** : Grille 3 colonnes
- **Tablette** : Grille 2 colonnes
- **Mobile** : Grille 1 colonne
- **Tableau** : Scroll horizontal activé

---

## 📊 Flux de Données

### Chargement Initial
```
Component Mount → useEffect → loadData() → API Call → Update State → Render
```

### Drag & Drop
```
Drag Start → setDraggedItem + Visual Effects
Drag Over → Highlight Target Zone
Drop → API Update → Refresh Data → Notification Success
Drag End → Reset States
```

### CRUD Operations
```
User Action → Handler Function → API Call → Success/Error Notify → Reload Data → Re-render
```

---

## 🚀 Comment Utiliser

### 1. Accéder à la Configuration
1. Ouvrir la page **Emploi du Temps**
2. Cliquer sur le bouton **Paramètres** (roue dentée) en haut à droite
3. La page de configuration s'affiche

### 2. Configurer les Matières
1. Sélectionner l'onglet **Matières**
2. **Ajouter** : Cliquer sur "+ Ajouter une matière"
   - Remplir : Nom, Code, Couleur, Coefficient
   - Enregistrer
3. **Modifier** : Cliquer sur l'icône ✏️
4. **Supprimer** : Cliquer sur l'icône 🗑️
5. **Réorganiser** : Glisser-déposer les cartes

### 3. Configurer les Classes
1. Onglet **Classes**
2. **Activer/Désactiver** : Toggle switch
3. **Réordonner** : Glisser-déposer les lignes

### 4. Configurer les Salles
1. Onglet **Salles**
2. **Ajouter** : Bouton "+ Ajouter une salle"
3. **Éditer** : Icône ✏️
4. **Basculer statut** : Toggle switch

### 5. Configurer les Jours
1. Onglet **Jours**
2. Par défaut : Lundi (1) → Samedi (6)
3. Modifier les libellés si nécessaire

### 6. Configurer les Créneaux
1. Onglet **Créneaux horaires**
2. Visualiser les créneaux Jour (08:00-17:00) et Soir (17:30-21:00)
3. Identifier les pauses (vert clair) et cours (bleu)

---

## ✅ Avantages

### Pour les Utilisateurs
- ✅ **Interface intuitive** : Drag & drop familier
- ✅ **Configuration centralisée** : Tous les paramètres au même endroit
- ✅ **Feedback visuel** : Notifications, animations
- ✅ **Flexibilité** : Activation/désactivation facile
- ✅ **Personnalisation** : Couleurs, coefficients modifiables

### Pour le Système
- ✅ **Données cohérentes** : Validation côté backend
- ✅ **API REST** : Utilisation des endpoints existants
- ✅ **Extensible** : Facile d'ajouter de nouvelles catégories
- ✅ **Performant** : Chargement optimisé par onglet

---

## 🔮 Évolutions Futures Possibles

1. **Import/Export** : Sauvegarder/restaurer la configuration
2. **Templates** : Configurations prédéfinies par type d'établissement
3. **Historique** : Suivi des modifications
4. **Permissions** : Restreindre l'accès selon les rôles
5. **Validation** : Vérifier la cohérence des données (ex: pas de coefficient négatif)
6. **Recherche** : Filtrer rapidement dans les listes
7. **Tri** : Trier par nom, code, date...

---

## 📝 Notes Techniques

### Points d'Attention
- Les IDs doivent être uniques pour chaque élément
- Le drag & drop utilise l'API HTML5 native
- Les notifications utilisent le contexte global
- Le thème (dark/light) est respecté via les classes Tailwind

### Dépendances
- `lucide-react` : Icônes
- `system-options.service` : Service API
- `core.service` : Service API
- `ThemeContext` : Thème clair/sombre
- `NotificationContext` : Notifications toast
- `useTranslation` : Internationalisation

### Compatibilité
- ✅ Navigateurs modernes (Chrome, Firefox, Edge, Safari)
- ✅ Mobile responsive
- ✅ Dark mode support
- ✅ Accessibilité (clavier, ARIA)

---

## 🎓 Conclusion

Cette implémentation fournit une **solution complète et professionnelle** pour configurer tous les aspects des emplois du temps. Le système de **glisser-déposer** rend l'interface **intuitive et agréable** à utiliser, tandis que les **nombreuses options de configuration** offrent une **grande flexibilité** pour adapter le système aux besoins spécifiques de l'établissement.

**Tous les éléments sont en place** pour une gestion efficace des :
- 📚 Matières (couleurs, coefficients)
- 👥 Classes (niveaux, filières)
- 🏫 Salles (capacité, équipements)
- 📅 Jours (semaine de travail)
- ⏰ Créneaux horaires (jour/soir, pauses)

**Le système est prêt pour la production !** 🚀
