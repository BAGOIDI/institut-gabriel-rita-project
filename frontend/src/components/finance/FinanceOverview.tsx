import React from 'react';
import { LayoutGrid, TrendingUp, Users, Calendar, FileText, Banknote, CreditCard, Smartphone, User, ChevronRight } from 'lucide-react';
import RevenueChart from '../RevenueChart';

interface FinanceOverviewProps {
  stats: any;
  payments: any[];
  disbursements: any[];
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
  setActiveTab: (tab: any) => void;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  stats,
  payments,
  disbursements,
  formatAmount,
  formatDate,
  setActiveTab
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Taux de Recouvrement</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-black text-blue-600">{stats ? Math.round(stats.collectionRate) : 0}%</p>
            <p className="text-[10px] font-bold text-gray-400 mb-1">du total attendu</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000" 
              style={{ width: `${stats ? Math.min(100, stats.collectionRate) : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Élèves en Règle</p>
          <p className="text-2xl font-black text-emerald-600">{stats ? stats.fullyPaidCount : 0}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Scolarité payée à 100%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paiements Partiels</p>
          <p className="text-2xl font-black text-orange-600">{stats ? stats.partiallyPaidCount : 0}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">En cours de règlement</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reste à Collecter</p>
          <p className="text-2xl font-black text-rose-600">
            {stats ? formatAmount(stats.totalExpected - stats.totalCollected) : '...'}
          </p>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Dette globale élèves</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphique de revenus */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Évolution des Encaissements</h3>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700 h-[300px]">
            <RevenueChart 
              data={stats?.monthlyData?.map((d: any) => d.amount) || []} 
              labels={stats?.monthlyData?.map((d: any) => d.month) || []} 
            />
          </div>
        </div>

        {/* Répartition par mode */}
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Répartition par Mode</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Espèces</p>
              </div>
              <p className="text-lg font-black text-emerald-900 dark:text-emerald-400">{stats ? formatAmount(stats.cashPayments) : '0'}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <p className="text-[10px] font-bold text-blue-700 uppercase">Virement</p>
              </div>
              <p className="text-lg font-black text-blue-900 dark:text-blue-400">{stats ? formatAmount(stats.bankTransfers) : '0'}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <p className="text-[10px] font-bold text-purple-700 uppercase">Mobile</p>
              </div>
              <p className="text-lg font-black text-purple-900 dark:text-purple-400">{stats ? formatAmount(stats.mobileMoney) : '0'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Derniers Encaissements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Derniers Encaissements</h3>
            <button onClick={() => setActiveTab('encaissements')} className="text-xs font-bold text-blue-600 hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {payments.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {p.student ? `${p.student.firstName} ${p.student.lastName}` : (p.studentName || p.student_name || 'Inconnu')}
                    </p>
                    <p className="text-[10px] text-gray-500">{formatDate(p.paymentDate || p.payment_date)}</p>
                  </div>
                </div>
                <p className="text-xs font-black text-emerald-600">+{formatAmount(p.amountPaid || p.amount_paid)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers Décaissements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Derniers Décaissements</h3>
            <button onClick={() => setActiveTab('decaissements')} className="text-xs font-bold text-rose-600 hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {disbursements.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {d.beneficiaryName || 'Bénéficiaire inconnu'}
                    </p>
                    <p className="text-[10px] text-gray-500">{formatDate(d.paymentDate || d.payment_date)}</p>
                  </div>
                </div>
                <p className="text-xs font-black text-rose-600">-{formatAmount(d.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
