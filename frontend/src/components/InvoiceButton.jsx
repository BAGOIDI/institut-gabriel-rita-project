import React, { useState } from 'react';
import axios from 'axios';

export default function InvoiceButton({ paymentData, studentName }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Call the Python Report Service
      const response = await axios.post('http://localhost:8000/generate-invoice', {
        invoice_number: `INV-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        student_name: studentName || "Étudiant Inconnu",
        student_id: paymentData.studentId || "N/A",
        items: [
          { description: "Frais de Scolarité", amount: parseFloat(paymentData.amount) }
        ],
        total_amount: parseFloat(paymentData.amount),
        paid_amount: parseFloat(paymentData.amount),
        balance_due: 0, // In a real app, fetch this from finance service
        payment_method: paymentData.method
      }, {
        responseType: 'blob' // Important for PDF download
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${paymentData.studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur impression", err);
      alert("Impossible de générer la facture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePrint} 
      disabled={loading}
      className={`ml-2 px-3 py-1 text-sm text-white rounded ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
    >
      {loading ? 'Génération...' : '🖨️ Imprimer Reçu'}
    </button>
  );
}