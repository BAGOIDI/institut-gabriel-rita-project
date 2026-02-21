import api from './api.service';

export interface ReportParams {
  [key: string]: any;
}

export interface ReportData {
  [key: string]: any;
}

export const ReportsService = {
  /**
   * Récupère la liste des rapports disponibles
   */
  getAvailableReports: async (): Promise<string[]> => {
    try {
      const response = await api.get('/reports/available');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports disponibles:', error);
      throw error;
    }
  },

  /**
   * Génère un rapport au format spécifié
   */
  generateReport: async (
    reportName: string,
    format: 'pdf' | 'xlsx' | 'docx' | 'csv' | 'html',
    params?: ReportParams
  ): Promise<Blob> => {
    try {
      const response = await api.get(`/reports/${reportName}/generate`, {
        params: {
          format,
          ...(params && { params: JSON.stringify(params) })
        },
        responseType: 'blob' // Important pour télécharger les fichiers
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la génération du rapport ${reportName} au format ${format}:`, error);
      throw error;
    }
  },

  /**
   * Génère un rapport avec des données spécifiques
   */
  generateReportWithData: async (
    reportName: string,
    format: 'pdf' | 'xlsx' | 'docx' | 'csv' | 'html',
    data: ReportData[],
    params?: ReportParams
  ): Promise<Blob> => {
    try {
      const response = await api.post(`/reports/${reportName}/generate-with-data`, 
        data,
        {
          params: {
            format,
            ...(params && { params: JSON.stringify(params) })
          },
          responseType: 'blob' // Important pour télécharger les fichiers
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la génération du rapport ${reportName} avec données au format ${format}:`, error);
      throw error;
    }
  },

  /**
   * Télécharge un rapport généré
   */
  downloadReport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};