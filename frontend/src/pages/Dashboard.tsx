import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  DollarSign,
  PieChart,
  Calendar,
  FileText,
  Percent,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';
import api from '../services/api.service';
import { MapChart } from '../components/MapChart';

export const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { language } = useTheme();
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/dashboard/stats');
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">{t.loadingDashboard}</p>
      </div>
    );
  }

  const stats = [
    { 
      label: t.teachersPresent,
      value: data.stats.teachersPresent.value, 
      change: data.stats.teachersPresent.change,
      isPositive: data.stats.teachersPresent.isPositive,
      icon: Users, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      iconBg: 'bg-emerald-100'
    },
    { 
      label: t.studentsEnrolled,
      value: data.stats.studentsEnrolled.value, 
      change: data.stats.studentsEnrolled.change,
      isPositive: data.stats.studentsEnrolled.isPositive,
      icon: GraduationCap, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      iconBg: 'bg-blue-100'
    },
    { 
      label: t.latesToday,
      value: data.stats.latesToday.value, 
      change: data.stats.latesToday.change,
      isPositive: data.stats.latesToday.isPositive,
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      iconBg: 'bg-amber-100'
    },
    { 
      label: t.paymentAlerts,
      value: data.stats.paymentAlerts.value, 
      change: data.stats.paymentAlerts.change,
      isPositive: data.stats.paymentAlerts.isPositive,
      icon: AlertCircle, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      iconBg: 'bg-rose-100'
    },
  ];

  const financialStats = [
    {
      label: t.totalReceived,
      value: data.financialStats.totalReceived.value,
      subValue: data.financialStats.totalReceived.subValue,
      change: data.financialStats.totalReceived.change,
      isPositive: data.financialStats.totalReceived.isPositive,
      icon: DollarSign,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-100'
    },
    {
      label: t.amountRemaining,
      value: data.financialStats.amountRemaining.value,
      subValue: data.financialStats.amountRemaining.subValue,
      change: data.financialStats.amountRemaining.change,
      isPositive: data.financialStats.amountRemaining.isPositive,
      icon: FileText,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      label: t.recoveryRate,
      value: data.financialStats.recoveryRate.value,
      subValue: data.financialStats.recoveryRate.subValue,
      change: data.financialStats.recoveryRate.change,
      isPositive: data.financialStats.recoveryRate.isPositive,
      icon: Percent,
      color: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    {
      label: t.penalties,
      value: data.financialStats.penalties.value,
      subValue: data.financialStats.penalties.subValue,
      change: data.financialStats.penalties.change,
      isPositive: data.financialStats.penalties.isPositive,
      icon: AlertCircle,
      color: 'text-rose-600',
      iconBg: 'bg-rose-100'
    },
  ];

  const classSummary = data.classSummary;
  const latePayments = data.latePayments;
  const moratoires = data.moratoires;
  const recentAttendance = data.recentAttendance;
  const attendanceData = data.attendanceData;
  const paymentData = data.paymentData;

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5 uppercase tracking-tight">{t.dashboard}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.welcome}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-sm"
          title={t.actualizeData}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Stats Cards avec style BanCo */}
      <div 
        style={{ gap: 'var(--card-spacing)' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-5"
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index} 
              className="banco-stat-card rounded-xl p-4 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between min-h-[88px]">
                <div className="flex flex-col justify-between">
                  <div className={`p-2 rounded-md ${stat.iconBg} mb-3 flex items-center justify-center`} style={{ width: '40px', height: '40px' }}>
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
                    {stat.value}
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 text-xs font-bold font-inter ${
                  stat.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {stat.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
        {/* Carte géographique de Douala */}
        <div 
          className="banco-stat-card rounded-xl p-4 transition-all duration-300 cursor-pointer"
          style={{ gridColumn: 'span 4', height: '300px' }}
        >
          <div className="h-full">
            <MapChart />
          </div>
        </div>
      </div>

      {/* Financial Overview Section avec style BanCo - Design sans dégradé ni bordure spéciale */}
      <div 
        style={{ padding: 'var(--card-spacing)', marginBottom: 'var(--card-spacing)' }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
      >
        <div 
          style={{ marginBottom: 'var(--card-spacing)' }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-gray-900 dark:text-white text-base font-bold mb-0.5 font-inter">{t.financialOverview}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] font-inter">{t.financialManagement}</p>
          </div>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white text-gray-800 border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium font-inter"
          >
            <option value="week">{t.thisWeek}</option>
            <option value="month">{t.thisMonth}</option>
            <option value="year">{t.thisYear}</option>
          </select>
        </div>
        <div 
          style={{ gap: 'calc(var(--card-spacing) * 0.75)' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        >
          {financialStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                style={{ padding: 'calc(var(--card-spacing) * 0.75)' }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-md bg-gray-100 dark:bg-slate-700`}>
                    <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold font-inter ${
                    stat.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {stat.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase opacity-80 font-inter">{stat.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900 dark:text-white font-inter">{stat.value}</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-inter">{stat.subValue}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carte géographique de Douala */}
      <div className="banco-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">Localisation géographique - Douala</h3>
        </div>
        <div style={{ height: '400px' }}>
          <MapChart />
        </div>
      </div>

      <div 
        style={{ gap: 'var(--card-spacing)', marginBottom: 'var(--card-spacing)' }}
        className="grid grid-cols-1 xl:grid-cols-2"
      >
        {/* Class Payment Summary avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">{t.recoveryByClass}</h3>
            <button className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors font-inter">
              {t.details} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {classSummary.map((item, i) => (
              <div key={i} className="pb-4 border-b border-gray-200 dark:border-slate-700 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.class}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.students} {t.studentsLowerCase}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-inter ${
                      item.rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : item.rate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {item.rate}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-inter">{t.paid}: {(item.paid / 1000000).toFixed(1)}M FCFA</span>
                  <span className="text-gray-400 dark:text-gray-500 font-inter">{t.remaining}: {((item.due - item.paid) / 1000000).toFixed(1)}M FCFA</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Late Payments & Penalties avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">{t.latePayments}</h3>
            <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-900/70 text-rose-600 dark:text-rose-400 rounded-full font-bold font-inter">{latePayments.length} {t.cases}</span>
          </div>
          <div className="space-y-4">
            {latePayments.map((item, i) => (
              <div key={i} className="pb-4 border-b border-gray-200 dark:border-slate-700 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                  </div>
                  <div className="text-xs px-2.5 py-1 bg-rose-50 dark:bg-rose-900/70 text-rose-600 dark:text-rose-400 rounded font-bold font-inter">
                    {item.days}{t.daysLate}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-inter">
                    {t.amount}: <span className="font-bold text-gray-900 dark:text-white">{(item.amount / 1000).toFixed(0)}K FCFA</span>
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold font-inter">
                    +{(item.penalty / 1000).toFixed(0)}K {t.penalty}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Moratoires & Partial Payments avec style BanCo */}
      <div 
        style={{ gap: 'var(--card-spacing)', marginBottom: 'var(--card-spacing)' }}
        className="grid grid-cols-1 xl:grid-cols-2"
      >
        {/* Moratoires */}
        <div className="banco-card rounded-xl p-6">
          <div 
            style={{ marginBottom: 'var(--card-spacing)' }}
            className="flex items-center justify-between"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">{t.grantedMoratoria}</h3>
            <span className="text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-900/70 text-amber-600 dark:text-amber-400 rounded-full font-bold font-inter">{moratoires.length} {t.active}</span>
          </div>
          <div style={{ gap: 'var(--card-spacing)' }} className="flex flex-col">
            {moratoires.map((item, i) => (
              <div 
                key={i} 
                style={{ padding: 'calc(var(--card-spacing) * 0.75)' }}
                className="bg-amber-50 dark:bg-amber-900 rounded-xl border border-amber-100 dark:border-amber-900"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{(item.amount / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">FCFA</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-gray-600 dark:text-gray-400 font-inter">Nouvelle échéance: <span className="font-bold text-amber-600 dark:text-amber-400">{item.newDate}</span></span>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic font-inter">{item.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Partial Payments Tracking avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <div 
            style={{ marginBottom: 'var(--card-spacing)' }}
            className="flex items-center justify-between"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">{t.partialPayments}</h3>
            <button className="text-xs text-primary hover:text-primary-dark font-semibold border border-gray-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors font-inter">{t.manage}</button>
          </div>
          <div style={{ gap: 'calc(var(--card-spacing) * 0.5)' }} className="flex flex-col">
            {[
              { name: 'Bamba Soro', class: 'Terminale C', total: 500000, paid: 350000, installments: 3, lastDate: '20/01/2026' },
              { name: 'Koffi Adjoa', class: '1ère D', total: 450000, paid: 200000, installments: 2, lastDate: '15/01/2026' },
              { name: 'Touré Issa', class: '2nde A', total: 380000, paid: 150000, installments: 2, lastDate: '10/01/2026' },
            ].map((item, i) => (
              <div 
                key={i} 
                style={{ padding: 'calc(var(--card-spacing) * 0.5)' }}
                className="bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                  </div>
                  <div className="text-xs px-2.5 py-1 bg-primary-light dark:bg-primary-dark text-primary font-bold font-inter">
                    {item.installments} {t.installments}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${(item.paid / item.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-inter">
                    {((item.paid / item.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-inter">{(item.paid / 1000).toFixed(0)}K / {(item.total / 1000).toFixed(0)}K FCFA</span>
                  <span className="text-gray-400 dark:text-gray-500 font-inter">Dernier: {item.lastDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div 
        style={{ gap: 'var(--card-spacing)', marginBottom: 'var(--card-spacing)' }}
        className="grid grid-cols-1 lg:grid-cols-3"
      >
        {/* Attendance Chart avec style BanCo */}
        <div className="lg:col-span-2 banco-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">Présences de la semaine</h3>
            <button className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 border border-gray-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors font-inter">
              {t.seeMore} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(34, 197, 94, 0.1)'}}
                />
                <Bar dataKey="presents" fill="var(--primary)" name="PRÉSENTS" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="retard" fill="#f59e0b" name="EN RETARD" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <div 
            style={{ marginBottom: 'var(--card-spacing)' }}
            className="flex items-center justify-between"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">Derniers pointages</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium font-inter">{t.today}</span>
          </div>
          <div style={{ gap: 'var(--card-spacing)' }} className="flex flex-col">
            {recentAttendance.map((item, i) => (
              <div 
                key={i} 
                style={{ paddingBottom: 'calc(var(--card-spacing) * 0.75)' }}
                className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 last:border-0 last:pb-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'PRESENT' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white font-inter">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.subject}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.time}</div>
                  <div className={`text-xs font-bold font-inter ${
                    item.status === 'PRESENT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {item.status === 'PRESENT' ? t.onTime : t.late}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Payments Chart avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">Recouvrement des frais (FCFA)</h3>
            <select className="text-xs border border-gray-300 dark:border-slate-600 bg-transparent rounded-lg px-3 py-1.5 font-medium text-gray-600 dark:text-gray-400 font-inter">
              <option>{t.thisMonth}</option>
              <option>{t.lastMonth}</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(34, 197, 94, 0.1)'}} />
                <Line type="monotone" dataKey="total" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" name="TOTAL DÛ" dot={false} />
                <Line type="monotone" dataKey="paye" stroke="var(--primary)" strokeWidth={3} name="TOTAL PAYÉ" dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions avec style BanCo */}
        <div className="banco-card rounded-xl p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 font-inter">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary hover:bg-primary-light dark:hover:bg-primary-dark transition-all text-left group">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary mb-1 font-inter">{t.newTeacher}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-inter">{t.addToSystem}</div>
            </button>
            <button className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-all text-left group">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-1 font-inter">{t.generateReport}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-inter">{t.exportPdfExcel}</div>
            </button>
            <button className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900 transition-all text-left group">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 mb-1 font-inter">{t.collectFees}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-inter">{t.studentPayment}</div>
            </button>
            <button className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 transition-all text-left group">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-1 font-inter">{t.configureK40}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-inter">{t.terminalBio}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
