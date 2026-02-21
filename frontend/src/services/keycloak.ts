import Keycloak from 'keycloak-js';

// Configuration pour Keycloak
const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'institut-gabriel-rita',
  clientId: 'frontend-client'
};

// Initialisation de Keycloak
const keycloak = new Keycloak({
  url: keycloakConfig.url,
  realm: keycloakConfig.realm,
  clientId: keycloakConfig.clientId
});

// Fonction utilitaire pour obtenir les paramètres d'authentification
keycloak.getLoginOptions = (customParams = {}) => {
  const options: any = {
    redirectUri: customParams.redirectUri || window.location.origin,
    ...customParams
  };
  
  // Si on a un nom d'utilisateur temporaire dans le sessionStorage
  const tempUsername = sessionStorage.getItem('temp_username');
  if (tempUsername) {
    // Supprimer l'identifiant temporaire après utilisation
    sessionStorage.removeItem('temp_username');
    // Note : Keycloak ne permet pas de pré-remplir directement les champs pour des raisons de sécurité
    // Mais on peut passer des paramètres supplémentaires si nécessaire
  }
  
  return options;
};

export default keycloak;