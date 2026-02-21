import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleBasedComponent } from './RoleBasedComponent';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="bg-white shadow-md w-64 min-h-screen flex flex-col">
      {/* Header du sidebar */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Menu</h2>
        {user && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Bonjour, {user.firstName} {user.lastName}</p>
            <p className="text-xs mt-1">Rôles: {user.roles.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Navigation basée sur les rôles */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {/* Tous les utilisateurs peuvent accéder à l'accueil */}
          <li>
            <Link 
              to="/" 
              className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
            >
              Accueil
            </Link>
          </li>

          {/* Section pour les administrateurs uniquement */}
          <RoleBasedComponent allowedRoles={['admin']}>
            <li className="mt-4">
              <h3 className="px-4 text-xs uppercase font-semibold text-gray-500">Administration</h3>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Gestion des utilisateurs
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/settings" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Paramètres système
              </Link>
            </li>
          </RoleBasedComponent>

          {/* Section pour les enseignants */}
          <RoleBasedComponent allowedRoles={['enseignant', 'admin']}>
            <li className="mt-4">
              <h3 className="px-4 text-xs uppercase font-semibold text-gray-500">Enseignement</h3>
            </li>
            <li>
              <Link 
                to="/enseignant/cours" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Mes cours
              </Link>
            </li>
            <li>
              <Link 
                to="/enseignant/notes" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Saisie des notes
              </Link>
            </li>
          </RoleBasedComponent>

          {/* Section pour les étudiants */}
          <RoleBasedComponent allowedRoles={['etudiant', 'admin']}>
            <li className="mt-4">
              <h3 className="px-4 text-xs uppercase font-semibold text-gray-500">Études</h3>
            </li>
            <li>
              <Link 
                to="/etudiant/cours" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Mes cours
              </Link>
            </li>
            <li>
              <Link 
                to="/etudiant/notes" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Mes notes
              </Link>
            </li>
          </RoleBasedComponent>

          {/* Section pour le personnel */}
          <RoleBasedComponent allowedRoles={['personnel', 'admin']}>
            <li className="mt-4">
              <h3 className="px-4 text-xs uppercase font-semibold text-gray-500">Personnel</h3>
            </li>
            <li>
              <Link 
                to="/personnel/gestion" 
                className="block py-2 px-4 rounded hover:bg-gray-100 transition-colors"
              >
                Gestion administrative
              </Link>
            </li>
          </RoleBasedComponent>
        </ul>
      </nav>

      {/* Bouton de déconnexion */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
};