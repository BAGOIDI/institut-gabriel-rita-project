import React from 'react';
import { Upload, X, Search } from 'lucide-react';

interface DisbursementModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  teacherSearch: string;
  onTeacherSearch: (query: string) => void;
  showTeacherDropdown: boolean;
  teacherResults: any[];
  onSelectTeacher: (teacher: any) => void;
  disbursementForm: any;
  onFormChange: (field: string, value: any) => void;
}

export const DisbursementModal: React.FC<DisbursementModalProps> = ({
  show,
  onClose,
  onSubmit,
  teacherSearch,
  onTeacherSearch,
  showTeacherDropdown,
  teacherResults,
  onSelectTeacher,
  disbursementForm,
  onFormChange
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Nouveau Décaissement</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Sortie de caisse, salaire ou frais divers</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Type de décaissement *</label>
                  <select
                    value={disbursementForm.type}
                    onChange={(e) => onFormChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="SALARY">Salaire / Payroll</option>
                    <option value="SUPPLIES">Fournitures / Matériel</option>
                    <option value="MAINTENANCE">Maintenance / Travaux</option>
                    <option value="RENT">Loyer / Charges</option>
                    <option value="OTHER">Autre dépense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Montant (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={disbursementForm.amount}
                    onChange={(e) => onFormChange('amount', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ex: 150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Rechercher Enseignant / Staff (Optionnel)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => onTeacherSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                    placeholder="Nom de l'enseignant..."
                  />
                  {showTeacherDropdown && teacherResults.length > 0 && (
                    <div className="absolute z-[110] w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {teacherResults.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelectTeacher(t)}
                          className="w-full px-4 py-3 text-left hover:bg-rose-50 dark:hover:bg-rose-900/20 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
                              {(t.firstName?.[0] || '')}{(t.lastName?.[0] || '')}
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white">
                                {[t.firstName, t.lastName].filter(Boolean).join(' ')}
                              </p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase">
                                {t.biometricId || t.id} {t.subject ? `• ${t.subject}` : ''}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nom du Bénéficiaire *</label>
                <input
                  type="text"
                  required
                  value={disbursementForm.beneficiaryName}
                  onChange={(e) => onFormChange('beneficiaryName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Période / Mois</label>
                  <input
                    type="text"
                    value={disbursementForm.period}
                    onChange={(e) => onFormChange('period', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ex: Mars 2024"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date du décaissement</label>
                  <input
                    type="date"
                    value={disbursementForm.paymentDate}
                    onChange={(e) => onFormChange('paymentDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mode de Paiement</label>
                  <select
                    value={disbursementForm.paymentMethod}
                    onChange={(e) => onFormChange('paymentMethod', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Référence</label>
                  <input
                    type="text"
                    value={disbursementForm.reference}
                    onChange={(e) => onFormChange('reference', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="N° Chèque, Ref Virement..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description / Détails</label>
                <textarea
                  value={disbursementForm.description}
                  onChange={(e) => onFormChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none"
                  placeholder="Ex: Paiement du salaire de l'enseignant..."
                />
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
                  className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-500/30 transition-all uppercase active:scale-95"
                >
                  Enregistrer le décaissement
                </button>
              </div>
            </form>
      </div>
    </div>
  );
};
