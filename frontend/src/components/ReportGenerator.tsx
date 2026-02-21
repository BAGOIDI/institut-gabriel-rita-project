import React, { useState, useEffect } from 'react';
import { ReportsService } from '../services/reports.service';

interface ReportGeneratorProps {
  reportName?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ reportName: initialReportName }) => {
  const [availableReports, setAvailableReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>(initialReportName || '');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'docx' | 'csv' | 'html'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<string>('{}');

  useEffect(() => {
    loadAvailableReports();
  }, []);

  const loadAvailableReports = async () => {
    try {
      const reports = await ReportsService.getAvailableReports();
      setAvailableReports(reports);
      if (reports.length > 0 && !initialReportName) {
        setSelectedReport(reports[0]);
      } else if (initialReportName) {
        setSelectedReport(initialReportName);
      }
    } catch (err) {
      setError('Impossible de charger la liste des rapports disponibles');
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      setError('Veuillez sélectionner un rapport');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let parsedParams = {};
      if (params.trim() !== '{}') {
        parsedParams = JSON.parse(params);
      }

      const blob = await ReportsService.generateReport(selectedReport, format, parsedParams);
      ReportsService.downloadReport(blob, `${selectedReport}.${format}`);
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWithSampleData = async () => {
    if (!selectedReport) {
      setError('Veuillez sélectionner un rapport');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let parsedParams = {};
      if (params.trim() !== '{}') {
        parsedParams = JSON.parse(params);
      }

      // Données d'exemple pour tester
      const sampleData = [
        { id: 1, name: 'Jean Dupont', value: 100 },
        { id: 2, name: 'Marie Curie', value: 200 },
        { id: 3, name: 'Pierre Simon', value: 150 }
      ];

      const blob = await ReportsService.generateReportWithData(selectedReport, format, sampleData, parsedParams);
      ReportsService.downloadReport(blob, `${selectedReport}_data.${format}`);
    } catch (err) {
      setError('Erreur lors de la génération du rapport avec données');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Générateur de Rapports</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rapport
          </label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={availableReports.length === 0}
          >
            {availableReports.length === 0 ? (
              <option>Aucun rapport disponible</option>
            ) : (
              availableReports.map(report => (
                <option key={report} value={report}>
                  {report}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="docx">Word (DOCX)</option>
            <option value="csv">CSV</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paramètres (JSON)
        </label>
        <textarea
          value={params}
          onChange={(e) => setParams(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder='Ex: {"title": "Mon Rapport", "date": "2024-01-01"}'
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGenerateReport}
          disabled={isLoading || !selectedReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Génération...' : 'Générer le rapport'}
        </button>
        
        <button
          onClick={handleGenerateWithSampleData}
          disabled={isLoading || !selectedReport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Génération...' : 'Générer avec données d\'exemple'}
        </button>
        
        <button
          onClick={loadAvailableReports}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Actualiser
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;