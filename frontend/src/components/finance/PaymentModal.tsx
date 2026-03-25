import React from 'react';
import { Plus, X, Search, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  show: boolean;
  editingPayment: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  studentSearch: string;
  onStudentSearch: (query: string) => void;
  showStudentDropdown: boolean;
  studentResults: any[];
  onSelectStudent: (student: any) => void;
  selectedStudent: any;
  fees: any[];
  selectedFee: any;
  onSelectFee: (fee: any) => void;
  onInitializeFee: () => void;
  initializingFee: boolean;
  paymentForm: any;
  onFormChange: (field: string, value: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  editingPayment,
  onClose,
  onSubmit,
  studentSearch,
  onStudentSearch,
  showStudentDropdown,
  studentResults,
  onSelectStudent,
  selectedStudent,
  fees,
  selectedFee,
  onSelectFee,
  onInitializeFee,
  initializingFee,
  paymentForm,
  onFormChange
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {editingPayment ? 'Modifier Encaissement' : 'Nouvel Encaissement'}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Enregistrement d'un paiement de scolarité</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-5">
          {!editingPayment && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Étudiant *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => onStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Nom, prénom ou matricule..."
                />
                {showStudentDropdown && studentResults.length > 0 && (
                  <div className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {studentResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onSelectStudent(s)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
                            {(s.firstName?.[0] || '')}{(s.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white">
                              {[s.firstName, s.lastName].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">
                              {s.matricule || 'N/A'} {s.classRoom ? `• ${s.classRoom}` : ''}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedStudent && fees.length === 0 && !editingPayment && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">Aucun frais trouvé pour cet étudiant</p>
                    <p className="text-[10px]">Veuillez d'abord configurer la scolarité de cet élève.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  disabled={initializingFee}
                  onClick={onInitializeFee}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initializingFee ? 'Initialisation...' : 'Initialiser Scolarité'}
                </button>
              </div>
            </div>
          )}

          {selectedStudent && fees.length > 0 && !editingPayment && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Scolarité en cours</label>
              <select
                value={selectedFee?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const fee = fees.find(f => f.id === id);
                  onSelectFee(fee || null);
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold dark:text-white outline-none"
              >
                {fees.map(f => (
                  <option key={f.id} value={f.id}>
                    Frais #{f.id} - Reste: {f.remaining} FCFA / Total: {f.total_due} FCFA
                  </option>
                ))}
              </select>
              {selectedFee && Number(selectedFee.remaining) <= 0 && (
                <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Scolarité totalement soldée pour ce frais</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Montant (FCFA) *</label>
              <input
                type="number"
                required
                value={paymentForm.amount}
                onChange={(e) => onFormChange('amount', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 50000"
              />
              {selectedFee && (
                <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">Reste à payer: {selectedFee.remaining} FCFA</p>
              )}
            </div>
            <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mode *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => onFormChange('method', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date du paiement</label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => onFormChange('paymentDate', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Référence (Optionnel)</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => onFormChange('reference', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: N° Chèque, Ref Mobile..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pénalité (FCFA)</label>
              <input
                type="number"
                value={paymentForm.penalty}
                onChange={(e) => onFormChange('penalty', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Remise (FCFA)</label>
              <input
                type="number"
                value={paymentForm.discount}
                onChange={(e) => onFormChange('discount', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes / Description</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="printAutomatically"
              checked={paymentForm.printAutomatically}
              onChange={(e) => onFormChange('printAutomatically', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="printAutomatically" className="text-xs font-bold text-gray-700 dark:text-gray-300">Imprimer le reçu automatiquement</label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!editingPayment && selectedFee && Number(selectedFee.remaining) <= 0}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
            >
              {editingPayment ? 'Enregistrer les modifications' : 'Confirmer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
