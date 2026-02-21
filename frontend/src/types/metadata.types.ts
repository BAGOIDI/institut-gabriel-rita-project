/**
 * Types TypeScript pour les métadonnées de l'application
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface MetadataConfig {
  default: PageMetadata;
  pages: {
    [key: string]: Partial<PageMetadata>;
  };
}

export interface MetadataUpdateOptions {
  preserveExisting?: boolean;
  updateTitle?: boolean;
  updateDescription?: boolean;
  updateOgTags?: boolean;
  updateTwitterTags?: boolean;
}