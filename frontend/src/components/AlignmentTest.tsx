import React from 'react';

// Composant de test pour vérifier l'alignement
export const AlignmentTest = () => {
  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Test d'Alignement</h1>
      
      {/* Test des cartes */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Cartes Statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="banco-stat-card rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="p-2 rounded-md bg-primary-light dark:bg-primary-dark/30 mb-2">
                  <div className="w-5 h-5 bg-primary rounded"></div>
                </div>
                <div className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">
                  Titre Test
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
                  125
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-inter">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>+12%</span>
              </div>
            </div>
          </div>
          
          <div className="banco-stat-card rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="p-2 rounded-md bg-blue-100 mb-2">
                  <div className="w-5 h-5 bg-blue-500 rounded"></div>
                </div>
                <div className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">
                  Deuxième Test
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
                  89
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 font-inter">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>-5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test du sidebar */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Éléments de Navigation</h2>
        <div className="flex gap-4">
          <div className="w-64 banco-sidebar bg-white dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary text-white">
              <div className="p-2 rounded-md bg-white/20">
                <div className="w-5 h-5 bg-white rounded"></div>
              </div>
              <span className="font-medium text-sm">Élément Actif</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg mt-1 text-gray-700 dark:text-gray-300 hover:bg-primary-light dark:hover:bg-primary-dark/20">
              <div className="p-2 rounded-md bg-gray-100 dark:bg-slate-700">
                <div className="w-5 h-5 bg-gray-600 dark:bg-gray-400 rounded"></div>
              </div>
              <span className="font-medium text-sm">Élément Inactif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test du topbar */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Barre Supérieure</h2>
        <div className="banco-topbar bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <div className="w-5 h-5 bg-gray-600 dark:bg-gray-400 rounded"></div>
            </div>
            <div className="hidden sm:flex items-center bg-gray-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 w-52">
              <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded mr-3"></div>
              <div className="bg-transparent text-sm w-full text-gray-700 dark:text-gray-200">Recherche...</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <div className="w-4 h-4 bg-gray-600 dark:bg-gray-400 rounded"></div>
            </div>
            <div className="p-2.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <div className="w-4 h-4 bg-gray-600 dark:bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};