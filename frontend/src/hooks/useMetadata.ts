import { useEffect } from 'react';
import { PageMetadata } from '../types/metadata.types';
import { metadataService } from '../services/metadata.service';

/**
 * Hook personnalisé pour gérer les métadonnées d'une page
 * @param metadata Les métadonnées à appliquer à la page
 * @param deps Les dépendances qui déclenchent la mise à jour des métadonnées
 */
export const useMetadata = (metadata: Partial<PageMetadata>, deps: React.DependencyList = []): void => {
  useEffect(() => {
    metadataService.updateMetadata(metadata);
    
    // Nettoyage: réinitialiser les métadonnées à la sortie du composant
    return () => {
      metadataService.resetToDefault();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * Hook pour réinitialiser les métadonnées à leur état par défaut
 */
export const useResetMetadata = (): (() => void) => {
  return () => {
    metadataService.resetToDefault();
  };
};

/**
 * Hook pour obtenir les métadonnées par défaut
 */
export const useDefaultMetadata = (): PageMetadata => {
  return metadataService.getDefaultMetadata();
};