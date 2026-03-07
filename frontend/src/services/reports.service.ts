/**
 * ReportsService — compatibilité avec ReportGenerator.tsx
 */
import reportService, { ReportFormat } from './report.service';

export class ReportsService {
  static async getAvailableReports(): Promise<string[]> {
    const reports = await reportService.getAvailableReports();
    return reports.map(r => r.id);
  }

  static async generateReport(reportId: string, format: string, params: any = {}): Promise<Blob> {
    const fmt = format as ReportFormat;
    switch (reportId) {
      case 'schedule':
        return reportService.downloadSchedule(params.class_name || params.className || 'Terminale C', fmt);
      case 'student':
        return reportService.downloadStudentReport(params.matricule || '', fmt);
      case 'global-school':
        return reportService.downloadGlobalSchool(fmt);
      case 'late-payments':
        return reportService.downloadLatePayments(fmt);
      case 'moratoriums':
        return reportService.downloadMoratoriums(fmt);
      case 'payments-by-class':
        return reportService.downloadPaymentsByClass(params.class_name || params.className || '', fmt);
      default:
        throw new Error(`Rapport inconnu: ${reportId}`);
    }
  }

  static async generateReportWithData(reportId: string, format: string, data: any[], params: any = {}): Promise<Blob> {
    return ReportsService.generateReport(reportId, format, params);
  }

  static downloadReport(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}
