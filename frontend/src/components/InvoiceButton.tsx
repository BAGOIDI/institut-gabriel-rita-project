import React, { useState } from 'react';
import { Printer, RefreshCw, ChevronDown } from 'lucide-react';
import { reportsApi } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { ReportService } from '../services/report.service';

interface InvoiceButtonProps {
  paymentId: number;
  reference?: string;
}

export const InvoiceButton: React.FC<InvoiceButtonProps> = ({ paymentId, reference }) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const notify = useNotification();

  const handlePrintPDF = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.get(`/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      
      // Utiliser directement response.data qui est déjà un blob
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      // Pour les téléchargements forcés, on peut utiliser un lien caché
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', reference ? `recu_${reference}.pdf` : `recu_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      notify.success('Facture PDF téléchargée');
    } catch (error) {
      console.error('Erreur PDF:', error);
      notify.error('Impossible de générer le PDF');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handlePrintTXT = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.get(`/invoice-txt/${paymentId}`);
      const textContent = response.data;

      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`<pre>${textContent}</pre>`);
      printWindow?.document.close();
      printWindow?.print();

      notify.success('Reçu texte généré');
    } catch (error) {
      console.error('Erreur TXT:', error);
      notify.error('Impossible de générer le reçu texte');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Imprimer le reçu"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <a href="#" onClick={handlePrintPDF} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">Imprimer (PDF)</a>
            <a href="#" onClick={handlePrintTXT} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">Imprimer (Texte)</a>
          </div>
        </div>
      )}
    </div>
  );
};
