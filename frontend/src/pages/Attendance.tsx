import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Calendar,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  TrendingUp,
  TrendingDown,
  List,
  LayoutGrid
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';
import axios from 'axios';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  specialty: string;
}

interface Attendance {
  id: string;
  teacher: Teacher;
  checkIn: string | null;
  checkOut: string | null;
  isLate: boolean;
  lateMinutes: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  createdAt: string;
}

interface AttendanceStats {
  totalTeachers: number;
  present: number;
  absent: number;
  late: number;
  onTime: number;
  attendanceRate: number;
  lateRate: number;
}

export const Attendance = () => {
  const { language } = useTheme();
  const t = translations[language];
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchAttendances();
  }, [selectedDate, filterStatus]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/attendance');
      const data = response.data;
      
      // Filtrer par date sélectionnée
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filtered = data.filter((att: Attendance) => {
        const attDate = new Date(att.createdAt);
        return attDate >= startOfDay && attDate <= endOfDay;
      });

      // Filtrer par statut
      const statusFiltered = filterStatus === 'ALL' 
        ? filtered 
        : filtered.filter((att: Attendance) => att.status === filterStatus);

      setAttendances(statusFiltered);

      // Calculer les statistiques
      const present = filtered.filter((a: Attendance) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absent = filtered.filter((a: Attendance) => a.status === 'ABSENT').length;
      const late = filtered.filter((a: Attendance) => a.status === 'LATE').length;
      const onTime = filtered.filter((a: Attendance) => a.status === 'PRESENT' && !a.isLate).length;
      const totalTeachers = filtered.length;

      setStats({
        totalTeachers,
        present,
        absent,
        late,
        onTime,
        attendanceRate: totalTeachers > 0 ? (present / totalTeachers) * 100 : 0,
        lateRate: totalTeachers > 0 ? (late / totalTeachers) * 100 : 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des présences', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return '-';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PRESENT: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: '{t.present}' },
      LATE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: '{t.late}' },
      ABSENT: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', label: '{t.absent}' },
    };
    const badge = badges[status as keyof typeof badges] || badges.ABSENT;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredAttendances = attendances.filter(att => {
    const fullName = `${att.teacher.firstName} ${att.teacher.lastName}`.toLowerCase();
    const matricule = att.teacher.matricule.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || matricule.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">{t.loadingAttendances}...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div 
        style={{ marginBottom: 'var(--card-spacing)' }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.attendances}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.teacherAttendanceManagement}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchAttendances}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-blue-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.refresh}</span>
          </button>
          <button 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-emerald-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.export}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div 
          style={{ gap: 'var(--card-spacing)', marginBottom: 'var(--card-spacing)' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        >
          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Total
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.teachers}</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.totalTeachers}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400`}>
                <TrendingUp className="w-2.5 h-2.5" />
                <span>{stats.attendanceRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.present}</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.present}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${
                stats.lateRate > 15 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {stats.lateRate > 15 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{stats.lateRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.lates}</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.late}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-rose-100 dark:bg-rose-900/30">
                <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${
                stats.absent === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {stats.absent === 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                <span>{stats.absent}</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.absent}</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.absent}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={goToToday}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-normal transition-colors border border-blue-700"
            >
              {t.today}
            </button>
            <button 
              onClick={goToPreviousDay}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={goToNextDay}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Year and Month Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.year}:</span>
            <select 
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
                const newDate = new Date(selectedDate);
                newDate.setFullYear(year);
                setSelectedDate(newDate);
              }}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 3 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">{t.month}:</span>
            <select 
              value={selectedMonth}
              onChange={(e) => {
                const month = parseInt(e.target.value);
                setSelectedMonth(month);
                const newDate = new Date(selectedDate);
                newDate.setMonth(month);
                setSelectedDate(newDate);
              }}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Janvier</option>
              <option value={1}>Février</option>
              <option value={2}>Mars</option>
              <option value={3}>Avril</option>
              <option value={4}>Mai</option>
              <option value={5}>Juin</option>
              <option value={6}>Juillet</option>
              <option value={7}>Août</option>
              <option value={8}>Septembre</option>
              <option value={9}>Octobre</option>
              <option value={10}>Novembre</option>
              <option value={11}>Décembre</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Mode and Filters */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          {/* View Mode Toggle */}
          <div className="flex gap-2 items-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.display}:</span>
            <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all flex items-center gap-1.5 ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{t.list}</span>
              </button>
              <button 
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all flex items-center gap-1.5 ${
                  viewMode === 'card' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.cards}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="PRESENT">{t.present}</option>
              <option value="LATE">{t.lates}</option>
              <option value="ABSENT">{t.absent}</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Display */}
      {viewMode === 'list' ? (
        // List View (Table)
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.teacher}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.matricule}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.specialty}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.arrival}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.departure}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.duration}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.late}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.status}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {t.noAttendanceRecorded}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((attendance) => (
                    <tr 
                      key={attendance.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {attendance.teacher.firstName} {attendance.teacher.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {attendance.teacher.matricule}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {attendance.teacher.specialty}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {formatTime(attendance.checkIn)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {formatTime(attendance.checkOut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDuration(attendance.checkIn, attendance.checkOut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attendance.isLate ? (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            +{attendance.lateMinutes} min
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(attendance.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card View
        <div>
          {filteredAttendances.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Aucune présence enregistrée pour cette date
                </p>
              </div>
            </div>
          ) : (
            <div 
              style={{ gap: 'var(--card-spacing)' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredAttendances.map((attendance) => (
                <div 
                  key={attendance.id}
                  style={{ padding: 'var(--card-spacing)' }}
                  className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {attendance.teacher.firstName}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {attendance.teacher.lastName}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(attendance.status)}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Matricule:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{attendance.teacher.matricule}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Spécialité:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{attendance.teacher.specialty}</span>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Arrivée:</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{formatTime(attendance.checkIn)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Départ:</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{formatTime(attendance.checkOut)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Durée:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDuration(attendance.checkIn, attendance.checkOut)}</span>
                    </div>
                    {attendance.isLate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Retard:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">+{attendance.lateMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Stats */}
      {filteredAttendances.length > 0 && (
        <div 
          style={{ marginTop: 'var(--card-spacing)', padding: 'var(--card-spacing)' }}
          className="bg-gray-50 dark:bg-slate-800/50 rounded-md border border-gray-200 dark:border-slate-700"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">{filteredAttendances.length}</span> résultat(s) affiché(s)
          </div>
        </div>
      )}
    </div>
  );
};
