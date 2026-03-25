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

export type ReportPeriod = 'day' | 'evening' | 'all';

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
  async getClasses(): Promise<{id: string; name: string; level?: string; specialty_id: string}[]> {
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
  async getScheduleBlob(className: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all'): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/${encodeURIComponent(className)}`, {
      params: { format, period },
      responseType: 'blob',
      timeout: 120000,
    });
    return res.data;
  },

  /** Génère l'emploi du temps d'un enseignant (Blob) */
  async getTeacherScheduleBlob(teacherName: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all'): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/teacher/${encodeURIComponent(teacherName)}`, {
      params: { format, period },
      responseType: 'blob',
      timeout: 120000,
    });
    return res.data;
  },

  /** Génère la synthèse (Blob) */
  async getSynthesisBlob(classId?: string, staffId?: string, format: ReportFormat = 'pdf', specialtyIds?: string[], period: ReportPeriod = 'all'): Promise<Blob> {
    const res = await api.get(`${BASE}/schedule/synthesis`, {
      params: { 
        format,
        period,
        class_id: classId || undefined,
        staff_id: staffId || undefined,
        class_ids: specialtyIds?.join(',') || undefined
      },
      responseType: 'blob',
      timeout: 120000,
    });
    return new Blob([res.data], { type: MIME[format] });
  },

  /** Déclenche le téléchargement de l'EDT d'une classe */
  async downloadSchedule(className: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all') {
    const blob = await this.getScheduleBlob(className, format, period);
    this.triggerDownload(blob, `EDT_${className.replace(/\s+/g, '_')}.${format}`);
  },

  /** Déclenche le téléchargement de l'EDT d'un enseignant */
  async downloadTeacherSchedule(teacherName: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all') {
    const blob = await this.getTeacherScheduleBlob(teacherName, format, period);
    this.triggerDownload(blob, `EDT_Enseignant_${teacherName.replace(/\s+/g, '_')}.${format}`);
  },

  /** Génère et télécharge l'emploi du temps d'une matière */
  async downloadSubjectSchedule(subjectName: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/schedule/subject/${encodeURIComponent(subjectName)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `edt_matiere_${subjectName.replace(/\s+/g, '_')}.${format}`);
    return res.data;
  },

  /** Déclenche le téléchargement de la synthèse */
  async downloadSynthesisSchedule(classId?: string, staffId?: string, format: ReportFormat = 'pdf', specialtyIds?: string[], period: ReportPeriod = 'all') {
    const blob = await this.getSynthesisBlob(classId, staffId, format, specialtyIds, period);
    this.triggerDownload(blob, `Synthese_EDT.${format}`);
  },

  /** Déclenche le téléchargement d'un fichier */
  triggerDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  },

  /** Génère et télécharge le relevé de compte d'un étudiant */
  async downloadStudentReport(matricule: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/student/${encodeURIComponent(matricule)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `releve_compte_${matricule}.${format}`);
    return res.data;
  },

  /** Génère et télécharge le rapport global de l'école */
  async downloadGlobalSchool(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/global-school`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `rapport_global_ecole.${format}`);
    return res.data;
  },

  /** Génère et télécharge le rapport des paiements en retard */
  async downloadLatePayments(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/late-payments`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `paiements_en_retard.${format}`);
    return res.data;
  },

  /** Génère et télécharge le rapport des moratoires */
  async downloadMoratoriums(format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/moratoriums`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `moratoires.${format}`);
    return res.data;
  },

  /** Génère et télécharge le rapport des paiements par classe */
  async downloadPaymentsByClass(className: string, format: ReportFormat = 'pdf') {
    const res = await api.get(`${BASE}/payments-by-class/${encodeURIComponent(className)}`, {
      params: { format },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, `paiements_classe_${className}.${format}`);
    return res.data;
  },

  /** Génère une facture en texte brut */
  async generateInvoiceTxt(data: any): Promise<string> {
    const response = await api.post(`${BASE}/generate-invoice-txt`, data);
    return response.data;
  },

  /** Génère l'emploi du temps depuis les données du frontend (modal Timetable) */
  async generateScheduleReport(scheduleData: any, format: ReportFormat = 'pdf') {
    const className = scheduleData.filter || scheduleData.class || 'classe';
    return reportService.downloadSchedule(className, format);
  },

  /** Génère la carte d'étudiant (Blob) */
  async getStudentCardBlob(matricule: string): Promise<Blob> {
    const res = await api.get(`${BASE}/student/card/${encodeURIComponent(matricule)}`, {
      responseType: 'blob',
      timeout: 120000,
    });
    return new Blob([res.data], { type: MIME['pdf'] });
  },

  /** Déclenche le téléchargement */
  download(blob: Blob, filename: string) {
    triggerDownload(blob, filename);
  },
};

export default reportService;
