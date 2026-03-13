import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../services/api';
import InvoiceButton from '../components/InvoiceButton';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';

const METHOD_ICONS = {
  CASH: Banknote,
  BANK_TRANSFER: CreditCard,
  MOBILE_MONEY: Smartphone,
};

const METHOD_LABELS = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  MOBILE_MONEY: 'Mobile Money',
};

const METHOD_STYLES = {
  CASH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BANK_TRANSFER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MOBILE_MONEY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function Finance() {
  const [report, setReport] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  
  const [formData, setFormData] = useState({
    studentFeeId: '',
    amount: '',
    method: 'CASH',
    userId: 1
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, paymentsRes] = await Promise.all([
        financeApi.get('/reports/global'),
        financeApi.get('/payments')
      ]);
      setReport(reportRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openModal = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        studentFeeId: payment.student_fee_id?.toString() || '',
        amount: payment.amount_paid?.toString() || '',
        method: payment.payment_method || 'CASH',
        userId: payment.recorded_by || 1
      });
    } else {
      setEditingPayment(null);
      setFormData({
        studentFeeId: '',
        amount: '',
        method: 'CASH',
        userId: 1
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setFormData({
      studentFeeId: '',
      amount: '',
      method: 'CASH',
      userId: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        studentFeeId: parseInt(formData.studentFeeId),
        amount: parseFloat(formData.amount),
        method: formData.method,
        userId: parseInt(formData.userId) || 1
      };

      if (editingPayment) {
        await financeApi.put(`/payments/${editingPayment.id}`, payload);
      } else {
        const res = await financeApi.post('/payments', payload);
        setLastPayment({ ...formData, id: res.data.id });
      }

      closeModal();
      await loadData();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      alert(`Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    
    setLoading(true);
    try {
      await financeApi.delete(`/payments/${id}`);
      await loadData();
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(`Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Gestion Financière
        </h1>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau Paiement
          </button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendu</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatAmount(report.total_expected)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Encaissé</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAmount(report.total_collected)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reste à Recouvrer</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatAmount(report.total_outstanding)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Historique des Paiements ({payments.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Étudiant (Fee ID)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Méthode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Enregistré par</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => {
                const MethodIcon = METHOD_ICONS[payment.payment_method] || Banknote;
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">#{payment.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      #{payment.student_fee_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {formatAmount(payment.amount_paid)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${METHOD_STYLES[payment.payment_method]}`}>
                        <MethodIcon className="w-3 h-3" />
                        {METHOD_LABELS[payment.payment_method]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      User #{payment.recorded_by}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(payment)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {lastPayment?.id === payment.id && (
                          <InvoiceButton 
                            paymentData={{
                              studentFeeId: payment.student_fee_id,
                              amount: payment.amount_paid,
                              method: payment.payment_method
                            }} 
                            studentName={`Étudiant Fee #${payment.student_fee_id}`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun paiement enregistré
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Student Fee *
                </label>
                <input
                  type="number"
                  required
                  value={formData.studentFeeId}
                  onChange={e => setFormData({...formData, studentFeeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Entrez l'ID du frais étudiant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Entrez le montant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Méthode de Paiement *
                </label>
                <select
                  required
                  value={formData.method}
                  onChange={e => setFormData({...formData, method: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="CASH">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Utilisateur
                </label>
                <input
                  type="number"
                  value={formData.userId}
                  onChange={e => setFormData({...formData, userId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="ID de l'utilisateur"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Enregistrement...' : (editingPayment ? 'Mettre à jour' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}