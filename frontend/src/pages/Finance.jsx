import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/api';
import InvoiceButton from '../components/InvoiceButton';

export default function Finance() {
  const [report, setReport] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', method: 'CASH' });
  const [lastPayment, setLastPayment] = useState(null); // To show print button after payment

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await financeApi.get('/reports/global');
      setReport(res.data);
    } catch (err) {
      console.error("Erreur finance", err);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await financeApi.post('/payments', {
        studentFeeId: parseInt(paymentForm.studentId),
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        userId: 1
      });
      
      alert('Paiement enregistré !');
      setLastPayment({ ...paymentForm }); // Save for printing
      loadReport();
      setPaymentForm({ studentId: '', amount: '', method: 'CASH' });
    } catch (err) {
      alert('Erreur enregistrement paiement');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Gestion Financière</h1>

      {/* Report Summary */}
      {report && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
            <h3>Total Attendu</h3>
            <p className="text-2xl font-bold">{report.total_expected || 0} FCFA</p>
          </div>
          <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <h3>Total Encaissé</h3>
            <p className="text-2xl font-bold">{report.total_collected || 0} FCFA</p>
          </div>
          <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
            <h3>Reste à Recouvrer</h3>
            <p className="text-2xl font-bold">{report.total_outstanding || 0} FCFA</p>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <div className="bg-white p-6 rounded shadow max-w-md">
        <h2 className="text-xl font-bold mb-4">Nouveau Paiement</h2>
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">ID Étudiant (Fee ID)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              value={paymentForm.studentId}
              onChange={e => setPaymentForm({...paymentForm, studentId: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Montant</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Méthode</label>
            <select 
              className="w-full p-2 border rounded"
              value={paymentForm.method}
              onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
            >
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="BANK_TRANSFER">Virement</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Encaisser
            </button>
            
            {/* Show Print Button only after successful payment */}
            {lastPayment && (
                <InvoiceButton 
                    paymentData={lastPayment} 
                    studentName={`Étudiant #${lastPayment.studentId}`} 
                />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}