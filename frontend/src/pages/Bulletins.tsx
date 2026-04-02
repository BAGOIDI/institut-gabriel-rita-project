import React, { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Loader2, Plus, List, Printer, BookOpen, Trash2, ChevronRight, BarChart3, TrendingUp, Users, Award, FileText } from 'lucide-react';
import { BulletinsService } from '../services/bulletins.service';
import { CoreService } from '../services/core.service';
import reportService from '../services/report.service';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../hooks/useTranslation';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Tab = 'evaluations' | 'grades' | 'dashboard' | 'print';

type Option = { id: number | string; name: string; code?: string };

interface BulkGrade {
  studentId: number;
  studentName: string;
  matricule: string;
  score: string;
  isAbsent: boolean;
  comments: string;
  hasChanged: boolean;
}

interface ClassStats {
  average: number;
  min: number;
  max: number;
  success_rate: number;
  count: number;
  student_averages: Array<{name: string, average: number}>;
}

export const Bulletins: React.FC = () => {
  const [tab, setTab] = useState<Tab>('evaluations');
  const notify = useNotification();
  const { t } = useTranslation();

  const [academicYears, setAcademicYears] = useState<Option[]>([]);
  const [semesters, setSemesters] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [bulkGrades, setBulkGrades] = useState<BulkGrade[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingEval, setIsCreatingEval] = useState(false);
  const [isDeletingEvalId, setIsDeletingEvalId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Form evaluation
  const [evalName, setEvalName] = useState('');
  const [evalType, setEvalType] = useState<'CC' | 'SN' | 'RA' | 'TP' | 'PROJET'>('CC');
  const [evalWeight, setEvalWeight] = useState(100);
  const [evalMax, setEvalMax] = useState('20.00');
  const [evalStatus, setEvalStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED'>('DRAFT');

  // Form grade (legacy, will be replaced by bulk entry)
  const [gradeScore, setGradeScore] = useState('');
  const [gradeAbsent, setGradeAbsent] = useState(false);
  const [gradeComments, setGradeComments] = useState('');

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === String(selectedStudentId)),
    [students, selectedStudentId],
  );

  useEffect(() => {
    const loadMeta = async () => {
      const [yrs, sems, cls] = await Promise.all([
        CoreService.getAll('academic-years').catch(() => []),
        CoreService.getAll('semesters').catch(() => []),
        CoreService.getAll('classes').catch(() => []),
      ]);

      const years = yrs?.items || yrs || [];
      const semestersArr = sems?.items || sems || [];
      const classesArr = cls?.items || cls || [];

      setAcademicYears(years.map((y: any) => ({ id: y.id, name: y.name })));
      setSemesters(semestersArr.map((s: any) => ({ id: s.id, name: s.name })));
      setClasses(classesArr.map((c: any) => ({ id: c.id, name: c.name })));

      if (years?.length) setAcademicYearId(Number(years[0].id));
      if (semestersArr?.length) setSemesterId(Number(semestersArr[0].id));
      if (classesArr?.length) setClassId(Number(classesArr[0].id));
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!classId) return;
      // Utiliser l'endpoint standard avec filtrage par classe ET semestre si disponible
      const params: any = { classId };
      if (semesterId) params.semesterId = semesterId;
      
      const res = await CoreService.getAll('subjects', params).catch(() => []);
      const items = Array.isArray(res) ? res : res?.items || [];
      setSubjects(items.map((s: any) => ({ id: s.id, name: s.name, code: s.code })));
      if (items?.length) setSubjectId(Number(items[0].id));
      else setSubjectId(null);
    };
    loadSubjects();
  }, [classId, semesterId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!classId) return;
      // On demande un nombre élevé d'étudiants (ex: 100) pour ne pas être limité par la pagination par défaut (10)
      const res = await CoreService.getAll('students', { classId, limit: 100 }).catch(() => []);
      const items = Array.isArray(res) ? res : res?.items || [];
      setStudents(items);
      if (items?.length) setSelectedStudentId(Number(items[0].id));
    };
    loadStudents();
  }, [classId]);

  const refreshEvaluations = async () => {
    const params: any = {};
    if (academicYearId !== null) params.academicYearId = academicYearId;
    if (semesterId !== null) params.semesterId = semesterId;
    if (subjectId !== null) params.subjectId = subjectId;
    const list = await BulletinsService.getAll('evaluations', params);
    const evals = Array.isArray(list) ? list : list?.items || [];
    setEvaluations(evals);
    
    // Ne sélectionner par défaut que si aucune évaluation n'est déjà sélectionnée
    if (evals.length > 0 && !selectedEvaluationId) {
      setSelectedEvaluationId(Number(evals[0].id));
    }
  };

  const refreshGrades = async () => {
    if (!selectedEvaluationId) {
      setBulkGrades([]);
      return;
    }
    const list = await BulletinsService.getAll('grades', { evaluationId: selectedEvaluationId });
    const gradesArr = Array.isArray(list) ? list : list?.items || [];
    setGrades(gradesArr);

    // Initialisation de la saisie en masse
    const initialBulk = students.map(student => {
      const existingGrade = gradesArr.find((g: any) => g.studentId === student.id);
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule || '',
        score: existingGrade ? (existingGrade.score || '') : '',
        isAbsent: existingGrade ? !!existingGrade.isAbsent : false,
        comments: existingGrade ? (existingGrade.comments || '') : '',
        hasChanged: false
      };
    });
    setBulkGrades(initialBulk);
  };

  useEffect(() => {
    setSelectedEvaluationId(null);
    refreshEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId, semesterId, subjectId]);

  useEffect(() => {
    refreshGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvaluationId, students]);

  const fetchClassStats = async () => {
    if (!classId || !semesterId) return;
    setIsLoadingStats(true);
    try {
      // Fetch stats from report-service
      const BASE = import.meta.env.VITE_REPORT_SERVICE_URL || '/api/reports';
      const res = await api.get(`${BASE}/grades/stats/class/${classId}`, {
        params: { semester_id: semesterId }
      });
      if (res.data && res.data.stats) {
        setClassStats(res.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      notify.error(t('statsLoadError'));
    } finally {
      setIsLoadingStats(false);
    }
  };

  const downloadBulkBulletins = async () => {
    if (!classId) return;
    try {
      await reportService.downloadCustom(`/bulletins/class/${classId}`, 'pdf', {
        academic_year_id: academicYearId || undefined,
        semester_id: semesterId || undefined,
      }, `Bulletins_Collectifs_${classId}.pdf`);
      notify.success("Téléchargement des bulletins collectifs démarré");
    } catch (error) {
      notify.error("Erreur lors de la génération des bulletins");
    }
  };

  const downloadPV = async () => {
    if (!classId) return;
    try {
      await reportService.downloadCustom(`/grades/pv/class/${classId}`, 'pdf', {
        academic_year_id: academicYearId || undefined,
        semester_id: semesterId || undefined,
      }, `PV_Notes_${classId}.pdf`);
      notify.success("Téléchargement du PV démarré");
    } catch (error) {
      notify.error(t('pvGenerationError'));
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') {
      fetchClassStats();
    }
  }, [tab, classId, semesterId]);

  const handleBulkSave = async () => {
    if (!selectedEvaluationId) return;
    setIsSaving(true);
    try {
      const changedItems = bulkGrades
        .filter(bg => bg.hasChanged)
        .map(bg => ({
          studentId: bg.studentId,
          evaluationId: Number(selectedEvaluationId),
          score: bg.isAbsent || !bg.score ? null : bg.score,
          isAbsent: bg.isAbsent,
          comments: bg.comments || null,
        }));

      if (changedItems.length > 0) {
        await BulletinsService.create('grades/bulk-upsert', {
          updatedBy: 'frontend',
          items: changedItems,
        });
        notify.success(t('notesSaved', { count: changedItems.length }));
        await refreshGrades();
      } else {
        notify.info(t('noChangesToSave'));
      }
    } catch (error) {
      notify.error(t('errorSavingNotes'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateBulkGrade = (studentId: number, field: keyof BulkGrade, value: any) => {
    // Validation de la note max si on change le score
    if (field === 'score' && value !== '') {
      const numValue = parseFloat(value);
      const selectedEval = evaluations.find(e => e.id === selectedEvaluationId);
      const maxScore = selectedEval ? parseFloat(selectedEval.maxScore) : 20;

      if (!isNaN(numValue) && numValue > maxScore) {
        notify.warning(t('scoreCannotExceedMax', { max: maxScore }));
        return; // Bloque la saisie d'une valeur supérieure
      }
    }

    setBulkGrades(prev => prev.map(bg => {
      if (bg.studentId === studentId) {
        return { ...bg, [field]: value, hasChanged: true };
      }
      return bg;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'score' | 'comments') => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-index="${index + 1}"][data-field="${field}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-index="${index - 1}"][data-field="${field}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const createEvaluation = async () => {
    // Vérifications explicites pour le débogage et l'UX
    if (academicYearId === null) { notify.error(t('academicYearNotSelected')); return; }
    if (semesterId === null) { notify.error(t('semesterNotSelected')); return; }
    if (subjectId === null) { notify.error(t('subjectNotSelected')); return; }
    if (!evalName.trim()) { notify.error(t('evaluationNameRequired')); return; }

    // Nettoyer la note max (remplacer virgule par point)
    const cleanedMaxScore = String(evalMax).replace(',', '.');
    if (isNaN(parseFloat(cleanedMaxScore)) || parseFloat(cleanedMaxScore) <= 0) {
      notify.error(t('maxScoreMustBePositive'));
      return;
    }

    setIsCreatingEval(true);
    try {
      const payload = {
        academicYearId: Number(academicYearId),
        semesterId: Number(semesterId),
        subjectId: Number(subjectId),
        name: evalName.trim(),
        type: evalType,
        weightPercent: Number(evalWeight) || 100,
        maxScore: cleanedMaxScore,
        status: evalStatus,
      };

      console.log("Tentative de création d'évaluation avec payload:", payload);
      const res = await BulletinsService.create('evaluations', payload);
      
      setEvalName('');
      notify.success(t('evaluationCreatedSuccessfully'));
      
      // Actualiser la liste
      await refreshEvaluations();
      
      if (res && (res.id || res.id === 0)) {
        const newId = Number(res.id);
        setSelectedEvaluationId(newId);
        // Basculer vers l'onglet notes après un court délai pour laisser le state se mettre à jour
        setTimeout(() => setTab('grades'), 100);
      }
    } catch (error: any) {
      console.error("Erreur détaillée création éval:", error);
      const msg = error.response?.data?.message || t('errorCreatingEvaluation');
      notify.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsCreatingEval(false);
    }
  };

  const deleteEvaluation = async (id: number) => {
    try {
      await BulletinsService.delete('evaluations', id);
      notify.success(t('evaluationDeleted'));
      if (selectedEvaluationId === id) setSelectedEvaluationId('');
      await refreshEvaluations();
    } catch (error) {
      notify.error(t('errorDeleting'));
    }
  };

  const upsertGrade = async () => {
    if (!selectedEvaluationId || !selectedStudentId) return;
    await BulletinsService.create('grades/bulk-upsert', {
      updatedBy: 'frontend',
      items: [
        {
          studentId: Number(selectedStudentId),
          evaluationId: Number(selectedEvaluationId),
          score: gradeAbsent ? null : gradeScore,
          isAbsent: gradeAbsent,
          comments: gradeComments || null,
        },
      ],
    });
    await refreshGrades();
  };

  const downloadBulletinPdf = async () => {
    if (!selectedStudent?.matricule) return;
    await reportService.downloadCustom(`/bulletin/${selectedStudent.matricule}`, 'pdf', {
      academic_year_id: academicYearId || undefined,
      semester_id: semesterId || undefined,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header avec Filtres Modernes */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Award className="w-7 h-7 text-blue-600" />
                {t('bulletinsAndNotes')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                {t('evaluationManagement')}
              </p>
          </div>
          
          <div className="flex bg-gray-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-slate-700 w-fit">
            {[
              { id: 'evaluations', label: t('evaluations'), icon: Plus },
              { id: 'grades', label: t('grades'), icon: BookOpen },
              { id: 'dashboard', label: t('dashboard'), icon: BarChart3 },
              { id: 'print', label: t('prints'), icon: Printer }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  tab === t.id 
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-gray-200 dark:border-slate-700' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <t.icon className={`w-3.5 h-3.5 ${tab === t.id ? 'text-blue-600' : ''}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              <ChevronRight className="w-3 h-3 text-blue-500" /> {t('year')}
            </label>
            <select 
              className="w-full text-sm font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
              value={academicYearId || ''} 
              onChange={(e) => setAcademicYearId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('select')}</option>
              {academicYears.map((y) => <option key={y.id} value={y.id as any}>{y.name}</option>)}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              <ChevronRight className="w-3 h-3 text-blue-500" /> {t('semester')}
            </label>
            <select 
              className="w-full text-sm font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
              value={semesterId || ''} 
              onChange={(e) => setSemesterId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sélectionner...</option>
              {semesters.map((s) => <option key={s.id} value={s.id as any}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              <ChevronRight className="w-3 h-3 text-blue-500" /> {t('class')}
            </label>
            <select 
              className="w-full text-sm font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
              value={classId || ''} 
              onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sélectionner...</option>
              {classes.map((c) => <option key={c.id} value={c.id as any}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              <ChevronRight className="w-3 h-3 text-blue-500" /> {t('subject')}
            </label>
            <select 
              className="w-full text-sm font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" 
              value={subjectId || ''} 
              onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sélectionner...</option>
              {subjects.map((s) => <option key={s.id} value={s.id as any}>{s.code ? `${s.code} — ${s.name}` : s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {tab === 'evaluations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Formulaire de création */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-6">
              <div className="bg-blue-600 px-6 py-4 border-b border-blue-700 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">
                  {t('newEvaluation')}
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('evaluationName')}</label>
                  <input 
                    className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white placeholder:font-normal" 
                    value={evalName} 
                    onChange={(e) => setEvalName(e.target.value)} 
                    placeholder={t('evaluationNamePlaceholder')} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('type')}</label>
                    <select 
                      className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                      value={evalType} 
                      onChange={(e) => setEvalType(e.target.value as any)}
                    >
                      <option value="CC">C.C</option>
                      <option value="SN">S.N</option>
                      <option value="RA">{t('retake')}</option>
                      <option value="TP">{t('practicalWork')}</option>
                      <option value="PROJET">{t('project')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('status')}</label>
                    <select 
                      className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                      value={evalStatus} 
                      onChange={(e) => setEvalStatus(e.target.value as any)}
                    >
                      <option value="DRAFT">{t('draft')}</option>
                      <option value="PUBLISHED">{t('published')}</option>
                      <option value="CLOSED">{t('closed')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('weight')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                        value={evalWeight} 
                        onChange={(e) => setEvalWeight(Number(e.target.value))} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('maxScore')}</label>
                    <input 
                      className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center" 
                      value={evalMax} 
                      onChange={(e) => setEvalMax(e.target.value)} 
                    />
                  </div>
                </div>

                <button 
                  onClick={createEvaluation} 
                  disabled={!evalName.trim() || subjectId === null || academicYearId === null || semesterId === null || isCreatingEval} 
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 mt-4"
                >
                  {isCreatingEval ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {t('saveEvaluation')}
                </button>
              </div>
            </div>
          </div>

          {/* Liste des évaluations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <List className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                    {t('evaluationHistory')}
                  </h2>
                </div>
                <button 
                  onClick={refreshEvaluations} 
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-gray-200 dark:border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/30 dark:bg-slate-900/30 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      <th className="px-6 py-4 border-b dark:border-slate-700">{t('labelAndType')}</th>
                      <th className="px-6 py-4 border-b dark:border-slate-700 text-center">{t('weight')}</th>
                      <th className="px-6 py-4 border-b dark:border-slate-700 text-center">{t('status')}</th>
                      <th className="px-6 py-4 border-b dark:border-slate-700 text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {evaluations.map((e) => (
                      <tr key={e.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{e.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 font-black px-1.5 py-0.5 rounded tracking-widest">{e.type}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{t('scoreOutOf', { max: e.maxScore })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                            {e.weightPercent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                            e.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            e.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {e.status === 'DRAFT' ? t('draft') : e.status === 'PUBLISHED' ? t('published') : t('closed')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => {
                                setSelectedEvaluationId(Number(e.id));
                                setTab('grades');
                              }}
                              className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 dark:border-blue-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                              title={t('enterGrades')}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('grades')}</span>
                            </button>
                            <button 
                              onClick={() => {
                                setIsDeletingEvalId(Number(e.id));
                                setConfirmDeleteOpen(true);
                              }}
                              className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100 dark:border-rose-900 shadow-sm"
                              title={t('delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {evaluations.length === 0 && (
                      <tr>
                        <td className="py-24 text-center" colSpan={4}>
                          <div className="flex flex-col items-center gap-4 opacity-30 group">
                            <div className="p-6 bg-gray-100 dark:bg-slate-900 rounded-full group-hover:scale-110 transition-transform">
                              <List className="w-12 h-12" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-[0.2em]">{t('noEvaluation')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="flex-1 min-w-[280px]">
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">{t('activeEvaluation')}</label>
                  <div className="relative group">
                    <select 
                      className="w-full text-sm font-bold px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all dark:text-white pr-10" 
                      value={selectedEvaluationId || ''} 
                      onChange={(e) => setSelectedEvaluationId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">{t('selectEvaluation')}</option>
                      {evaluations.map((e) => (
                        <option key={e.id} value={e.id}>{e.type} — {e.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
                {selectedEvaluationId && (
                  <div className="pt-6">
                    <button 
                      onClick={refreshGrades} 
                      className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-200"
                      title={t('refreshData')}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                <div className="text-right px-4 border-r border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">{t('changes')}</p>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400">{bulkGrades.filter(bg => bg.hasChanged).length}</p>
                </div>
                <button
                  onClick={handleBulkSave}
                  disabled={isSaving || bulkGrades.filter(bg => bg.hasChanged).length === 0}
                  className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-black transition-all shadow-xl shadow-blue-500/30 active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('save')}
                </button>
              </div>
            </div>

            {!selectedEvaluationId ? (
              <div className="text-center py-24 bg-gray-50/50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 group transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
                <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('readyForGrading')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                  {t('selectEvaluationToStart')}
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-900/50 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                        <th className="px-6 py-4">{t('student')}</th>
                        <th className="px-6 py-4 text-center w-36">{t('scoreOutOf', { max: evaluations.find(e => e.id === selectedEvaluationId)?.maxScore || '20' })}</th>
                        <th className="px-6 py-4 text-center w-24">{t('attendance')}</th>
                        <th className="px-6 py-4">{t('pedagogicalComments')}</th>
                        <th className="px-6 py-4 text-center w-20">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {bulkGrades.map((bg, idx) => (
                        <tr key={bg.studentId} className={`group hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all ${bg.hasChanged ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">{bg.studentName}</span>
                              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{bg.matricule}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <input
                                type="text"
                                data-index={idx}
                                data-field="score"
                                disabled={bg.isAbsent}
                                value={bg.score}
                                onChange={(e) => updateBulkGrade(bg.studentId, 'score', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, idx, 'score')}
                                className={`w-full text-center px-4 py-2.5 text-lg font-black rounded-xl border-2 transition-all outline-none ${
                                  bg.isAbsent 
                                    ? 'bg-gray-100 dark:bg-slate-900 text-gray-300 border-gray-100 dark:border-slate-800' 
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:text-white'
                                }`}
                                placeholder="--"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={!bg.isAbsent}
                                onChange={(e) => updateBulkGrade(bg.studentId, 'isAbsent', !e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-rose-100 dark:bg-rose-900/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                            <span className={`block text-[8px] font-bold mt-1 uppercase ${bg.isAbsent ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {bg.isAbsent ? t('absent') : t('present')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              data-index={idx}
                              data-field="comments"
                              value={bg.comments}
                              onChange={(e) => updateBulkGrade(bg.studentId, 'comments', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, idx, 'comments')}
                              className="w-full px-4 py-2.5 text-xs font-medium bg-gray-50/50 dark:bg-slate-900/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-900 outline-none transition-all dark:text-gray-300"
                              placeholder={t('appreciationPlaceholder')}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            {bg.hasChanged ? (
                              <div className="flex justify-center" title={t('pendingModification')}>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                  <RefreshCw className="w-4 h-4 text-amber-600 animate-spin-slow" />
                                </div>
                              </div>
                            ) : bg.score || bg.isAbsent ? (
                              <div className="flex justify-center" title={t('saved')}>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-100 dark:border-slate-800 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('classAverage')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black dark:text-white">{classStats?.average || '0.00'}</span>
                <span className="text-xs text-gray-400">/ 20</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('successRate')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black dark:text-white">{classStats?.success_rate || '0'}%</span>
                <span className="text-xs text-emerald-500 font-bold">({classStats?.count || 0} {t('students')})</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('maxScore')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black dark:text-white">{classStats?.max || '0.00'}</span>
                <span className="text-xs text-gray-400">/ 20</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('minScore')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black dark:text-white">{classStats?.min || '0.00'}</span>
                <span className="text-xs text-gray-400">/ 20</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                {t('studentRanking')}
              </h3>
            
            {classStats?.student_averages && classStats.student_averages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classStats.student_averages
                  .sort((a, b) => b.average - a.average)
                  .map((sa, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-100 text-amber-600' :
                          idx === 1 ? 'bg-gray-200 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-white dark:bg-slate-800 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase truncate max-w-[150px]">{sa.name}</span>
                      </div>
                      <span className={`text-sm font-black ${sa.average >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sa.average.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                {t('selectClassAndSemesterToSeeRanking')}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'print' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-8 text-center max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800">
              <Printer className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('printsAndReports')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-lg mx-auto">
              {t('generateOfficialDocuments')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Individuel */}
              <div className="p-6 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 flex flex-col items-center">
                <Users className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="text-sm font-bold mb-2">{t('individualBulletin')}</h3>
                <select 
                  className="w-full mb-4 px-3 py-2 text-xs border rounded-lg dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('selectStudent')}</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
                <button
                  onClick={downloadBulletinPdf}
                  disabled={!selectedStudentId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t('print')}
                </button>
              </div>

              {/* Option 2: Collectif */}
              <div className="p-6 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 flex flex-col items-center">
                <FileText className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="text-sm font-bold mb-2">{t('collectivePrinting')}</h3>
                <p className="text-[10px] text-gray-400 text-center mb-4">{t('generateAllClassBulletins')}</p>
                <button
                  onClick={downloadBulkBulletins}
                  disabled={!classId}
                  className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t('printAll')}
                </button>
              </div>

              {/* Option 3: Procès-Verbal */}
              <div className="p-6 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 flex flex-col items-center">
                <List className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="text-sm font-bold mb-2">{t('officialReport')}</h3>
                <p className="text-[10px] text-gray-400 text-center mb-4">{t('summaryTableOfAllGrades')}</p>
                <button
                  onClick={downloadPV}
                  disabled={!classId}
                  className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Générer le PV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setIsDeletingEvalId(null);
        }}
        onConfirm={() => {
          if (isDeletingEvalId) deleteEvaluation(isDeletingEvalId);
          setConfirmDeleteOpen(false);
          setIsDeletingEvalId(null);
        }}
        title={t('confirmDeletion')}
        message={t('confirmDeleteEvaluationMessage')}
      />
    </div>
  );
};