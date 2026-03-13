/**
 * Service de communication avec le report-service
 * Institut Gabriel Rita
 */
import api from './api.service';

const BASE = import.meta.env.VITE_REPORT_SERVICE_URL || '/api/reports';

export type ReportFormat = 'pdf' | 'docx' | 'xlsx';

export interface ReportDef {
  id: string;
  name: string;
  description: string;
  params: string[];
  formats: ReportFormat[];
  route: string;
}

const MIME: Record<ReportFormat, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const reportService = {
  /** Vérifie l'état du service */
  async healthCheck() {
    const res = await api.get(`${BASE}/health`);
    return res.data;
  },

  /** Liste les rapports disponibles */
  async getAvailableReports(): Promise<ReportDef[]> {
    const res = await api.get(`${BASE}/available`);
    return res.data;
  },

  /** Liste les classes disponibles */
  async getClasses(): Promise<{id: string; name: string; specialty_id: string}[]> {
    const res = await api.get(`${BASE}/classes`);
    return res.data;
  },

  /** Liste les enseignants disponibles */
  async getTeachers(): Promise<{id: string; name: string}[]> {
    const res = await api.get(`${BASE}/teachers`);
    return res.data;
  },

  /** Liste les matières disponibles */
  async getSubjects(): Promise<{id: string; name: string}[]> {
    const res = await api.get(`${BASE}/subjects`);
    return res.data;
  },

  /** Liste les filières (specialties) disponibles */
  async getSpecialties(): Promise<{id: string; name: string; code: string}[]> {
    const res = await api.get(`${BASE}/specialties`);
    return res.data;
  },

  /** Génère l'emploi du temps d'une classe (Blob) */
  async getScheduleBlob(className: string, format: ReportFormat = 'pdf'): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/${encodeURIComponent(className)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    return new Blob([res.data], { type: MIME[format] });
  },

  /** Génère l'emploi du temps d'un enseignant (Blob) */
  async getTeacherScheduleBlob(teacherName: string, format: ReportFormat = 'pdf'): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/teacher/${encodeURIComponent(teacherName)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    return new Blob([res.data], { type: MIME[format] });
  },

  /** Génère la synthèse (Blob) */
  async getSynthesisBlob(classId?: string, staffId?: string, format: ReportFormat = 'pdf', specialtyIds?: string[]): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/synthesis`, {
      params: { 
        format,
        class_id: classId || undefined,
        staff_id: staffId || undefined,
        specialty_ids: specialtyIds && specialtyIds.length > 0 ? specialtyIds.join(',') : undefined,
      },
      responseType: 'blob',
      timeout: 120000,
    });
    return new Blob([res.data], { type: MIME[format] });
  },

  /** Génère et télécharge l'emploi du temps d'une classe */
  async downloadSchedule(className: string, format: ReportFormat = 'pdf') {
    const blob = await reportService.getScheduleBlob(className, format);
    triggerDownload(blob, `edt_classe_${className}.${format}`);
    return blob;
  },

  /** Génère et télécharge l'emploi du temps d'un enseignant */
  async downloadTeacherSchedule(teacherName: string, format: ReportFormat = 'pdf') {
    const blob = await reportService.getTeacherScheduleBlob(teacherName, format);
    triggerDownload(blob, `edt_enseignant_${teacherName.replace(/\s+/g, '_')}.${format}`);
    return blob;
  },

  /** Génère et télécharge l'emploi du temps d'une matière */
  async downloadSubjectSchedule(subjectName: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/schedule/subject/${encodeURIComponent(subjectName)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `edt_matiere_${subjectName.replace(/\s+/g, '_')}.${format}`);
    return blob;
  },

  /** Génère et télécharge la synthèse globale des emplois du temps (Tableau complexe) */
  async downloadSynthesisSchedule(
    classId?: string,
    staffId?: string,
    format: ReportFormat = 'pdf',
    specialtyIds?: string[],
  ) {
    const blob = await reportService.getSynthesisBlob(classId, staffId, format, specialtyIds);
    triggerDownload(blob, `synthese_emplois_du_temps.${format}`);
    return blob;
  },

  /** Génère et télécharge le relevé de compte d'un étudiant */
  async downloadStudentReport(matricule: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/student/${encodeURIComponent(matricule)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `releve_compte_${matricule}.${format}`);
    return blob;
  },

  /** Génère et télécharge le rapport global de l'école */
  async downloadGlobalSchool(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/global-school`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `rapport_global_ecole.${format}`);
    return blob;
  },

  /** Génère et télécharge le rapport des paiements en retard */
  async downloadLatePayments(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/late-payments`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `paiements_en_retard.${format}`);
    return blob;
  },

  /** Génère et télécharge le rapport des moratoires */
  async downloadMoratoriums(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/moratoriums`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `moratoires.${format}`);
    return blob;
  },

  /** Génère et télécharge le rapport des paiements par classe */
  async downloadPaymentsByClass(className: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/payments-by-class/${encodeURIComponent(className)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    const blob = new Blob([res.data], { type: MIME[format] });
    triggerDownload(blob, `paiements_classe_${className}.${format}`);
    return blob;
  },

  /** Génère l'emploi du temps depuis les données du frontend (modal Timetable) */
  async generateScheduleReport(scheduleData: any, format: ReportFormat = 'pdf') {
    const className = scheduleData.filter || scheduleData.class || 'classe';
    return reportService.downloadSchedule(className, format);
  },
};

export default reportService;
