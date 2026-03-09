import React, { useState, useEffect } from 'react';
import {
  FileText, Download, FileSpreadsheet, File, AlertCircle,
  CheckCircle, Loader2, ChevronDown, ChevronRight, Search, RefreshCw
} from 'lucide-react';
import reportService, { ReportFormat, ReportDef } from '../services/report.service';
import api from '../services/api.service';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DownloadState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const FORMAT_META: Record<ReportFormat, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pdf:  { label: 'PDF',  icon: <File className="w-4 h-4" />,            color: '#DC2626', bg: '#FEF2F2' },
  docx: { label: 'Word', icon: <FileText className="w-4 h-4" />,        color: '#2563EB', bg: '#EFF6FF' },
  xlsx: { label: 'Excel',icon: <FileSpreadsheet className="w-4 h-4" />, color: '#059669', bg: '#ECFDF5' },
};

// ─── Composants internes ──────────────────────────────────────────────────────

const FormatBadge: React.FC<{fmt: ReportFormat; selected: boolean; onClick: () => void}> = ({fmt, selected, onClick}) => {
  const meta = FORMAT_META[fmt];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
        selected
          ? 'shadow-sm text-white'
          : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-gray-400'
      }`}
      style={selected ? { backgroundColor: meta.color, borderColor: meta.color } : {}}
    >
      <span style={{ color: selected ? 'white' : meta.color }}>{meta.icon}</span>
      {meta.label}
    </button>
  );
};

const StatusBadge: React.FC<{state: DownloadState}> = ({state}) => {
  if (state.loading) return (
    <span className="flex items-center gap-1 text-blue-600 text-xs">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération...
    </span>
  );
  if (state.success) return (
    <span className="flex items-center gap-1 text-green-600 text-xs">
      <CheckCircle className="w-3.5 h-3.5" /> Téléchargé !
    </span>
  );
  if (state.error) return (
    <span className="flex items-center gap-1 text-red-600 text-xs">
      <AlertCircle className="w-3.5 h-3.5" /> {state.error}
    </span>
  );
  return null;
};

// ─── Carte de rapport ─────────────────────────────────────────────────────────

interface ReportCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  formats: ReportFormat[];
  params?: React.ReactNode;
  onDownload: (fmt: ReportFormat) => Promise<void>;
}

const ReportCard: React.FC<ReportCardProps> = ({title, description, icon, formats, params, onDownload}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [state, setState] = useState<DownloadState>({loading: false, success: false, error: null});

  const handleDownload = async () => {
    setState({loading: true, success: false, error: null});
    try {
      await onDownload(selectedFormat);
      setState({loading: false, success: true, error: null});
      setTimeout(() => setState(s => ({...s, success: false})), 3000);
    } catch (e: any) {
      setState({loading: false, success: false, error: e?.message || 'Erreur'});
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
          {icon || <FileText className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      {params && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md border border-gray-100 dark:border-slate-700">
          {params}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {formats.map(fmt => (
            <FormatBadge key={fmt} fmt={fmt} selected={selectedFormat === fmt} onClick={() => setSelectedFormat(fmt)} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge state={state} />
          <button
            onClick={handleDownload}
            disabled={state.loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-xs font-medium transition-colors border border-blue-700"
          >
            {state.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const [classes, setClasses] = useState<{id: string; name: string}[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMatricule, setSelectedMatricule] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Charger les métadonnées au montage
  useEffect(() => {
    const init = async () => {
      setLoadingMeta(true);
      try {
        await reportService.healthCheck();
        setServiceStatus('ok');
      } catch {
        setServiceStatus('error');
      }

      try {
        const cls = await reportService.getClasses().catch(() => []);
        setClasses(cls);
        if (cls.length > 0) setSelectedClass(cls[0].name);
      } catch {}

      try {
        const resp = await api.get('/api/core/students?limit=200');
        const items = resp.data?.items || resp.data || [];
        setStudents(items);
        if (items.length > 0) setSelectedMatricule(items[0].matricule || '');
      } catch {}

      setLoadingMeta(false);
    };
    init();
  }, []);

  const safeStudents = Array.isArray(students) ? students : [];

  const filteredStudents = safeStudents.filter(s =>
    `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">RAPPORTS & EXPORTS</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Génération de documents officiels — PDF, Word, Excel</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Statut service */}
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border font-medium ${
            serviceStatus === 'ok' ? 'bg-green-50 text-green-700 border-green-200' :
            serviceStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {serviceStatus === 'ok' && <CheckCircle className="w-3 h-3" />}
            {serviceStatus === 'error' && <AlertCircle className="w-3 h-3" />}
            {serviceStatus === 'unknown' && <Loader2 className="w-3 h-3 animate-spin" />}
            {serviceStatus === 'ok' ? 'Service actif' : serviceStatus === 'error' ? 'Service indisponible' : 'Vérification...'}
          </span>
        </div>
      </div>

      {serviceStatus === 'error' && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Le service de rapports est inaccessible. Vérifiez que le conteneur <code className="bg-amber-100 px-1 rounded">report-service</code> est démarré.
            Les téléchargements échoueront jusqu'au rétablissement du service.
          </p>
        </div>
      )}

      {/* Formats disponibles */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-3 mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Formats :</span>
        {Object.entries(FORMAT_META).map(([fmt, meta]) => (
          <span key={fmt} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border" style={{color: meta.color, backgroundColor: meta.bg, borderColor: meta.color + '40'}}>
            {meta.icon} {meta.label}
          </span>
        ))}
      </div>

      {/* Grille de rapports */}
      <div className="space-y-6">

        {/* ── Section 1: Rapports globaux ── */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block" />
            Rapports Globaux
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportCard
              title="Rapport Global de l'École"
              description="Vue d'ensemble de tous les étudiants, statistiques générales et situation financière."
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              formats={['pdf', 'docx', 'xlsx']}
              onDownload={(fmt) => reportService.downloadGlobalSchool(fmt)}
            />
            <ReportCard
              title="Paiements en Retard"
              description="Liste complète des élèves ayant un solde impayé, avec les montants dus."
              icon={<AlertCircle className="w-5 h-5 text-red-500" />}
              formats={['pdf', 'docx', 'xlsx']}
              onDownload={(fmt) => reportService.downloadLatePayments(fmt)}
            />
            <ReportCard
              title="Moratoires"
              description="Élèves bénéficiant d'un moratoire de paiement (solde négatif autorisé)."
              icon={<FileText className="w-5 h-5 text-orange-500" />}
              formats={['pdf', 'docx', 'xlsx']}
              onDownload={(fmt) => reportService.downloadMoratoriums(fmt)}
            />
          </div>
        </section>

        {/* ── Section 2: Par classe ── */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
            Rapports par Classe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportCard
              title="Emploi du Temps"
              description="Emploi du temps hebdomadaire d'une classe, avec horaires, matières, enseignants et salles."
              icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
              formats={['pdf', 'docx', 'xlsx']}
              params={
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Classe *</label>
                  {loadingMeta ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <select
                      value={selectedClass}
                      onChange={e => setSelectedClass(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {classes.length === 0 && (
                        <>
                          {['Terminale C','Terminale D','1ère C','1ère D','2nde A','2nde C','3ème'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </>
                      )}
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              }
              onDownload={(fmt) => reportService.downloadSchedule(selectedClass || 'Terminale C', fmt)}
            />
            <ReportCard
              title="Paiements par Classe"
              description="Synthèse financière d'une classe : frais facturés, payés, et solde de chaque élève."
              icon={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
              formats={['pdf', 'docx', 'xlsx']}
              params={
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Classe *</label>
                  {loadingMeta ? (
                    <div className="h-7 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <select
                      value={selectedClass}
                      onChange={e => setSelectedClass(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {classes.length === 0 && (
                        <>
                          {['Terminale C','Terminale D','1ère C','1ère D','2nde A','2nde C'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </>
                      )}
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              }
              onDownload={(fmt) => reportService.downloadPaymentsByClass(selectedClass || 'Terminale C', fmt)}
            />
          </div>
        </section>

        {/* ── Section 3: Par étudiant ── */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full inline-block" />
            Rapport par Étudiant
          </h2>
          <ReportCard
            title="Relevé de Compte Étudiant"
            description="Historique complet des paiements, factures émises, et solde actuel d'un élève."
            icon={<FileText className="w-5 h-5 text-purple-600" />}
            formats={['pdf', 'docx', 'xlsx']}
            params={
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">Étudiant *</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou matricule..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {loadingMeta ? (
                  <div className="h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <select
                    value={selectedMatricule}
                    onChange={e => setSelectedMatricule(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {filteredStudents.length === 0 && students.length === 0 && (
                      <option value="IGR-001">IGR-001 (exemple)</option>
                    )}
                    {filteredStudents.map(s => (
                      <option key={s.matricule} value={s.matricule}>
                        {s.firstName} {s.lastName} — {s.matricule}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            }
            onDownload={(fmt) => reportService.downloadStudentReport(selectedMatricule || 'IGR-001', fmt)}
          />
        </section>
      </div>
    </div>
  );
};

export default Reports;
