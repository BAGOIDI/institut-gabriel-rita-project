import axios from 'axios';

// Création d'une instance Axios avec une configuration de base
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; // URL de base de votre API backend
const DISABLE_AUTH = (((import.meta as any).env?.VITE_DISABLE_AUTH) || 'false') === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes de délai d'attente
});

// Interceptor pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gérer les erreurs spécifiques liées à l'authentification
    if (error.response?.status === 401) {
      if (!DISABLE_AUTH) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour l'interaction avec l'API
export const ApiService = {
  // Fonction pour récupérer le profil de l'utilisateur
  getProfile: async () => {
    try {
      const response = await api.get('/protected/profile');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  // Fonction pour accéder à une ressource protégée pour les admins
  getAdminResource: async () => {
    try {
      const response = await api.get('/protected/admin-only');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'accès à la ressource admin:', error);
      throw error;
    }
  },

  // Fonction pour accéder à une ressource protégée pour les enseignants ou admins
  getTeachingResource: async () => {
    try {
      const response = await api.get('/protected/enseignant-or-admin');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'accès à la ressource enseignant:', error);
      throw error;
    }
  },

  // Fonction pour effectuer une requête personnalisée à l'API
  makeRequest: async (method: string, endpoint: string, data?: any) => {
    try {
      const response = await api({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la requête ${method} ${endpoint}:`, error);
      throw error;
    }
  }
};

export default api;
