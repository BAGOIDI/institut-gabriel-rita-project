import { PageMetadata, MetadataUpdateOptions } from '../types/metadata.types';

/**
 * Service de gestion des métadonnées pour le frontend
 * Permet de gérer dynamiquement les métadonnées des pages
 */
class MetadataService {
  private defaultMetadata: PageMetadata = {
    title: 'Institut Gabriel Rita - Système de Gestion',
    description: 'Système de gestion scolaire pour l\'Institut Gabriel Rita',
    keywords: ['école', 'gestion', 'étudiants', 'enseignants', 'paiements', 'présences'],
    author: 'Équipe de développement',
    robots: 'index, follow',
    ogTitle: 'Institut Gabriel Rita - Système de Gestion',
    ogDescription: 'Système de gestion scolaire pour l\'Institut Gabriel Rita',
    ogType: 'website',
    twitterCard: 'summary_large_image'
  };

  /**
   * Met à jour les métadonnées de la page actuelle
   */
  public updateMetadata(metadata: Partial<PageMetadata>, options: MetadataUpdateOptions = {}): void {
    const {
      preserveExisting = false,
      updateTitle = true,
      updateDescription = true,
      updateOgTags = true,
      updateTwitterTags = true
    } = options;

    const finalMetadata = preserveExisting 
      ? { ...this.defaultMetadata, ...metadata }
      : { ...this.defaultMetadata, ...metadata };

    if (updateTitle && finalMetadata.title) {
      document.title = finalMetadata.title;
    }

    if (updateDescription && finalMetadata.description) {
      this.updateTag('meta', 'name', 'description', finalMetadata.description);
    }

    if (finalMetadata.keywords) {
      this.updateTag('meta', 'name', 'keywords', finalMetadata.keywords.join(', '));
    }

    if (finalMetadata.author) {
      this.updateTag('meta', 'name', 'author', finalMetadata.author);
    }

    if (finalMetadata.robots) {
      this.updateTag('meta', 'name', 'robots', finalMetadata.robots);
    }

    if (updateOgTags) {
      this.updateOgTags(finalMetadata);
    }

    if (updateTwitterTags) {
      this.updateTwitterTags(finalMetadata);
    }
  }

  /**
   * Met à jour les balises Open Graph
   */
  private updateOgTags(metadata: Partial<PageMetadata>): void {
    if (metadata.ogTitle) {
      this.updateTag('meta', 'property', 'og:title', metadata.ogTitle);
    }
    if (metadata.ogDescription) {
      this.updateTag('meta', 'property', 'og:description', metadata.ogDescription);
    }
    if (metadata.ogImage) {
      this.updateTag('meta', 'property', 'og:image', metadata.ogImage);
    }
    if (metadata.ogUrl) {
      this.updateTag('meta', 'property', 'og:url', metadata.ogUrl);
    }
    if (metadata.ogType) {
      this.updateTag('meta', 'property', 'og:type', metadata.ogType);
    }
  }

  /**
   * Met à jour les balises Twitter
   */
  private updateTwitterTags(metadata: Partial<PageMetadata>): void {
    if (metadata.twitterCard) {
      this.updateTag('meta', 'name', 'twitter:card', metadata.twitterCard);
    }
    if (metadata.twitterTitle) {
      this.updateTag('meta', 'name', 'twitter:title', metadata.twitterTitle);
    }
    if (metadata.twitterDescription) {
      this.updateTag('meta', 'name', 'twitter:description', metadata.twitterDescription);
    }
    if (metadata.twitterImage) {
      this.updateTag('meta', 'name', 'twitter:image', metadata.twitterImage);
    }
  }

  /**
   * Met à jour une balise spécifique
   */
  private updateTag(tagName: string, attributeName: string, attributeValue: string, content: string): void {
    let element = document.head.querySelector(`${tagName}[${attributeName}="${attributeValue}"]`);
    
    if (!element) {
      element = document.createElement(tagName);
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  }

  /**
   * Réinitialise les métadonnées à leur valeur par défaut
   */
  public resetToDefault(): void {
    this.updateMetadata(this.defaultMetadata);
  }

  /**
   * Obtient les métadonnées par défaut
   */
  public getDefaultMetadata(): PageMetadata {
    return { ...this.defaultMetadata };
  }
}

export const metadataService = new MetadataService();