import React from 'react';
import { User, Banknote, CreditCard, Smartphone, Edit2, Trash2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { InvoiceButton } from '../InvoiceButton';

interface PaymentTableProps {
  payments: any[];
  loading: boolean;
  onEdit: (payment: any) => void;
  onCancel: (id: number) => void;
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

const METHOD_ICONS: Record<string, any> = {
  CASH: Banknote,
  BANK_TRANSFER: CreditCard,
  MOBILE_MONEY: Smartphone,
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  MOBILE_MONEY: 'Mobile Money',
};

const METHOD_STYLES: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BANK_TRANSFER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MOBILE_MONEY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const PaymentTable: React.FC<PaymentTableProps> = ({ 
  payments, 
  loading, 
  onEdit, 
  onCancel, 
  onRestore, 
  onDelete, 
  formatAmount, 
  formatDate 
}) => {
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-gray-500">Chargement des transactions...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-20 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Aucune transaction trouvée</h3>
        <p className="text-xs text-gray-500">Essayez de modifier vos filtres ou la date sélectionnée.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
          <tr>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Étudiant</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Montant</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Mode</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Date</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Statut</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {payments.map(p => {
            const methodKey = p.paymentMethod || 'CASH';
            const MethodIcon = METHOD_ICONS[methodKey] || Banknote;
            const isCancelled = p.status === 'CANCELLED';
            return (
              <tr key={p.id} className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors ${isCancelled ? 'opacity-50 grayscale bg-gray-50/30' : ''}`}>
                <td className="px-4 py-4 text-xs font-bold text-gray-400">#{p.id}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-black text-gray-900 dark:text-white ${isCancelled ? 'line-through' : ''}`}>
                        {p.studentName || p.student_name || (p.student ? `${p.student.firstName} ${p.student.lastName}` : 'N/A')}
                      </p>
                      <p className="text-[10px] text-gray-500">{p.studentMatricule || p.student_matricule || p.student?.matricule || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-black ${isCancelled ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                    {formatAmount(p.amountPaid || p.amount_paid)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${METHOD_STYLES[methodKey]}`}>
                    <MethodIcon className="w-3 h-3" />
                    {METHOD_LABELS[methodKey]}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">
                  {(p.paymentDate || p.payment_date) ? formatDate(p.paymentDate || p.payment_date) : 'N/A'}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isCancelled ? 'Annulé' : 'Actif'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <InvoiceButton 
                      paymentId={Number(p.id)}
                      reference={p.reference}
                      disabled={isCancelled}
                    />
                    {!isCancelled && (
                      <>
                        <button 
                          onClick={() => onEdit(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-100 dark:border-blue-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Voulez-vous vraiment ANNULER ce paiement ?')) {
                              onCancel(p.id);
                            }
                          }}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-100 dark:border-orange-800"
                          title="Annuler le paiement"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isCancelled && (
                      <>
                        <button 
                          onClick={() => {
                            if (window.confirm('Voulez-vous vraiment RESTAURER ce paiement ?')) {
                              onRestore(p.id);
                            }
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800"
                          title="Restaurer le paiement"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-rose-100 dark:border-rose-800"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
