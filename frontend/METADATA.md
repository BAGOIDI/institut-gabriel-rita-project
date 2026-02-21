# Gestion des Métadonnées du Frontend

Ce document explique comment le système de gestion des métadonnées a été implémenté dans le frontend de l'application Institut Gabriel Rita.

## Structure des fichiers

- `src/config/app.config.ts` - Fichier de configuration principal de l'application
- `src/config/metadata.config.ts` - Configuration spécifique des métadonnées de base
- `src/types/metadata.types.ts` - Définition des types TypeScript pour les métadonnées
- `src/services/metadata.service.ts` - Service principal de gestion des métadonnées
- `src/hooks/useMetadata.ts` - Hook React personnalisé pour gérer les métadonnées dans les composants

## Utilisation

### Dans les composants React

```tsx
import { useMetadata } from '../hooks/useMetadata';

const MyPage = () => {
  useMetadata({
    title: 'Ma page personnalisée - Institut Gabriel Rita',
    description: 'Description spécifique pour cette page',
    keywords: ['clé1', 'clé2', 'clé3']
  }, []);

  return (
    <div>
      {/* Contenu de la page */}
    </div>
  );
};
```

### Mise à jour manuelle des métadonnées

```tsx
import { metadataService } from '../services/metadata.service';

// Mise à jour des métadonnées
metadataService.updateMetadata({
  title: 'Nouveau titre',
  description: 'Nouvelle description'
});

// Réinitialisation aux valeurs par défaut
metadataService.resetToDefault();
```

## Fonctionnalités

- Mise à jour dynamique des balises `<title>` et `<meta>`
- Prise en charge des balises Open Graph (OG) pour le partage sur les réseaux sociaux
- Prise en charge des balises Twitter Cards
- Gestion des métadonnées par défaut pour l'application
- Configuration spécifique par page
- Réinitialisation automatique des métadonnées lors de la sortie d'un composant

## Configuration par défaut

Les métadonnées par défaut sont définies dans `src/config/app.config.ts` et peuvent être personnalisées pour chaque page ou composant selon les besoins.

## Problèmes résolus

Ce système résout les problèmes potentiels de "provenance des fichiers de métadonnées" en fournissant une gestion centralisée et cohérente des métadonnées dans toute l'application frontend.