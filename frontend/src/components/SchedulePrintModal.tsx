import React, { useEffect, useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import reportService, { ReportFormat } from '../services/report.service';
import SearchableSelect from './SearchableSelect';

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
  
  const [exportType, setExportType] = useState<'class' | 'teacher' | 'synthesis_class'>('class');
  const [options, setOptions] = useState<{ id: string; name: string; level?: string; specialty_id?: string }[]>([]);
  const [selectedItemNames, setSelectedItemNames] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    
    // On réinitialise la sélection à chaque changement de type
    setSelectedItemNames([]);
    
    const loadOptions = async () => {
      try {
        let list: { id: string; name: string; level?: string; specialty_id?: string }[] = [];
        if (exportType === 'class' || exportType === 'synthesis_class') {
          list = await reportService.getClasses();
        } else if (exportType === 'teacher') {
          list = (await reportService.getTeachers()).map(t => ({ ...t }));
        }
        
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
        
        if (defaultNames.length > 0) {
          setSelectedItemNames(defaultNames);
        }
      } catch (e) {
        if (mounted) setOptions([]);
      }
    };

    loadOptions();
    return () => { mounted = false; };
  }, [isOpen, exportType, scheduleData.viewMode, scheduleData.filter]);

  if (!isOpen) return null;

  // Group classes by level for synthesis_class
  const groupedOptions = exportType === 'synthesis_class' ? options.reduce((acc, curr) => {
    const level = curr.level || 'Autres';
    if (!acc[level]) acc[level] = [];
    acc[level].push(curr);
    return acc;
  }, {} as Record<string, typeof options>) : null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (selectedItemNames.length === 0) {
        setError("Veuillez sélectionner au moins un élément pour l'export.");
        return;
      }

      if (exportType === 'synthesis_class') {
        // On récupère les IDs des classes sélectionnées pour la synthèse
        const classIds = selectedItemNames.map(name => {
          const option = options.find(opt => opt.name === name);
          return option ? String(option.id) : null;
        }).filter(id => id !== null) as string[];

        // Pour la synthèse de plusieurs classes, on envoie les IDs concaténés si le service le permet
        // ou on utilise le paramètre class_id si c'est une seule classe.
        await reportService.downloadSynthesisSchedule(
          classIds.length === 1 ? classIds[0] : undefined,
          undefined,
          selectedFormat,
          classIds.length > 1 ? classIds : undefined
        );
      } else {
        // Pour Classe et Enseignant, c'est une sélection unique via SearchableSelect
        const name = selectedItemNames[0];
        if (exportType === 'class') {
          await reportService.downloadSchedule(name, selectedFormat);
        } else if (exportType === 'teacher') {
          await reportService.downloadTeacherSchedule(name, selectedFormat);
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
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
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
                onClick={() => setExportType('synthesis_class')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'synthesis_class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                Synthèse Classe
              </button>
            </div>
          </div>

          {/* Sélecteur de l'élément spécifique */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {exportType === 'class' ? 'Classe' : exportType === 'teacher' ? 'Enseignant' : 'Classe(s) pour synthèse'} à exporter
            </p>
            {exportType === 'synthesis_class' ? (
              <div className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold px-3 py-2.5 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none max-h-64 overflow-y-auto">
                {options.length === 0 && <p className="text-center py-4 text-gray-400">Chargement...</p>}
                {groupedOptions && Object.entries(groupedOptions).map(([level, levelOptions]) => (
                  <div key={level} className="mb-4 last:mb-0">
                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 border-b border-gray-200 dark:border-slate-600 pb-1">
                      Niveau : {level}
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {levelOptions.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-600 p-1 rounded transition-colors">
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <label htmlFor={opt.id} className="cursor-pointer text-[11px] flex-1 truncate">{opt.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SearchableSelect
                value={selectedItemNames[0] || ''}
                onChange={(val) => {
                  const opt = options.find(o => String(o.id) === val);
                  if (opt) setSelectedItemNames([opt.name]);
                }}
                placeholder={exportType === 'class' ? "Sélectionner une classe" : "Sélectionner un enseignant"}
                options={options.map(o => ({ value: String(o.id), label: o.name }))}
              />
            )}
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
