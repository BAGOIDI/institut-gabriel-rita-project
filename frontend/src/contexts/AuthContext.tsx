import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { ApiService } from '../services/api.service';

interface User {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Chargement initial de l'état d'authentification
    const token = localStorage.getItem('token');
    if (token) {
      // Configurer axios avec le token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Charger les informations utilisateur
      loadUserProfile();
    }
    setIsLoading(false);
  }, []);

  const loadUserProfile = async () => {
    try {
      const profileData = await ApiService.getProfile();
      setUser(profileData.user);
    } catch (error) {
      console.error('Erreur lors du chargement du profil utilisateur:', error);
      // Si le token n'est plus valide, déconnecter l'utilisateur
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Appeler l'API pour obtenir un token via Keycloak
      const response = await ApiService.makeRequest('POST', '/auth/keycloak/token', {
        username,
        password
      });
      
      const { access_token, refresh_token, ...userData } = response;
      
      // Stocker le token dans le localStorage
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      
      // Configurer axios avec le token
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Charger les informations utilisateur
      loadUserProfile();
      
      return response;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  const logout = () => {
    // Appeler l'API de déconnexion
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      ApiService.makeRequest('POST', '/auth/keycloak/logout', {
        refresh_token: refreshToken
      }).catch(err => console.error('Erreur lors de la déconnexion:', err));
      
      localStorage.removeItem('refreshToken');
    }
    
    // Supprimer le token d'accès
    localStorage.removeItem('token');
    setUser(null);
    
    // Retirer le token d'axios
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasAnyRole = (rolesToCheck: string[]): boolean => {
    return user ? rolesToCheck.some(role => user.roles.includes(role)) : false;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
