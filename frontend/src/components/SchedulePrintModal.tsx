import React, { useEffect, useState } from 'react';
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
  
  const [exportType, setExportType] = useState<'class' | 'teacher' | 'subject' | 'specialty'>('class');
  const [options, setOptions] = useState<{ id: string; name: string; specialty_id: string }[]>([]);
  const [selectedItemNames, setSelectedItemNames] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    
    const loadOptions = async () => {
      try {
        let list: { id: string; name: string; specialty_id: string }[] = [];
        if (exportType === 'class') list = await reportService.getClasses();
        else if (exportType === 'teacher') list = (await reportService.getTeachers()).map(t => ({ ...t, specialty_id: '' }));
        else if (exportType === 'subject') list = (await reportService.getSubjects()).map(s => ({ ...s, specialty_id: '' }));
        else if (exportType === 'specialty') list = (await reportService.getSpecialties()).map(s => ({ ...s, specialty_id: s.id }));
        
        if (!mounted) return;
        setOptions(list || []);
        
        let defaultNames: string[] = [];
        if (exportType === 'class' && scheduleData.viewMode === 'class') {
          const name = list.find(c => String(c.id) === String(scheduleData.filter))?.name;
          if (name) defaultNames = [name];
        } else if (exportType === 'teacher' && scheduleData.viewMode === 'teacher') {
          const name = list.find(t => String(t.id) === String(scheduleData.filter))?.name;
          if (name) defaultNames = [name];
        }
        
        setSelectedItemNames(defaultNames);
      } catch (e) {
        if (mounted) setOptions([]);
      }
    };

    loadOptions();
    return () => { mounted = false; };
  }, [isOpen, exportType, scheduleData.viewMode, scheduleData.filter]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (selectedItemNames.length === 0) {
        setError("Veuillez sélectionner au moins un élément pour l'export.");
        return;
      }

      if ((exportType === 'class' && selectedItemNames.length > 1) || exportType === 'specialty') {
        const specialtyIds = selectedItemNames.map(name => {
          const option = options.find(opt => opt.name === name);
          return option ? option.specialty_id : null;
        }).filter(id => id !== null) as string[];
        await reportService.downloadSynthesisSchedule(undefined, undefined, selectedFormat, specialtyIds);
      } else {
        for (const name of selectedItemNames) {
          if (exportType === 'class') {
            await reportService.downloadSchedule(name, selectedFormat);
          } else if (exportType === 'teacher') {
            await reportService.downloadTeacherSchedule(name, selectedFormat);
          } else {
            await reportService.downloadSubjectSchedule(name, selectedFormat);
          }
        }
      }

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
            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">Exporter l'emploi du temps</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase font-semibold tracking-wider">
              {scheduleData.period}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Sélecteur de type d'export */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Type d'exportation</p>
            <div className="grid grid-cols-4 gap-2 p-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <button
                onClick={() => setExportType('class')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                Classe
              </button>
              <button
                onClick={() => setExportType('teacher')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'teacher' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                Enseignant
              </button>
              <button
                onClick={() => setExportType('subject')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'subject' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                Matière
              </button>
              <button
                onClick={() => setExportType('specialty')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'specialty' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                Filière
              </button>
            </div>
          </div>

          {/* Sélecteur de l'élément spécifique */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {exportType === 'class' ? 'Classe(s)' : exportType === 'teacher' ? 'Enseignant' : exportType === 'subject' ? 'Matière' : 'Filière(s)'} à exporter
            </p>
            <div className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none max-h-48 overflow-y-auto">
              {options.length === 0 && <p>Chargement...</p>}
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={opt.id}
                    value={opt.name}
                    checked={selectedItemNames.includes(opt.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemNames([...selectedItemNames, opt.name]);
                      } else {
                        setSelectedItemNames(selectedItemNames.filter(name => name !== opt.name));
                      }
                    }}
                  />
                  <label htmlFor={opt.id}>{opt.name}</label>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Choisir le format</p>
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
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 rounded-md text-xs text-emerald-700 dark:text-emerald-200">
              Document téléchargé avec succès.
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
