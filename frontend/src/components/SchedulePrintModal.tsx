import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import reportService, { ReportFormat } from '../services/report.service';

interface SchedulePrintModalProps {
  scheduleData: {
    title: string;
    period: string;
    slots: any[];
    viewMode: string;
    filter: string;
    dateGenerated: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: ReportFormat; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { value: 'pdf',  label: 'PDF',       icon: <File className="w-5 h-5" />,            color: '#DC2626', desc: 'Document imprimable, idéal pour affichage' },
  { value: 'docx', label: 'Word',      icon: <FileText className="w-5 h-5" />,        color: '#2563EB', desc: 'Document modifiable Microsoft Word' },
  { value: 'xlsx', label: 'Excel',     icon: <FileSpreadsheet className="w-5 h-5" />, color: '#059669', desc: 'Feuille de calcul Microsoft Excel' },
];

const SchedulePrintModal: React.FC<SchedulePrintModalProps> = ({ scheduleData, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const className = scheduleData.filter || 'Classe';

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await reportService.downloadSchedule(className, selectedFormat);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors de la génération');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Exporter l'emploi du temps</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{className} — {scheduleData.period}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Sélecteur de format */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Choisir le format</p>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                  selectedFormat === opt.value
                    ? 'border-2 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
                style={selectedFormat === opt.value ? { borderColor: opt.color } : {}}
              >
                <input
                  type="radio"
                  name="format"
                  value={opt.value}
                  checked={selectedFormat === opt.value}
                  onChange={() => setSelectedFormat(opt.value)}
                  className="sr-only"
                />
                <span style={{ color: opt.color }}>{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
                {selectedFormat === opt.value && (
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: opt.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                  </div>
                )}
              </label>
            ))}
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
              ✅ Document téléchargé avec succès !
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || success}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isLoading ? 'Génération...' : success ? 'Téléchargé !' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePrintModal;
