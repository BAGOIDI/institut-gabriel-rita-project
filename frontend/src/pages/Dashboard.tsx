import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, GraduationCap, Clock, AlertCircle,
  TrendingUp, TrendingDown, ArrowUpRight, DollarSign,
  PieChart, Calendar, FileText, Percent, RefreshCw,
  Wifi, WifiOff, Activity, ChevronRight, UserPlus,
  BarChart2, CreditCard, Settings,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';
import DashboardService, { DashboardStats } from '../services/dashboard.service';

// ─── WebSocket URL (same host, service-dashboard port) ───────────────────────
const WS_URL = (import.meta.env.VITE_DASHBOARD_WS_URL as string) || 'http://localhost:3003';

// ─── Small reusable components ────────────────────────────────────────────────

const Pill = ({ value, isPositive }: { value: string; isPositive: boolean }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold font-inter px-2 py-0.5 rounded-full ${
    isPositive ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
               : 'bg-rose-50    dark:bg-rose-900/40    text-rose-600    dark:text-rose-400'
  }`}>
    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
    {value}
  </span>
);

const SectionTitle = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white font-inter">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-inter">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const ViewMoreBtn = ({ label = 'Voir plus' }: { label?: string }) => (
  <button className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors font-inter">
    {label} <ArrowUpRight className="w-3 h-3" />
  </button>
);

// ─── Skeleton loader ─────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
);

// ─── Main Dashboard component ─────────────────────────────────────────────────
export const Dashboard = () => {
  const { language } = useTheme();
  const t = translations[language];

  const [data, setData]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const wsRef = useRef<any>(null);

  // ── Fetch stats from service-dashboard ───────────────────────────────────
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await DashboardService.getStats();
      setData(result);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger le tableau de bord');
      console.error('[Dashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── WebSocket connection (Socket.IO via service-dashboard) ────────────────
  useEffect(() => {
    let socket: any = null;
    const connectWS = async () => {
      try {
        // Dynamically import socket.io-client to avoid SSR issues
        const { io } = await import('socket.io-client').catch(() => ({ io: null }));
        if (!io) return;

        socket = io(WS_URL, { transports: ['websocket'], reconnectionAttempts: 5 });
        wsRef.current = socket;

        socket.on('connect',    () => setWsConnected(true));
        socket.on('disconnect', () => setWsConnected(false));

        // Real-time events → silent refresh
        socket.on('payment_update',   () => fetchStats(true));
        socket.on('attendance_update',() => fetchStats(true));
        socket.on('stats_refresh',    () => fetchStats(true));
      } catch {
        // socket.io-client not installed or unreachable — silent fail
      }
    };

    connectWS();
    return () => { socket?.disconnect(); };
  }, [fetchStats]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const kpiCards = data ? [
    { label: t.teachersPresent,  stat: data.stats.teachersPresent,  icon: Users,       color: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { label: t.studentsEnrolled, stat: data.stats.studentsEnrolled, icon: GraduationCap,color: 'text-blue-600',   iconBg: 'bg-blue-100    dark:bg-blue-900/40'    },
    { label: t.latesToday,       stat: data.stats.latesToday,       icon: Clock,       color: 'text-amber-600',  iconBg: 'bg-amber-100   dark:bg-amber-900/40'   },
    { label: t.paymentAlerts,    stat: data.stats.paymentAlerts,    icon: AlertCircle, color: 'text-rose-600',   iconBg: 'bg-rose-100    dark:bg-rose-900/40'    },
  ] : [];

  const finCards = data ? [
    { label: t.totalReceived,    stat: data.financialStats.totalReceived,   icon: DollarSign, color: 'text-emerald-600' },
    { label: t.amountRemaining,  stat: data.financialStats.amountRemaining, icon: FileText,   color: 'text-blue-600'   },
    { label: t.recoveryRate,     stat: data.financialStats.recoveryRate,    icon: Percent,    color: 'text-purple-600' },
    { label: t.penalties,        stat: data.financialStats.penalties,       icon: AlertCircle,color: 'text-rose-600'   },
  ] : [];

  return (
    <div className="w-full">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5 uppercase tracking-tight font-inter">
            {t.dashboard}
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-inter">{t.welcome}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* WS status indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium font-inter px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {wsConnected
              ? <><Wifi className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Temps réel</span></>
              : <><WifiOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">Hors ligne</span></>
            }
          </div>
          {/* Last refresh */}
          {lastRefresh && (
            <span className="text-[10px] text-gray-400 font-inter hidden sm:block">
              Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchStats()}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-sm disabled:opacity-50"
            title={t.actualizeData}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400 font-inter">Erreur de chargement</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 font-inter">{error}</p>
          </div>
          <button onClick={() => fetchStats()} className="ml-auto text-xs font-bold text-rose-600 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-inter">
            Réessayer
          </button>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="banco-stat-card rounded-xl p-4 min-h-[110px]">
                <Skeleton className="w-10 h-10 mb-3 rounded-md" />
                <Skeleton className="w-24 h-3 mb-2 rounded" />
                <Skeleton className="w-16 h-6 rounded" />
              </div>
            ))
          : kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="banco-stat-card rounded-xl p-4 transition-all duration-300 cursor-pointer hover:-translate-y-0.5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <div className={`p-2 rounded-md ${card.iconBg} mb-3 flex items-center justify-center w-10 h-10`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">
                        {card.label}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
                        {card.stat.value}
                      </div>
                    </div>
                    <Pill value={card.stat.change} isPositive={card.stat.isPositive} />
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* ── Financial Overview ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-gray-900 dark:text-white text-base font-bold font-inter">{t.financialOverview}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-inter">{t.financialManagement}</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium font-inter"
          >
            <option value="week">{t.thisWeek}</option>
            <option value="month">{t.thisMonth}</option>
            <option value="year">{t.thisYear}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <Skeleton className="w-10 h-10 mb-3 rounded-md" />
                  <Skeleton className="w-20 h-3 mb-2 rounded" />
                  <Skeleton className="w-24 h-6 rounded" />
                </div>
              ))
            : finCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-md bg-white dark:bg-slate-700 shadow-sm">
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <Pill value={card.stat.change} isPositive={card.stat.isPositive} />
                    </div>
                    <div className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">{card.label}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-gray-900 dark:text-white font-inter">{card.stat.value}</span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-inter">{card.stat.subValue}</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── Class Payment + Late Payments ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">

        {/* Class Summary */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle title={t.recoveryByClass} action={<ViewMoreBtn label={t.details} />} />
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-4">
              {data?.classSummary.map((item, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.class}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.students} {t.studentsLowerCase}</div>
                    </div>
                    <div className={`text-sm font-bold font-inter ${
                      item.rate >= 80 ? 'text-emerald-600' : item.rate >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>{item.rate}%</div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-inter">
                    <span className="text-gray-500">{t.paid}: {(item.paid / 1_000_000).toFixed(1)}M FCFA</span>
                    <span className="text-gray-400">{t.remaining}: {((item.due - item.paid) / 1_000_000).toFixed(1)}M FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Late Payments */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle
            title={t.latePayments}
            action={
              <span className="text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full font-bold font-inter">
                {data?.latePayments.length ?? 0} {t.cases}
              </span>
            }
          />
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : data?.latePayments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-inter">Aucun retard de paiement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.latePayments.map((item, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-inter truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded font-bold font-inter ml-2 flex-shrink-0">
                      {item.days}j
                    </span>
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
          )}
        </div>
      </div>

      {/* ── Moratoires + Partial Payments ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">

        {/* Moratoires */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle
            title={t.grantedMoratoria}
            action={
              <span className="text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full font-bold font-inter">
                {data?.moratoires.length ?? 0} {t.active}
              </span>
            }
          />
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.moratoires.map((item, i) => (
                <div key={i} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-inter truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{(item.amount / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-500 font-inter">FCFA</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1 font-inter">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Échéance: <span className="font-bold text-amber-600 dark:text-amber-400">{item.newDate}</span></span>
                  </div>
                  <div className="text-xs text-gray-400 italic font-inter">{item.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partial Payments */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle
            title={t.partialPayments}
            action={<button className="text-xs font-semibold border border-gray-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-inter text-gray-600 dark:text-gray-400">{t.manage}</button>}
          />
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.partialPayments.map((item, i) => {
                const pct = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
                return (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white font-inter truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">{item.class}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-primary-light dark:bg-primary-dark/40 text-primary font-bold rounded-full font-inter ml-2 flex-shrink-0">
                        {item.installments} tranches
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-inter w-10 text-right">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-inter">
                      <span className="text-gray-500">{(item.paid / 1000).toFixed(0)}K / {(item.total / 1000).toFixed(0)}K FCFA</span>
                      <span className="text-gray-400">Dernier: {item.lastDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Chart + Recent Pointages ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Bar Chart */}
        <div className="lg:col-span-2 banco-card rounded-xl p-5">
          <SectionTitle title="Présences de la semaine" action={<ViewMoreBtn label={t.seeMore} />} />
          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.attendanceData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: 'Inter' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 11 }} />
                  <Bar dataKey="presents" fill="var(--primary)" name="PRÉSENTS"  radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="retard"   fill="#f59e0b"         name="EN RETARD" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle title="Derniers pointages" subtitle={t.today} />
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.recentAttendance.map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'PRESENT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white font-inter truncate">{item.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-inter truncate">{item.subject}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm font-bold text-gray-900 dark:text-white font-inter">{item.time}</div>
                    <div className={`text-xs font-bold font-inter ${item.status === 'PRESENT' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.status === 'PRESENT' ? t.onTime : t.late}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Line Chart + Quick Actions ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">

        {/* Line Chart */}
        <div className="banco-card rounded-xl p-5">
          <SectionTitle
            title="Recouvrement des frais (FCFA)"
            action={
              <select className="text-xs border border-gray-200 dark:border-slate-600 bg-transparent rounded-lg px-3 py-1.5 font-medium text-gray-600 dark:text-gray-400 font-inter">
                <option>{t.thisMonth}</option>
                <option>{t.lastMonth}</option>
              </select>
            }
          />
          <div className="h-56">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.paymentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: 'Inter' }} />
                  <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 11 }} />
                  <Line type="monotone" dataKey="total" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" name="TOTAL DÛ" dot={false} />
                  <Line type="monotone" dataKey="paye"  stroke="var(--primary)" strokeWidth={3} name="TOTAL PAYÉ"
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="banco-card rounded-xl p-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-inter">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: UserPlus,  label: t.newTeacher,     sub: t.addToSystem,      accent: 'primary', hover: 'hover:border-primary hover:bg-primary-light dark:hover:bg-primary-dark/20' },
              { icon: BarChart2, label: t.generateReport, sub: t.exportPdfExcel,   accent: 'emerald', hover: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
              { icon: CreditCard,label: t.collectFees,    sub: t.studentPayment,   accent: 'amber',   hover: 'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' },
              { icon: Settings,  label: t.configureK40,   sub: t.terminalBio,      accent: 'purple',  hover: 'hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20' },
            ].map(({ icon: Icon, label, sub, accent, hover }, i) => (
              <button key={i} className={`p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 ${hover} transition-all text-left group`}>
                <Icon className={`w-5 h-5 mb-2 text-gray-400 group-hover:text-${accent}-600 dark:group-hover:text-${accent}-400 transition-colors`} />
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-0.5 font-inter">{label}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 font-inter">{sub}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
