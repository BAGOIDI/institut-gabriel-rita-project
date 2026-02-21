import React from 'react';
import ReportGenerator from '../components/ReportGenerator';
import { useAuth } from '../contexts/AuthContext';

const Reports: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Génération de Rapports</h1>
        <p className="text-gray-600 mt-2">
          Générez des rapports PDF, Excel, Word et autres formats à partir des données de l'application
        </p>
      </div>

      <div className="mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Connecté en tant que <span className="font-medium">{user?.username}</span>. Vous avez accès aux fonctionnalités de génération de rapports.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ReportGenerator />

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Formats disponibles</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <li className="flex items-center">
              <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-red-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span>PDF</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-green-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Excel (XLSX)</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-blue-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Word (DOCX)</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-purple-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span>CSV</span>
            </li>
            <li className="flex items-center">
              <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-yellow-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <span>HTML</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Guide d'utilisation</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Sélectionnez un modèle de rapport dans la liste déroulante</li>
            <li>Choisissez le format de sortie souhaité (PDF, Excel, Word, etc.)</li>
            <li>Fournissez des paramètres optionnels au format JSON</li>
            <li>Cliquez sur "Générer le rapport" ou "Générer avec données d'exemple"</li>
            <li>Le fichier sera automatiquement téléchargé dans votre navigateur</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Reports;