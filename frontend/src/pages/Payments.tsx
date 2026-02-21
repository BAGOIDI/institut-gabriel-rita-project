import React, { useState, useEffect } from 'react';
import { 
  DollarSign,
  CreditCard,
  Calendar,
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
  LayoutGrid,
  Plus,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { translations } from '../lib/translations';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  classRoom: string;
}

interface Payment {
  id: string;
  student: Student;
  type: 'ENCAISSEMENT' | 'DECAISSEMENT';
  amount: number;
  penalty: number;
  discount: number;
  paymentDate: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  reference: string | null;
  description: string | null;
  createdAt: string;
}

interface PaymentStats {
  totalPayments: number;
  totalEncaissements: number;
  totalDecaissements: number;
  netAmount: number;
  totalPenalties: number;
  totalDiscounts: number;
  cashPayments: number;
  bankTransfers: number;
  mobileMoney: number;
  averagePayment: number;
}

export const Payments = () => {
  const { language } = useTheme();
  const t = translations[language];
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showModal, setShowModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherResults, setTeacherResults] = useState<any[]>([]);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [payeeCategory, setPayeeCategory] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [formData, setFormData] = useState({
    studentId: '',
    teacherId: '',
    type: 'ENCAISSEMENT',
    amount: '',
    penalty: '0',
    discount: '0',
    method: 'CASH',
    reference: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const classes = [
    'Terminale C', 'Terminale D', '1ère C', '1ère D',
    '2nde A', '2nde C', '3ème', '4ème', '5ème', '6ème'
  ];

  useEffect(() => {
    fetchPayments();
  }, [selectedDate, filterMethod, filterType, filterClass]);

  // Search students with Typesense
  useEffect(() => {
    const searchStudents = async () => {
      if (studentSearch.length >= 2) {
        try {
          const response = await axios.get(`http://localhost:3000/students/search?q=${studentSearch}&limit=10`);
          setStudentResults(response.data.hits || []);
          setShowStudentDropdown(true);
        } catch (error) {
          console.error('Error searching students:', error);
          setStudentResults([]);
        }
      } else {
        setStudentResults([]);
        setShowStudentDropdown(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [studentSearch]);

  // Search teachers with Typesense
  useEffect(() => {
    const searchTeachers = async () => {
      if (teacherSearch.length >= 2) {
        try {
          const response = await axios.get(`http://localhost:3000/teachers/search?q=${teacherSearch}&limit=10`);
          setTeacherResults(response.data.hits || []);
          setShowTeacherDropdown(true);
        } catch (error) {
          console.error('Error searching teachers:', error);
          setTeacherResults([]);
        }
      } else {
        setTeacherResults([]);
        setShowTeacherDropdown(false);
      }
    };

    const debounce = setTimeout(searchTeachers, 300);
    return () => clearTimeout(debounce);
  }, [teacherSearch]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/payments');
      const data = response.data;
      
      // Filtrer par date sélectionnée
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      let filtered = data.filter((payment: Payment) => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startOfDay && paymentDate <= endOfDay;
      });

      // Filtrer par méthode
      if (filterMethod !== 'ALL') {
        filtered = filtered.filter((p: Payment) => p.method === filterMethod);
      }

      // Filtrer par type
      if (filterType !== 'ALL') {
        filtered = filtered.filter((p: Payment) => p.type === filterType);
      }

      // Filtrer par classe
      if (filterClass !== 'ALL') {
        filtered = filtered.filter((p: Payment) => p.student.classRoom === filterClass);
      }

      setPayments(filtered);

      // Calculer les statistiques
      const encaissements = filtered.filter((p: Payment) => p.type === 'ENCAISSEMENT');
      const decaissements = filtered.filter((p: Payment) => p.type === 'DECAISSEMENT');
      
      const totalEncaissements = encaissements.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
      const totalDecaissements = decaissements.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
      const netAmount = totalEncaissements - totalDecaissements;
      
      const totalPenalties = filtered.reduce((sum: number, p: Payment) => sum + Number(p.penalty), 0);
      const totalDiscounts = filtered.reduce((sum: number, p: Payment) => sum + Number(p.discount), 0);
      const cashPayments = filtered.filter((p: Payment) => p.method === 'CASH').length;
      const bankTransfers = filtered.filter((p: Payment) => p.method === 'BANK_TRANSFER').length;
      const mobileMoney = filtered.filter((p: Payment) => p.method === 'MOBILE_MONEY').length;

      setStats({
        totalPayments: filtered.length,
        totalEncaissements,
        totalDecaissements,
        netAmount,
        totalPenalties,
        totalDiscounts,
        cashPayments,
        bankTransfers,
        mobileMoney,
        averagePayment: filtered.length > 0 ? totalEncaissements / filtered.length : 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paiements', error);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      CASH: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Espèces' },
      BANK_TRANSFER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Virement' },
      MOBILE_MONEY: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Mobile Money' },
    };
    const badge = badges[method as keyof typeof badges] || badges.CASH;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const paymentData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        penalty: parseFloat(formData.penalty),
        discount: parseFloat(formData.discount),
        method: formData.method,
        reference: formData.reference || null,
        description: formData.description || null,
        paymentDate: new Date(formData.paymentDate),
        studentId: payeeCategory === 'STUDENT' ? formData.studentId : null,
        teacherId: payeeCategory === 'TEACHER' ? formData.teacherId : null,
      };

      await axios.post(`http://localhost:3000/payments`, paymentData);
      
      setShowModal(false);
      setFormData({
        studentId: '',
        teacherId: '',
        type: 'ENCAISSEMENT',
        amount: '',
        penalty: '0',
        discount: '0',
        method: 'CASH',
        reference: '',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setStudentSearch('');
      setTeacherSearch('');
      setPayeeCategory('STUDENT');
      fetchPayments();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const fullName = `${payment.student.firstName} ${payment.student.lastName}`.toLowerCase();
    const matricule = payment.student.matricule.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || matricule.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement des paiements...</p>
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.payments}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.studentPaymentManagement}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchPayments}
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
          <button 
            onClick={() => {
              setFormData({ 
                ...formData, 
                type: 'ENCAISSEMENT', 
                studentId: '', 
                amount: '', 
                penalty: '0', 
                discount: '0', 
                reference: '', 
                description: '' 
              });
              setStudentSearch('');
              setPayeeCategory('STUDENT');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg text-sm font-normal border border-emerald-700 uppercase active:scale-95"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.disbursement}</span>
          </button>
          <button 
            onClick={() => {
              setFormData({ 
                ...formData, 
                type: 'DECAISSEMENT', 
                studentId: '', 
                amount: '', 
                penalty: '0', 
                discount: '0', 
                reference: '', 
                description: '' 
              });
              setStudentSearch('');
              setTeacherSearch('');
              setPayeeCategory('STUDENT'); // Par défaut étudiant, peut être changé en enseignant
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg text-sm font-normal border border-rose-700 uppercase active:scale-95"
          >
            <TrendingDown className="w-4 h-4" />
            <span>{t.withdrawal}</span>
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
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {stats.totalPayments} {t.payments}
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.disbursements}</div>
            <div className="text-xl font-black text-emerald-900 dark:text-emerald-400">{formatAmount(stats.totalEncaissements)}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-rose-100 dark:bg-rose-900/30">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {t.withdrawals}
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.withdrawals}</div>
            <div className="text-xl font-black text-rose-900 dark:text-rose-400">{formatAmount(stats.totalDecaissements)}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${
                stats.netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {stats.netAmount >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{stats.netAmount >= 0 ? '+' : ''}{formatAmount(Math.abs(stats.netAmount))}</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.netBalance}</div>
            <div className={`text-xl font-black ${
              stats.netAmount >= 0 ? 'text-blue-900 dark:text-blue-400' : 'text-rose-900 dark:text-rose-400'
            }`}>{formatAmount(stats.netAmount)}</div>
          </div>

          <div 
            style={{ padding: 'var(--card-spacing)' }}
            className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Pénalités/Remises
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">{t.penalties}</div>
            <div className="text-lg font-black text-rose-900 dark:text-rose-400 mb-1">{formatAmount(stats.totalPenalties)}</div>
            <div className="text-[9px] font-semibold tracking-wide text-gray-500 dark:text-gray-400">{t.discounts}: <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatAmount(stats.totalDiscounts)}</span></div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={goToToday}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-normal transition-colors border border-blue-700"
            >
              Aujourd'hui
            </button>
            <button 
              onClick={goToPreviousDay}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={goToNextDay}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

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
              <option value={0}>{t.january}</option>
              <option value={1}>{t.february}</option>
              <option value={2}>{t.march}</option>
              <option value={3}>{t.april}</option>
              <option value={4}>{t.may}</option>
              <option value={5}>{t.june}</option>
              <option value={6}>{t.july}</option>
              <option value={7}>{t.august}</option>
              <option value={8}>{t.september}</option>
              <option value={9}>{t.october}</option>
              <option value={10}>{t.november}</option>
              <option value={11}>{t.december}</option>
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t.allTypes}</option>
              <option value="ENCAISSEMENT">{t.disbursements}</option>
              <option value="DECAISSEMENT">{t.withdrawals}</option>
            </select>

            <select 
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t.allMethods}</option>
              <option value="CASH">{t.cash}</option>
              <option value="BANK_TRANSFER">{t.bankTransfer}</option>
              <option value="MOBILE_MONEY">{t.mobileMoney}</option>
            </select>

            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{t.allClasses}</option>
              {classes.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={`${t.search}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Display */}
      {viewMode === 'list' ? (
        // List View (Table)
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.student}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.class}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.type}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.amount}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.penalty}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.discount}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.method}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.reference}
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {t.date}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {t.noPaymentsForDate}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr 
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center ${
                            payment.student 
                              ? 'from-purple-400 to-purple-600' 
                              : 'from-blue-400 to-blue-600'
                          }`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {payment.student 
                                ? `${payment.student.firstName} ${payment.student.lastName}`
                                : `${payment.teacher?.firstName} ${payment.teacher?.lastName}`
                              }
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {payment.student 
                                ? payment.student.matricule 
                                : `Enseignant • ${payment.teacher?.biometricId || 'N/A'}`
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {payment.student ? payment.student.classRoom : (payment.teacher?.subject || '-')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          payment.type === 'ENCAISSEMENT' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                        }`}>
                          {payment.type === 'ENCAISSEMENT' ? t.disbursement : t.withdrawal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${
                          payment.type === 'ENCAISSEMENT'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {payment.type === 'ENCAISSEMENT' ? '+' : '-'}{formatAmount(payment.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          {payment.penalty > 0 ? formatAmount(payment.penalty) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {payment.discount > 0 ? formatAmount(payment.discount) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getMethodBadge(payment.method)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                        {payment.reference || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                        {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
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
          {filteredPayments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {t.noPaymentsForDate}
                </p>
              </div>
            </div>
          ) : (
            <div 
              style={{ gap: 'var(--card-spacing)' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredPayments.map((payment) => (
                <div 
                  key={payment.id}
                  style={{ padding: 'var(--card-spacing)' }}
                  className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {payment.student.firstName}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {payment.student.lastName}
                        </div>
                      </div>
                    </div>
                    {getMethodBadge(payment.method)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{t.class}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{payment.student.classRoom}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{t.matricule}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{payment.student.matricule}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{t.amount}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(payment.amount)}</span>
                    </div>
                    {payment.penalty > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{t.penalty}:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{formatAmount(payment.penalty)}</span>
                      </div>
                    )}
                    {payment.discount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{t.discount}:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{formatAmount(payment.discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{t.date}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(payment.paymentDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    </div>
                    {payment.reference && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{t.ref}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{payment.reference}</span>
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
      {filteredPayments.length > 0 && (
        <div 
          style={{ marginTop: 'var(--card-spacing)', padding: 'var(--card-spacing)' }}
          className="bg-gray-50 dark:bg-slate-800/50 rounded-md border border-gray-200 dark:border-slate-700"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">{filteredPayments.length}</span> {t.paymentsDisplayed} • 
            {t.total}: <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatAmount(filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0))}
            </span>
          </div>
        </div>
      )}

      {/* Modal Nouveau Paiement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                {formData.type === 'ENCAISSEMENT' ? t.newDisbursement : t.newWithdrawal}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
              {formData.type === 'DECAISSEMENT' && (
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPayeeCategory('STUDENT');
                      setFormData({ ...formData, teacherId: '' });
                      setTeacherSearch('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      payeeCategory === 'STUDENT'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t.student}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayeeCategory('TEACHER');
                      setFormData({ ...formData, studentId: '' });
                      setStudentSearch('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      payeeCategory === 'TEACHER'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t.teacher} ({t.salary})
                  </button>
                </div>
              )}

              {payeeCategory === 'STUDENT' ? (
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.student} *</label>
                  <input
                    type="text"
                    required={!formData.studentId}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onFocus={() => studentResults.length > 0 && setShowStudentDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={`${t.searchByNameMatricule}...`}
                  />
                  {showStudentDropdown && studentResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, studentId: student.id});
                            setStudentSearch(`${student.firstName} ${student.lastName} (${student.matricule})`);
                            setShowStudentDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {student.matricule} • {student.classRoom}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.studentId && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ {t.studentSelected}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.teacher} *</label>
                  <input
                    type="text"
                    required={!formData.teacherId}
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    onFocus={() => teacherResults.length > 0 && setShowTeacherDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={`${t.searchByName}...`}
                  />
                  {showTeacherDropdown && teacherResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {teacherResults.map((teacher) => (
                        <button
                          key={teacher.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, teacherId: teacher.id});
                            setTeacherSearch(`${teacher.firstName} ${teacher.lastName}`);
                            setShowTeacherDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {teacher.subject} • {teacher.biometricId}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.teacherId && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ {t.teacherSelected}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.method} *</label>
                  <select
                    required
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">{t.cash}</option>
                    <option value="BANK_TRANSFER">{t.bankTransfer}</option>
                    <option value="MOBILE_MONEY">{t.mobileMoney}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.amount} (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.paymentDate} *</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.reference}</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={`${t.transactionNumber}...`}
                  />
                </div>
              </div>

              {formData.type === 'ENCAISSEMENT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.penalty} (FCFA)</label>
                    <input
                      type="number"
                      value={formData.penalty}
                      onChange={(e) => setFormData({...formData, penalty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.discount} (FCFA)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t.description}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={`${t.paymentDescription}...`}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
