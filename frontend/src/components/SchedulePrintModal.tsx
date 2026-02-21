import React, { useState } from 'react';
import reportService from '../services/report.service';

interface SchedulePrintModalProps {
  scheduleData: any;
  isOpen: boolean;
  onClose: () => void;
}

const SchedulePrintModal: React.FC<SchedulePrintModalProps> = ({ 
  scheduleData, 
  isOpen, 
  onClose 
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'xlsx' | 'docx' | 'csv' | 'html'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await reportService.generateScheduleReport(scheduleData, selectedFormat);
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError(err.message || 'Une erreur est survenue lors de la génération du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Imprimer l'emploi du temps</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez le format d'impression
          </label>
          <select
            id="format"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as any)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="docx">Word (DOCX)</option>
            <option value="csv">CSV</option>
            <option value="html">HTML</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Génération...
              </>
            ) : (
              'Imprimer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePrintModal;