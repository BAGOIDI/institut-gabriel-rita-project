/**
 * Service de communication avec le report-service
 * Institut Gabriel Rita
 */
import api from './api.service';

const BASE = import.meta.env.VITE_REPORT_SERVICE_URL || '/api/reports';
const CORE_BASE = '/api/core';

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

const toArray = (v: any) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (typeof v === 'object' && Object.keys(v).every(k => !isNaN(parseInt(k)))) {
    return Object.values(v);
  }
  return [];
};

const reportService = {
  /** Vérifie l'état du service */
  async healthCheck() {
    const res = await api.get(`${BASE}/health`);
    return res.data;
  },

  /** Liste les rapports disponibles */
  async getAvailableReports(): Promise<ReportDef[]> {
    const res = await api.get(`${BASE}/available`);
    return toArray(res.data);
  },

  /** Liste les classes disponibles */
  async getClasses(): Promise<{id: string; name: string; level?: string; specialty_id: string}[]> {
    // Utiliser le service core si report-service n'est pas disponible
    try {
      const res = await api.get(`${BASE}/classes`);
      return toArray(res.data);
    } catch (error) {
      // Fallback sur core-scolarite
      const res = await api.get(`${CORE_BASE}/classes`);
      const items = res.data?.items || res.data || [];
      return toArray(items).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        level: c.level,
        specialty_id: String(c.specialty_id)
      }));
    }
  },

  /** Liste les enseignants disponibles */
  async getTeachers(): Promise<{id: string; name: string}[]> {
    // Utiliser le service core si report-service n'est pas disponible
    try {
      const res = await api.get(`${BASE}/teachers`);
      return toArray(res.data);
    } catch (error) {
      // Fallback sur core-scolarite
      const res = await api.get(`${CORE_BASE}/teachers`);
      const items = res.data?.items || res.data || [];
      return toArray(items).map((t: any) => ({
        id: String(t.id),
        name: `${t.firstName || ''} ${t.lastName || ''}`.trim()
      }));
    }
  },

  /** Liste les matières disponibles */
  async getSubjects(): Promise<{id: string; name: string}[]> {
    const res = await api.get(`${BASE}/subjects`);
    return toArray(res.data);
  },

  /** Liste les filières (specialties) disponibles */
  async getSpecialties(): Promise<{id: string; name: string; code: string}[]> {
    const res = await api.get(`${BASE}/specialties`);
    return toArray(res.data);
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
    return res.data;
  },

  /** Déclenche le téléchargement de l'EDT d'une classe */
  async downloadSchedule(className: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all') {
    try {
      const blob = await this.getScheduleBlob(className, format, period);
      this.triggerDownload(blob, `EDT_${className.replace(/\s+/g, '_')}.${format}`);
    } catch (error: any) {
      console.error('Erreur downloadSchedule:', error);
      // Fallback: utiliser les données du planning service directement
      throw new Error(`Service reports indisponible. Veuillez réessayer plus tard ou contacter l'administrateur.`);
    }
  },

  /** Déclenche le téléchargement de l'EDT d'un enseignant */
  async downloadTeacherSchedule(teacherName: string, format: ReportFormat = 'pdf', period: ReportPeriod = 'all') {
    try {
      const blob = await this.getTeacherScheduleBlob(teacherName, format, period);
      this.triggerDownload(blob, `EDT_Enseignant_${teacherName.replace(/\s+/g, '_')}.${format}`);
    } catch (error: any) {
      console.error('Erreur downloadTeacherSchedule:', error);
      throw new Error(`Service reports indisponible. Veuillez réessayer plus tard ou contacter l'administrateur.`);
    }
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

  /** Télécharge un endpoint custom du report-service (PDF/DOCX/XLSX) */
  async downloadCustom(path: string, format: ReportFormat = 'pdf', params?: Record<string, any>, fileName?: string) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const res = await api.get(`${BASE}${cleanPath}`, {
      params: { format, ...(params || {}) },
      responseType: 'blob',
      timeout: 120000,
    });
    this.triggerDownload(res.data, fileName || `document.${format}`);
    return res.data;
  },

  /** Envoie l'EDT d'une classe par WhatsApp */
  async sendScheduleWhatsApp(classId: string, phone: string, period: ReportPeriod = 'all') {
    const res = await api.post(`${BASE}/whatsapp/send-schedule/${classId}`, {
      phone,
      period
    });
    return res.data;
  },

  /** Envoie l'EDT d'un enseignant par WhatsApp */
  async sendTeacherScheduleWhatsApp(staffId: string, phone: string, period: ReportPeriod = 'all') {
    const res = await api.post(`${BASE}/whatsapp/send-to-teacher/${staffId}`, {
      phone,
      period
    });
    return res.data;
  },

  /** Envoie la synthèse par WhatsApp */
  async sendSynthesisWhatsApp(classIds: string[], phone: string, period: ReportPeriod = 'all') {
    const res = await api.post(`${BASE}/whatsapp/send-synthesis`, {
      phone,
      class_ids: classIds,
      period
    });
    return res.data;
  },

  /** Récupère le statut de WAHA */
  async getWhatsAppStatus() {
    const res = await api.get(`${BASE}/whatsapp/status`);
    return res.data;
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
    this.triggerDownload(res.data, `paiements_classe_${className.replace(/\s+/g, '_')}.${format}`);
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
    return res.data;
  },

  /** Déclenche le téléchargement */
  download(blob: Blob, filename: string) {
    triggerDownload(blob, filename);
  },
};

export default reportService;
