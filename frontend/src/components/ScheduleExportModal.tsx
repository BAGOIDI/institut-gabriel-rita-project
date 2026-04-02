import React, { useEffect, useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File, Loader2, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api.service';
import reportService, { ReportFormat, ReportPeriod } from '../services/report.service';
import SearchableSelect from './SearchableSelect';
import { useTranslation } from '../hooks/useTranslation';

interface ScheduleExportModalProps {
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
  defaultPeriod?: ReportPeriod;
  classes?: any[]; // Nouvelle prop pour passer les classes déjà chargées
}

const FORMAT_OPTIONS: { value: ReportFormat; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { value: 'pdf',  label: 'PDF',       icon: <File className="w-5 h-5" />,            color: '#DC2626', desc: 'Document exportable, idéal pour affichage' },
  { value: 'docx', label: 'Word',      icon: <FileText className="w-5 h-5" />,        color: '#2563EB', desc: 'Document modifiable Microsoft Word' },
  { value: 'xlsx', label: 'Excel',     icon: <FileSpreadsheet className="w-5 h-5" />, color: '#059669', desc: 'Feuille de calcul Microsoft Excel' },
];

const ScheduleExportModal: React.FC<ScheduleExportModalProps> = ({ scheduleData, isOpen, onClose, defaultPeriod = 'all', classes = [] }) => {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat | 'whatsapp'>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(defaultPeriod);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [wahaStatus, setWahaStatus] = useState<{connected: boolean; status: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPeriod(defaultPeriod);
      checkWahaStatus();
    }
  }, [isOpen, defaultPeriod]);

  const checkWahaStatus = async () => {
    try {
      const data = await reportService.getWhatsAppStatus();
      setWahaStatus(data);
    } catch (error) {
      console.error('Erreur vérification WAHA:', error);
    }
  };
  
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
          // Utiliser les classes passées en prop si disponibles, sinon appeler le service
          if (classes && classes.length > 0) {
            list = classes.map(c => ({ id: String(c.id), name: c.name, level: c.level, specialty_id: String(c.specialty_id) }));
          } else {
            list = await reportService.getClasses();
          }
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
  }, [isOpen, exportType, scheduleData.viewMode, scheduleData.filter, classes]);

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
        setError(t('selectItemToExport'));
        setIsLoading(false);
        return;
      }

      if (selectedFormat === 'whatsapp') {
        if (!phone) {
          setError(t('pleaseFillAllFields'));
          setIsLoading(false);
          return;
        }

        const cleanPhone = (phone || '').replace(/\D/g, '');

        if (exportType === 'synthesis_class') {
          const classIds = selectedItemNames.map(name => options.find(o => o.name === name)?.id).filter(Boolean) as string[];
          await reportService.sendSynthesisWhatsApp(classIds, cleanPhone, selectedPeriod);
        } else {
          const item = options.find(opt => opt.name === selectedItemNames[0]);
          if (!item) {
            setError(t('errorGenerating'));
            setIsLoading(false);
            return;
          }

          if (exportType === 'class') {
            await reportService.sendScheduleWhatsApp(item.id, cleanPhone, selectedPeriod);
          } else {
            await reportService.sendTeacherScheduleWhatsApp(item.id, cleanPhone, selectedPeriod);
          }
        }
      } else {
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
            selectedFormat as ReportFormat,
            classIds.length > 1 ? classIds : undefined,
            selectedPeriod
          );
        } else {
          // Pour Classe et Enseignant, c'est une sélection unique via SearchableSelect
          const name = selectedItemNames[0];
          if (exportType === 'class') {
            await reportService.downloadSchedule(name, selectedFormat as ReportFormat, selectedPeriod);
          } else if (exportType === 'teacher') {
            await reportService.downloadTeacherSchedule(name, selectedFormat as ReportFormat, selectedPeriod);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || t('errorGenerating'));
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t('exportTimetable')}</h3>
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
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('exportType')}</p>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <button
                onClick={() => setExportType('class')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                {t('class')}
              </button>
              <button
                onClick={() => setExportType('teacher')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'teacher' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                {t('teacher')}
              </button>
              <button
                onClick={() => setExportType('synthesis_class')}
                className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                  exportType === 'synthesis_class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                }`}
              >
                {t('classSynthesis')}
              </button>
            </div>
          </div>

          {/* Sélecteur de période (Jour / Soir) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('coursePeriod')}</p>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              {(['all', 'day', 'evening'] as ReportPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`py-1.5 rounded-md text-[11px] font-bold transition-all uppercase ${
                    selectedPeriod === p ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border border-gray-200 dark:border-slate-500' : 'text-gray-500'
                  }`}
                >
                  {t(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteur d'élément (Classe / Enseignant) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {exportType === 'class' ? t('classToExport') : exportType === 'teacher' ? t('teacherToExport') : t('synthesisToExport')}
            </p>
            {exportType === 'synthesis_class' ? (
              <div className="max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 space-y-2">
                {groupedOptions && Object.entries(groupedOptions).map(([level, items]) => (
                  <div key={level}>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{level}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(item => (
                        <label key={item.id} className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-600 rounded border border-gray-100 dark:border-slate-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selectedItemNames.includes(item.name)}
                            onChange={() => {
                              setSelectedItemNames(prev => 
                                prev.includes(item.name) ? prev.filter(n => n !== item.name) : [...prev, item.name]
                              );
                            }}
                          />
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SearchableSelect
                value={selectedItemNames[0] || ''}
                onChange={(val) => setSelectedItemNames([val])}
                placeholder={exportType === 'class' ? t('selectClass') : t('selectTeacher')}
                options={options.map(o => ({ value: o.name, label: o.name }))}
              />
            )}
          </div>

          {/* Format d'export */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('exportType')}</p>
            <div className="grid grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map(fmt => (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedFormat(fmt.value)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                    selectedFormat === fmt.value 
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                      : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-700/50'
                  }`}
                >
                  <div style={{ color: fmt.color }}>{fmt.icon}</div>
                  <span className={`text-[10px] font-black ${selectedFormat === fmt.value ? 'text-blue-600' : 'text-gray-500'}`}>{fmt.label}</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedFormat('whatsapp')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                  selectedFormat === 'whatsapp' 
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20' 
                    : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-700/50'
                }`}
              >
                <div className="text-emerald-600"><Smartphone className="w-5 h-5" /></div>
                <span className={`text-[10px] font-black ${selectedFormat === 'whatsapp' ? 'text-emerald-600' : 'text-gray-500'}`}>WhatsApp</span>
              </button>
            </div>
          </div>

          {selectedFormat === 'whatsapp' && (
            <div className="space-y-2 p-3 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">{t('contact')} WhatsApp</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${wahaStatus?.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {wahaStatus?.connected ? 'WAHA CONNECTÉ' : 'WAHA DÉCONNECTÉ'}
                </span>
              </div>
              <input
                type="tel"
                placeholder="2376XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-emerald-200 dark:border-slate-600 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-medium italic">
                {t('cannotProgramOnSunday')}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-[11px] font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-[11px] font-bold">{selectedFormat === 'whatsapp' ? 'Message envoyé !' : 'Exportation terminée !'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || success}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              selectedFormat === 'whatsapp' ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />
            )}
            <span className="uppercase">{isLoading ? t('loading') : (selectedFormat === 'whatsapp' ? 'Envoyer' : t('generate'))}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleExportModal;
