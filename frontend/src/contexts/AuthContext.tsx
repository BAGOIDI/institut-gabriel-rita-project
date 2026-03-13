import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { ApiService } from '../services/api.service';
import keycloak from '../services/keycloak';

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
  const [idleTimer, setIdleTimer] = useState<number | null>(null);
  const IDLE_TIMEOUT = 30 * 60 * 1000;
  const DISABLE_AUTH = (((import.meta as any).env?.VITE_DISABLE_AUTH) || 'true') === 'true';
  const DEFAULT_USERNAME = (import.meta as any).env?.VITE_DEFAULT_USERNAME || '';
  const DEFAULT_PASSWORD = (import.meta as any).env?.VITE_DEFAULT_PASSWORD || '';
  const DEFAULT_ROLES = ((import.meta as any).env?.VITE_DEFAULT_ROLES || 'admin').split(',').map((r: string) => r.trim()).filter(Boolean);

  useEffect(() => {
    if (DISABLE_AUTH) {
      const localUser: User = {
        id: 'local-disabled',
        username: DEFAULT_USERNAME || 'admin',
        email: `${DEFAULT_USERNAME || 'admin'}@local`,
        firstName: DEFAULT_USERNAME || 'Admin',
        lastName: 'User',
        roles: DEFAULT_ROLES.length ? DEFAULT_ROLES : ['admin']
      };
      setUser(localUser);
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const localUser = localStorage.getItem('user');
      if (localUser) {
        try {
          setUser(JSON.parse(localUser));
        } catch {
          loadUserProfile();
        }
      } else {
        loadUserProfile();
      }
      setIsLoading(false);
    } else {
      keycloak.init({ onLoad: 'check-sso' }).then(auth => {
        if (auth && keycloak.token) {
          localStorage.setItem('token', keycloak.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
          const parsed: any = keycloak.tokenParsed || {};
          const kcUser: User = {
            id: parsed.sub || '',
            username: parsed.preferred_username || '',
            email: parsed.email || '',
            firstName: parsed.given_name || '',
            lastName: parsed.family_name || '',
            roles: (parsed.realm_access?.roles || [])
          };
          localStorage.setItem('user', JSON.stringify(kcUser));
          setUser(kcUser);
        }
      }).finally(() => setIsLoading(false));
    }
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      const t = window.setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT);
      setIdleTimer(t);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    if (localStorage.getItem('token')) {
      resetTimer();
      events.forEach((e) => window.addEventListener(e, resetTimer));
    }
    return () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [idleTimer]);

  const loadUserProfile = async () => {
    try {
      const profileData = await ApiService.getProfile();
      setUser(profileData.user);
    } catch (error) {
      console.error('Erreur lors du chargement du profil utilisateur:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const login = async (username: string, password: string) => {
    try {
      if (DISABLE_AUTH) {
        const localUser: User = {
          id: 'local-disabled',
          username: DEFAULT_USERNAME || username || 'admin',
          email: `${DEFAULT_USERNAME || username || 'admin'}@local`,
          firstName: DEFAULT_USERNAME || username || 'Admin',
          lastName: 'User',
          roles: DEFAULT_ROLES.length ? DEFAULT_ROLES : ['admin']
        };
        setUser(localUser);
        return;
      }
      if (DEFAULT_USERNAME && DEFAULT_PASSWORD) {
        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
          const localUser: User = {
            id: 'local-default',
            username: DEFAULT_USERNAME,
            email: `${DEFAULT_USERNAME}@local`,
            firstName: DEFAULT_USERNAME,
            lastName: 'User',
            roles: DEFAULT_ROLES
          };
          const fakeToken = 'local-default-token';
          localStorage.setItem('token', fakeToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;
          localStorage.setItem('user', JSON.stringify(localUser));
          setUser(localUser);
          return;
        } else {
          throw new Error('Identifiants invalides');
        }
      }
      await keycloak.login(keycloak.getLoginOptions({ redirectUri: window.location.origin }));
      return;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        await keycloak.login(keycloak.getLoginOptions({ redirectUri: window.location.origin }));
        return;
      }
      throw error;
    }
  };

  const logout = () => {
    if (DISABLE_AUTH) {
      // Auth disabled: keep a local user to avoid "logged out" state in UI
      return;
    }
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      ApiService.makeRequest('POST', '/auth/keycloak/logout', {
        refresh_token: refreshToken
      }).catch(err => console.error('Erreur lors de la déconnexion:', err));
      localStorage.removeItem('refreshToken');
    }
    localStorage.removeItem('token');
    setUser(null);
    
    delete axios.defaults.headers.common['Authorization'];
    if (idleTimer) {
      window.clearTimeout(idleTimer);
      setIdleTimer(null);
    }
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
    isAuthenticated: DISABLE_AUTH || !!localStorage.getItem('token'),
    isLoading,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
