import React from 'react';
import { RoleBasedComponent } from './RoleBasedComponent';

export const DashboardContent: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
      
      {/* Contenu accessible à tous les utilisateurs connectés */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800">Bienvenue à l'Institut Gabriel Rita</h2>
        <p className="text-gray-600 mt-2">Voici votre espace personnel pour accéder aux fonctionnalités qui vous sont attribuées.</p>
      </div>

      {/* Contenu spécifique pour les administrateurs */}
      <RoleBasedComponent allowedRoles={['admin']}>
        <div className="mb-8 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-red-800">Espace Administrateur</h2>
          <p className="text-gray-600 mt-2">Vous avez accès à toutes les fonctionnalités d'administration du système.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Statistiques globales</h3>
              <p className="text-sm text-gray-600">Vue d'ensemble du système</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Gestion des utilisateurs</h3>
              <p className="text-sm text-gray-600">Créer, modifier, supprimer des comptes</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Paramètres système</h3>
              <p className="text-sm text-gray-600">Configuration avancée</p>
            </div>
          </div>
        </div>
      </RoleBasedComponent>

      {/* Contenu spécifique pour les enseignants */}
      <RoleBasedComponent allowedRoles={['enseignant']}>
        <div className="mb-8 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-green-800">Espace Enseignant</h2>
          <p className="text-gray-600 mt-2">Accédez à vos outils pédagogiques et de gestion de cours.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Mes cours</h3>
              <p className="text-sm text-gray-600">Liste de vos cours assignés</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Saisie des notes</h3>
              <p className="text-sm text-gray-600">Saisissez les notes de vos élèves</p>
            </div>
          </div>
        </div>
      </RoleBasedComponent>

      {/* Contenu spécifique pour les étudiants */}
      <RoleBasedComponent allowedRoles={['etudiant']}>
        <div className="mb-8 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold text-purple-800">Espace Étudiant</h2>
          <p className="text-gray-600 mt-2">Consultez vos cours, notes et emploi du temps.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Mon emploi du temps</h3>
              <p className="text-sm text-gray-600">Vos cours programmés</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Mes notes</h3>
              <p className="text-sm text-gray-600">Suivi de vos performances</p>
            </div>
          </div>
        </div>
      </RoleBasedComponent>

      {/* Contenu spécifique pour le personnel */}
      <RoleBasedComponent allowedRoles={['personnel']}>
        <div className="mb-8 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold text-yellow-800">Espace Personnel</h2>
          <p className="text-gray-600 mt-2">Accédez aux outils de gestion administrative.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Gestion des inscriptions</h3>
              <p className="text-sm text-gray-600">Traiter les demandes d'inscription</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium text-gray-800">Documents administratifs</h3>
              <p className="text-sm text-gray-600">Accès aux formulaires et documents</p>
            </div>
          </div>
        </div>
      </RoleBasedComponent>

      {/* Message pour les utilisateurs sans rôle spécifique */}
      <RoleBasedComponent 
        allowedRoles={['admin', 'enseignant', 'etudiant', 'personnel']} 
        fallback={
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-500">
            <h2 className="text-lg font-semibold text-gray-800">Bienvenue</h2>
            <p className="text-gray-600 mt-2">Votre compte n'a pas encore de rôle attribué. Veuillez contacter un administrateur pour obtenir les accès appropriés.</p>
          </div>
        }
      >
        {/* Ce contenu ne s'affiche que si l'utilisateur a l'un des rôles spécifiés */}
        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-green-800">Rôles attribués</h2>
          <p className="text-gray-600 mt-2">Votre compte est activement utilisé avec les rôles qui vous ont été attribués.</p>
        </div>
      </RoleBasedComponent>
    </div>
  );
};