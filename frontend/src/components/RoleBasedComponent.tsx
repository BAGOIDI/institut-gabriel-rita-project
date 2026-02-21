import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedComponentProps {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({ 
  allowedRoles, 
  fallback = null, 
  children 
}) => {
  const { hasAnyRole, isAuthenticated, isLoading } = useAuth();

  // Pendant le chargement, on peut soit afficher un spinner, soit ne rien afficher
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher le fallback
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Vérifier si l'utilisateur a l'un des rôles autorisés
  const hasPermission = hasAnyRole(allowedRoles);

  if (hasPermission) {
    return <>{children}</>;
  }

  // Si l'utilisateur n'a pas les rôles requis, afficher le fallback
  return <>{fallback}</>;
};