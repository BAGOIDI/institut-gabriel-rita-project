import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Auth is disabled for now: always allow access.
  // (We keep this component to avoid breaking imports in other branches/files.)
  return <>{children}</>;
};
