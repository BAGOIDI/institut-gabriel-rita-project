import axios from 'axios';

const REPORT_SERVICE_BASE_URL = import.meta.env.VITE_REPORT_SERVICE_URL || 'http://localhost:8000';

const reportService = {
  async generateScheduleReport(scheduleData: any, format: 'pdf' | 'xlsx' | 'docx' | 'csv' | 'html' = 'pdf') {
    try {
      // Utiliser l'endpoint direct du report-service pour les emplois du temps
      const className = scheduleData.filter || scheduleData.class || '';
      const response = await axios.get(
        `${REPORT_SERVICE_BASE_URL}/api/reports/schedule/${className}`,
        {
          responseType: 'blob',
        }
      );
      
      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const fileName = `emploi_du_temps_${className}.pdf`;
      
      // Télécharger le fichier
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Nettoyer l'URL objet
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await axios.get(`${REPORT_SERVICE_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état du service de rapports:', error);
      throw error;
    }
  }
};

function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'csv':
      return 'text/csv';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
}

export default reportService;