/**
 * Fichier de configuration principale de l'application
 * Centralise toutes les configurations importantes
 */

import { MetadataConfig } from '../types/metadata.types';

export const AppConfig = {
  // Informations de base de l'application
  app: {
    name: 'Institut Gabriel Rita - Système de Gestion',
    version: '1.0.0',
    description: 'Système de gestion scolaire pour l\'Institut Gabriel Rita',
    author: 'Équipe de développement',
    license: 'MIT',
  },

  // Configuration des APIs
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    authServiceUrl: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3002',
    timeout: 30000, // 30 secondes
  },

  // Configuration des métadonnées par défaut
  metadata: {
    default: {
      title: 'Institut Gabriel Rita - Système de Gestion',
      description: 'Système de gestion scolaire pour l\'Institut Gabriel Rita',
      keywords: ['école', 'gestion', 'étudiants', 'enseignants', 'paiements', 'présences'],
      author: 'Équipe de développement',
      robots: 'index, follow',
      ogTitle: 'Institut Gabriel Rita - Système de Gestion',
      ogDescription: 'Système de gestion scolaire pour l\'Institut Gabriel Rita',
      ogType: 'website',
      twitterCard: 'summary_large_image'
    },
    pages: {
      '/': {
        title: 'Tableau de bord - Institut Gabriel Rita',
        description: 'Accédez à votre tableau de bord de gestion scolaire'
      },
      '/students': {
        title: 'Gestion des étudiants - Institut Gabriel Rita',
        description: 'Gérez les dossiers et inscriptions des élèves'
      },
      '/teachers': {
        title: 'Gestion des enseignants - Institut Gabriel Rita',
        description: 'Gérez les dossiers et emplois du temps des enseignants'
      },
      '/timetable': {
        title: 'Emploi du temps - Institut Gabriel Rita',
        description: 'Consultez et gérez les emplois du temps'
      },
      '/attendance': {
        title: 'Présences - Institut Gabriel Rita',
        description: 'Suivez les présences des étudiants et enseignants'
      },
      '/payments': {
        title: 'Paiements - Institut Gabriel Rita',
        description: 'Gérez les paiements scolaires'
      },
      '/reports': {
        title: 'Rapports - Institut Gabriel Rita',
        description: 'Générez des rapports détaillés'
      },
      '/settings': {
        title: 'Paramètres - Institut Gabriel Rita',
        description: 'Configurez votre compte et vos préférences'
      }
    }
  } as MetadataConfig,

  // Configuration des fonctionnalités
  features: {
    enableAnalytics: false,
    enableNotifications: true,
    enableDarkMode: true,
    enableMultiLanguage: true,
  },

  // Configuration des services externes
  services: {
    keycloak: {
      realm: 'institut-gabriel-rita',
      clientId: 'frontend-app',
      url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    }
  }
};