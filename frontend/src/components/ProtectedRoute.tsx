import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Pour le moment, permettre l'accès sans authentification
  // La sécurité sera gérée ultérieurement
  return <>{children}</>;
};
