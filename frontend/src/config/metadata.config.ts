/**
 * Fichier de configuration des métadonnées du frontend
 * Ce fichier définit les métadonnées de l'application pour une gestion centralisée
 */

import { AppConfig } from './app.config';

export interface AppMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage: string;
  repository: string;
  bugs: string;
  logo: string;
  favicon: string;
}

export const APP_METADATA: AppMetadata = {
  name: AppConfig.app.name,
  version: AppConfig.app.version,
  description: AppConfig.app.description,
  author: AppConfig.app.author,
  license: AppConfig.app.license,
  homepage: 'https://github.com/your-organization/institut-gabriel-rita',
  repository: 'https://github.com/your-organization/institut-gabriel-rita',
  bugs: 'https://github.com/your-organization/institut-gabriel-rita/issues',
  logo: '/src/assets/images/logo.png', // Chemin à vérifier
  favicon: '/vite.svg'
};

/**
 * Fonction utilitaire pour mettre à jour les métadonnées dans le DOM
 */
export const updateDocumentMetadata = (): void => {
  // Mettre à jour le titre
  document.title = APP_METADATA.name;

  // Mettre à jour la description
  const descriptionElement = document.querySelector('meta[name="description"]');
  if (descriptionElement) {
    descriptionElement.setAttribute('content', APP_METADATA.description);
  } else {
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = APP_METADATA.description;
    document.head.appendChild(metaDescription);
  }

  // Mettre à jour le favicon
  const faviconElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (faviconElement) {
    faviconElement.href = APP_METADATA.favicon;
  }
};

/**
 * Fonction pour obtenir les métadonnées de manière asynchrone
 * Utile si les métadonnées doivent être chargées depuis une API
 */
export const getAppMetadata = async (): Promise<AppMetadata> => {
  return Promise.resolve(APP_METADATA);
};