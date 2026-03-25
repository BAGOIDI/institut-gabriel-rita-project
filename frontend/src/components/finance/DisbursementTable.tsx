import React from 'react';
import { Upload, RefreshCw, XCircle, Trash2 } from 'lucide-react';

interface DisbursementTableProps {
  disbursements: any[];
  loading: boolean;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
  onNewDisbursement: () => void;
  onCancel: (id: number) => void;
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
}

export const DisbursementTable: React.FC<DisbursementTableProps> = ({
  disbursements,
  loading,
  formatAmount,
  formatDate,
  onNewDisbursement,
  onCancel,
  onRestore,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs font-bold text-gray-500">Chargement des décaissements...</p>
      </div>
    );
  }

  if (disbursements.length === 0) {
    return (
      <div className="py-20 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Historique des Décaissements</h3>
        <p className="text-xs text-gray-500">Salaires, fournitures, maintenance, etc.</p>
        <button 
          onClick={onNewDisbursement}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors uppercase active:scale-95 shadow-md"
        >
          Nouveau Décaissement
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
          <tr>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Bénéficiaire</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Montant</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Date</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Statut</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {disbursements.map(d => {
            const isCancelled = d.status === 'CANCELLED';
            return (
              <tr key={d.id} className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors ${isCancelled ? 'opacity-50 grayscale bg-gray-50/30' : ''}`}>
                <td className="px-4 py-4 text-xs font-bold text-gray-400">#{d.id}</td>
                <td className="px-4 py-4">
                  <p className={`text-xs font-black text-gray-900 dark:text-white ${isCancelled ? 'line-through' : ''}`}>{d.beneficiaryName}</p>
                  <p className="text-[10px] text-gray-500">{d.description || 'Pas de description'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                    {d.type}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-black ${isCancelled ? 'text-gray-400 line-through' : 'text-rose-600'}`}>
                    {formatAmount(d.amount)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">
                  {formatDate(d.paymentDate)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isCancelled ? 'Annulé' : 'Actif'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!isCancelled && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Voulez-vous vraiment ANNULER ce décaissement ?')) {
                            onCancel(d.id);
                          }
                        }}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-100 dark:border-orange-800"
                        title="Annuler le décaissement"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isCancelled && (
                      <>
                        <button 
                          onClick={() => {
                            if (window.confirm('Voulez-vous vraiment RESTAURER ce décaissement ?')) {
                              onRestore(d.id);
                            }
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800"
                          title="Restaurer le décaissement"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(d.id)}
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
