import React, { useState, useEffect } from 'react';
import { Download, Loader2, AlertCircle, CheckCircle, FileText, FileSpreadsheet, File, RefreshCw } from 'lucide-react';
import { ReportsService } from '../services/reports.service';
import reportService, { ReportDef, ReportFormat } from '../services/report.service';
import api from '../services/api.service';

const REPORT_LABELS: Record<string, string> = {
  'schedule':           "Emploi du Temps",
  'student':            "Relevé de Compte Étudiant",
  'global-school':      "Rapport Global École",
  'late-payments':      "Paiements en Retard",
  'moratoriums':        "Moratoires",
  'payments-by-class':  "Paiements par Classe",
};

const FORMAT_ICONS: Record<ReportFormat, React.ReactNode> = {
  pdf:  <File className="w-4 h-4 text-red-500" />,
  docx: <FileText className="w-4 h-4 text-blue-500" />,
  xlsx: <FileSpreadsheet className="w-4 h-4 text-green-500" />,
};

interface ReportGeneratorProps {
  reportName?: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ reportName: initialReportName }) => {
  const [reports, setReports] = useState<ReportDef[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>(initialReportName || '');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Paramètres contextuels
  const [classes, setClasses] = useState<{id:string; name:string}[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatricule, setSelectedMatricule] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const r = await reportService.getAvailableReports();
        setReports(r);
        if (!initialReportName && r.length > 0) setSelectedReport(r[0].id);
      } catch {
        // Fallback avec les IDs connus
        const fallback: ReportDef[] = Object.entries(REPORT_LABELS).map(([id, name]) => ({
          id, name, description: '', params: [], formats: ['pdf','docx','xlsx'], route: ''
        }));
        setReports(fallback);
        if (!initialReportName) setSelectedReport(fallback[0].id);
      }
      try {
        const cls = await reportService.getClasses();
        setClasses(cls);
        if (cls.length > 0) setSelectedClass(cls[0].name);
      } catch {}
      try {
        const resp = await api.get('/api/core/students?limit=100');
        const items = resp.data?.items || resp.data || [];
        setStudents(items);
        if (items.length > 0) setSelectedMatricule(items[0].matricule || '');
      } catch {}
    };
    init();
  }, []);

  const currentReport = reports.find(r => r.id === selectedReport);
  const needsClass = currentReport?.params.includes('class_name');
  const needsMatricule = currentReport?.params.includes('matricule');

  const handleGenerate = async () => {
    if (!selectedReport) { setError('Veuillez sélectionner un rapport'); return; }
    setIsLoading(true); setError(null); setSuccess(false);
    try {
      const params: any = {};
      if (needsClass) params.class_name = selectedClass;
      if (needsMatricule) params.matricule = selectedMatricule;
      await ReportsService.generateReport(selectedReport, format, params);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la génération');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Générateur de Rapports</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Sélection rapport */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rapport</label>
          <select
            value={selectedReport}
            onChange={e => setSelectedReport(e.target.value)}
            className="w-full text-sm px-2.5 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choisir...</option>
            {reports.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Format</label>
          <div className="flex gap-2">
            {(['pdf','docx','xlsx'] as ReportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-md border text-xs font-medium flex-1 justify-center transition-all ${
                  format === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                }`}
              >
                {FORMAT_ICONS[f]} {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Paramètre contextuel */}
        <div>
          {needsClass && (
            <>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Classe</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full text-sm px-2.5 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {classes.length === 0 ? (
                  ['Terminale C','Terminale D','1ère C','2nde A'].map(c => <option key={c}>{c}</option>)
                ) : (
                  classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                )}
              </select>
            </>
          )}
          {needsMatricule && (
            <>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Étudiant</label>
              <select
                value={selectedMatricule}
                onChange={e => setSelectedMatricule(e.target.value)}
                className="w-full text-sm px-2.5 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {students.map(s => (
                  <option key={s.matricule} value={s.matricule}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </>
          )}
          {!needsClass && !needsMatricule && (
            <div className="flex items-end h-full pb-0.5">
              <span className="text-xs text-gray-400 italic">Aucun paramètre requis</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Document généré et téléchargé avec succès !
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!selectedReport || isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {isLoading ? 'Génération en cours...' : 'Générer et télécharger'}
      </button>
    </div>
  );
};

export default ReportGenerator;
