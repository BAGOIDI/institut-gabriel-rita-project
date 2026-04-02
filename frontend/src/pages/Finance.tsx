import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus,
  Search,
  Calendar,
  RefreshCw,
  LayoutGrid,
  List,
  Download,
  Users,
  FileText,
  ChevronRight,
  Upload,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { financeApi, coreApi, reportsApi, socket } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../lib/translations';
import { useDebounce } from '../hooks/useDebounce';
import { ConfirmDialog } from '../components/ConfirmDialog';

// Import refactored components
import { FinanceStats } from '../components/finance/FinanceStats';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { PaymentTable } from '../components/finance/PaymentTable';
import { DisbursementTable } from '../components/finance/DisbursementTable';
import { PaymentModal } from '../components/finance/PaymentModal';
import { DisbursementModal } from '../components/finance/DisbursementModal';
import reportService from '../services/report.service';
import { useNavigate } from 'react-router-dom';

export const Finance = () => {
  const { language } = useTheme();
  const { t } = useTranslation();
  const notify = useNotification();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'encaissements' | 'decaissements' | 'rapports'>('overview');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  // Payment filters
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllDates, setShowAllDates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  
  // Disbursement filters
  const [disbursementSelectedDate, setDisbursementSelectedDate] = useState(new Date());
  const [disbursementShowAllDates, setDisbursementShowAllDates] = useState(false);
  const [disbursementSearchQuery, setDisbursementSearchQuery] = useState('');
  const [disbursementFilterMethod, setDisbursementFilterMethod] = useState('ALL');
  
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [disbursementsLoading, setDisbursementsLoading] = useState(false);
  
  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Form states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [initializingFee, setInitializingFee] = useState(false);
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherResults, setTeacherResults] = useState<any[]>([]);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    penalty: '0',
    discount: '0',
    reference: '',
    notes: '',
    printAutomatically: true,
  });
  
  const [disbursementForm, setDisbursementForm] = useState({
    type: 'SALARY',
    amount: '',
    beneficiaryName: '',
    period: '',
    description: '',
    paymentMethod: 'CASH',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const navigate = useNavigate();

  const handleGenerateReport = async (type: string) => {
    try {
      if (type === 'student') {
        const matricule = prompt("Entrez le matricule de l'étudiant :");
        if (matricule) {
          notify.info("Génération du relevé de compte...");
          await reportService.downloadStudentReport(matricule);
          notify.success("Relevé de compte téléchargé");
        }
      } else if (type === 'recovery') {
        notify.info("Génération du rapport de recouvrement...");
        await reportService.downloadLatePayments();
        notify.success("Rapport de recouvrement téléchargé");
      } else if (type === 'global') {
        notify.info("Génération du rapport global...");
        await reportService.downloadGlobalSchool();
        notify.success("Rapport global téléchargé");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
      notify.error("Erreur lors de la génération du rapport");
    }
  };

  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedDisbursementSearch = useDebounce(disbursementSearchQuery, 500);
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const debouncedTeacherSearch = useDebounce(teacherSearch, 300);

  const fetchStats = async () => {
    try {
      const response = await financeApi.get('stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPayments = useCallback(async (page = 1) => {
    setPaymentsLoading(true);
    try {
      const params: any = {
        page,
        limit: 50,
      };
      
      if (!showAllDates) {
        params.date = selectedDate.toISOString().split('T')[0];
      }
      
      if (debouncedSearch) {
        params.q = debouncedSearch;
      }
      
      if (filterMethod !== 'ALL') {
        params.method = filterMethod;
      }

      const response = await financeApi.get('payments', { params });
      const rawPayments = response.data.data || [];
      
      // Enrich with student info if missing
      const paymentsWithStudentInfo = await Promise.all(rawPayments.map(async (p: any) => {
        if (!p.studentName && !p.student_name && p.studentFee?.student_id) {
          try {
            const studentResp = await coreApi.get(`students/${p.studentFee.student_id}`);
            const student = studentResp.data;
            return {
              ...p,
              studentName: [student.firstName, student.lastName].filter(Boolean).join(' '),
              studentMatricule: student.matricule
            };
          } catch (e) {
            console.warn(`Could not fetch student info for ID ${p.studentFee.student_id}`);
          }
        }
        return p;
      }));
      
      setPayments(paymentsWithStudentInfo);
    } catch (error) {
      notify.error('Erreur lors du chargement des paiements');
    } finally {
      setPaymentsLoading(false);
    }
  }, [selectedDate, showAllDates, debouncedSearch, filterMethod, notify]);

  const fetchDisbursements = useCallback(async (page: number = 1) => {
    setDisbursementsLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (!disbursementShowAllDates) params.date = disbursementSelectedDate.toISOString().split('T')[0];
      if (debouncedDisbursementSearch) params.q = debouncedDisbursementSearch;
      if (disbursementFilterMethod && disbursementFilterMethod !== 'ALL') params.method = disbursementFilterMethod;

      const response = await financeApi.get('disbursements', { params });
      setDisbursements(response.data.data || []);
    } catch (error) {
      notify.error('Erreur lors du chargement des décaissements');
    } finally {
      setDisbursementsLoading(false);
    }
  }, [disbursementSelectedDate, disbursementShowAllDates, debouncedDisbursementSearch, disbursementFilterMethod, notify]);

  useEffect(() => {
    fetchStats();
    fetchPayments();
    fetchDisbursements();
    
    socket.on('payment_created', () => {
      fetchStats();
      fetchPayments();
    });
    
    return () => {
      socket.off('payment_created');
    };
  }, [fetchPayments, fetchDisbursements]);

  useEffect(() => {
    const searchStudents = async () => {
      if (debouncedStudentSearch.length < 2) {
        setStudentResults([]);
        setShowStudentDropdown(false);
        return;
      }
      try {
        const response = await coreApi.get(`students/search?q=${debouncedStudentSearch}`);
        // Handle paginated response format { items, total, ... }
        const data = response.data;
        const results = Array.isArray(data) ? data : (data?.items || []);
        setStudentResults(results);
        setShowStudentDropdown(results.length > 0);
      } catch (err) {
        console.error('Error searching students:', err);
      }
    };
    searchStudents();
  }, [debouncedStudentSearch]);

  useEffect(() => {
    const searchTeachers = async () => {
      if (debouncedTeacherSearch.length < 2) {
        setTeacherResults([]);
        setShowTeacherDropdown(false);
        return;
      }
      try {
        const response = await coreApi.get(`staff?q=${debouncedTeacherSearch}`);
        // Handle response format from staff controller
        const data = response.data;
        const results = Array.isArray(data) ? data : (data?.items || []);
        setTeacherResults(results);
        setShowTeacherDropdown(results.length > 0);
      } catch (err) {
        console.error('Error searching teachers:', err);
      }
    };
    searchTeachers();
  }, [debouncedTeacherSearch]);

  const handleStudentSearch = (query: string) => {
    setStudentSearch(query);
  };

  const handleTeacherSearch = (query: string) => {
    setTeacherSearch(query);
  };

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.firstName} ${student.lastName}`);
    setShowStudentDropdown(false);
    
    try {
      const response = await financeApi.get(`students/${student.id}/fees`);
      const feesData = response.data || [];
      setFees(feesData);
      if (feesData.length > 0) {
        setSelectedFee(feesData[0]);
      } else {
        setSelectedFee(null);
      }
    } catch (err) {
      notify.error("Erreur lors de la récupération des frais");
    }
  };

  const selectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTeacherSearch(`${teacher.firstName} ${teacher.lastName}`);
    setDisbursementForm(prev => ({ ...prev, beneficiaryName: `${teacher.firstName} ${teacher.lastName}` }));
    setShowTeacherDropdown(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent && !editingPayment) {
      notify.error('Veuillez sélectionner un étudiant');
      return;
    }
    if (!selectedFee && !editingPayment) {
      notify.error('Veuillez sélectionner ou créer des frais pour cet étudiant');
      return;
    }

    try {
      const paymentData = {
        studentFeeId: selectedFee?.id,
        studentName: selectedStudent ? [selectedStudent.firstName, selectedStudent.lastName].filter(Boolean).join(' ') : undefined,
        studentMatricule: selectedStudent?.matricule,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        paymentDate: paymentForm.paymentDate,
        penalty: parseFloat(paymentForm.penalty || '0'),
        discount: parseFloat(paymentForm.discount || '0'),
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes,
        userId: 1, // To be replaced by actual user ID
      };

      let savedPayment;
      if (editingPayment) {
        const response = await financeApi.put(`payments/${editingPayment.id}`, paymentData);
        savedPayment = response.data;
        notify.success('Paiement mis à jour !');
      } else {
        const response = await financeApi.post('payments', paymentData);
        savedPayment = response.data;
        notify.success('Paiement enregistré !');
      }
      
      if (paymentForm.printAutomatically && savedPayment?.id) {
        try {
          const response = await reportsApi.get(`/invoice/${savedPayment.id}`, {
            responseType: 'blob'
          });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (printErr) {
          notify.error('Paiement enregistré, mais erreur lors de l\'impression du reçu');
        }
      }
      
      setShowPaymentModal(false);
      setEditingPayment(null);
      fetchStats();
      fetchPayments();
      
      setPaymentForm({
        amount: '',
        method: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        penalty: '0',
        discount: '0',
        reference: '',
        notes: '',
        printAutomatically: true,
      });
      setSelectedStudent(null);
      setSelectedFee(null);
      setFees([]);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Erreur d\'enregistrement');
    }
  };

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const disbursementData = {
        type: disbursementForm.type,
        amount: parseFloat(disbursementForm.amount),
        beneficiaryName: disbursementForm.beneficiaryName,
        beneficiaryId: selectedTeacher?.id,
        period: disbursementForm.period || undefined,
        description: disbursementForm.description || undefined,
        paymentMethod: disbursementForm.paymentMethod,
        reference: disbursementForm.reference || undefined,
        recordedBy: 1,
        paymentDate: disbursementForm.paymentDate,
      };

      await financeApi.post('disbursements', disbursementData);
      notify.success('Décaissement enregistré !');
      setShowDisbursementModal(false);
      fetchStats();
      fetchDisbursements();
      
      setDisbursementForm({
        type: 'SALARY',
        amount: '',
        beneficiaryName: '',
        period: '',
        description: '',
        paymentMethod: 'CASH',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setSelectedTeacher(null);
      setTeacherSearch('');
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Erreur décaissement');
    }
  };

  const handleDeletePayment = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await financeApi.delete(`payments/${targetDeleteId}`);
      notify.success('Paiement supprimé');
      fetchPayments();
      fetchStats();
    } catch (err) {
      notify.error('Erreur suppression');
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteOpen(false);
      setTargetDeleteId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCancelPayment = async (id: number) => {
    try {
      await financeApi.post(`payments/${id}/cancel`);
      fetchPayments(1);
      fetchStats();
      notify.success('Paiement annulé avec succès');
    } catch (error) {
      console.error('Error cancelling payment:', error);
      notify.error('Erreur lors de l\'annulation du paiement');
    }
  };

  const handleCancelDisbursement = async (id: number) => {
    try {
      await financeApi.post(`disbursements/${id}/cancel`);
      fetchDisbursements(1);
      fetchStats();
      notify.success('Décaissement annulé avec succès');
    } catch (error) {
      console.error('Error cancelling disbursement:', error);
      notify.error('Erreur lors de l\'annulation du décaissement');
    }
  };

  const handleRestorePayment = async (id: number) => {
    try {
      await financeApi.post(`payments/${id}/restore`);
      fetchPayments(1);
      fetchStats();
      notify.success('Paiement restauré avec succès');
    } catch (error) {
      console.error('Error restoring payment:', error);
      notify.error('Erreur lors de la restauration du paiement');
    }
  };

  const handleRestoreDisbursement = async (id: number) => {
    try {
      await financeApi.post(`disbursements/${id}/restore`);
      fetchDisbursements(1);
      fetchStats();
      notify.success('Décaissement restauré avec succès');
    } catch (error) {
      console.error('Error restoring disbursement:', error);
      notify.error('Erreur lors de la restauration du décaissement');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params: any = {};
      if (!showAllDates) params.date = selectedDate.toISOString().split('T')[0];
      if (debouncedSearch) params.q = debouncedSearch;
      if (filterMethod && filterMethod !== 'ALL') params.method = filterMethod;
      
      const response = await financeApi.get('payments/export/csv', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      notify.error('Erreur lors de l\'exportation');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t('finance')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestion financière, encaissements et décaissements</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDisbursementModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-semibold active:scale-95"
          >
            <Upload className="w-4 h-4" />
            {t('newWithdrawal')}
          </button>
          <button
            onClick={() => {
              setEditingPayment(null);
              setPaymentForm({
                amount: '',
                method: 'CASH',
                paymentDate: new Date().toISOString().split('T')[0],
                penalty: '0',
                discount: '0',
                reference: '',
                notes: '',
                printAutomatically: true,
              });
              setSelectedStudent(null);
              setStudentSearch('');
              setFees([]);
              setSelectedFee(null);
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-semibold active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouvel Encaissement
          </button>
        </div>
      </div>

      <FinanceStats stats={stats} formatAmount={formatAmount} />

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="flex border-b border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutGrid },
            { id: 'encaissements', label: 'Encaissements', icon: TrendingUp },
            { id: 'decaissements', label: 'Décaissements', icon: TrendingDown },
            { id: 'rapports', label: 'Rapports', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <FinanceOverview 
              stats={stats} 
              payments={payments} 
              disbursements={disbursements}
              formatAmount={formatAmount} 
              formatDate={formatDate} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'encaissements' && (
            <div>
              <div className="flex flex-col lg:flex-row gap-4 justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg border border-gray-200 dark:border-slate-600">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date"
                      value={selectedDate.toLocaleDateString('en-CA')}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                    />
                    <button 
                      onClick={() => fetchPayments(1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${paymentsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter</span>
                  </button>
                  <button 
                    onClick={() => setShowAllDates(!showAllDates)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${showAllDates ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'}`}
                  >
                    {showAllDates ? 'Filtrer par date' : 'Toutes les dates'}
                  </button>
                  <select 
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Tous les modes</option>
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <PaymentTable 
                payments={payments} 
                loading={paymentsLoading} 
                onEdit={(p) => {
                  setEditingPayment(p);
                  setPaymentForm({
                    amount: String(p.amountPaid || p.amount_paid || 0),
                    method: p.paymentMethod || p.payment_method || 'CASH',
                    paymentDate: (p.paymentDate || p.payment_date) ? new Date(p.paymentDate || p.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    penalty: String(p.penalty || 0),
                    discount: String(p.discount || 0),
                    reference: p.reference || '',
                    notes: p.description || '',
                    printAutomatically: true,
                  });
                  setShowPaymentModal(true);
                }} 
                onCancel={handleCancelPayment}
                onRestore={handleRestorePayment}
                onDelete={(id) => {
                  setTargetDeleteId(id);
                  setConfirmDeleteOpen(true);
                }} 
                formatAmount={formatAmount} 
                formatDate={formatDate} 
              />
            </div>
          )}

          {activeTab === 'decaissements' && (
            <div>
              <div className="flex flex-col lg:flex-row gap-4 justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Historique des Décaissements</h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date"
                      value={disbursementSelectedDate.toLocaleDateString('en-CA')}
                      onChange={(e) => setDisbursementSelectedDate(new Date(e.target.value))}
                      className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                    />
                    <button 
                      onClick={() => fetchDisbursements(1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-rose-600 ${disbursementsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setDisbursementShowAllDates(!disbursementShowAllDates)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${disbursementShowAllDates ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'}`}
                  >
                    {disbursementShowAllDates ? t('filterByDate') : t('allDates')}
                  </button>
                  <select 
                    value={disbursementFilterMethod}
                    onChange={(e) => setDisbursementFilterMethod(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="ALL">Tous les modes</option>
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('searchBeneficiary')}
                      value={disbursementSearchQuery}
                      onChange={(e) => setDisbursementSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <button 
                    onClick={() => setShowDisbursementModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-all uppercase active:scale-95 shadow-lg shadow-rose-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('new')}</span>
                  </button>
                </div>
              </div>

              <DisbursementTable 
                disbursements={disbursements} 
                loading={disbursementsLoading} 
                formatAmount={formatAmount} 
                formatDate={formatDate} 
                onNewDisbursement={() => setShowDisbursementModal(true)}
                onCancel={handleCancelDisbursement}
                onRestore={handleRestoreDisbursement}
                onDelete={(id) => {
                  setTargetDeleteId(id);
                  setConfirmDeleteOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === 'rapports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'student', title: 'Relevé de Compte Étudiant', desc: 'Détail des paiements par élève', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { id: 'recovery', title: 'Rapport de Recouvrement', desc: 'État des impayés par classe', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { id: 'global', title: 'Rapport Global Financier', desc: 'Synthèse générale de l\'établissement', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              ].map((rep, idx) => {
                const Icon = rep.icon;
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleGenerateReport(rep.id)}
                    className="p-5 border border-gray-100 dark:border-slate-700 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white dark:bg-slate-800 group"
                  >
                    <div className={`w-12 h-12 ${rep.bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${rep.color}`} />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{rep.title}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{rep.desc}</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase">
                      {t('generateNow')} <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        show={showPaymentModal}
        editingPayment={editingPayment}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        studentSearch={studentSearch}
        onStudentSearch={handleStudentSearch}
        showStudentDropdown={showStudentDropdown}
        studentResults={studentResults}
        onSelectStudent={selectStudent}
        selectedStudent={selectedStudent}
        fees={fees}
        selectedFee={selectedFee}
        onSelectFee={setSelectedFee}
        onInitializeFee={async () => {
          try {
            const amount = prompt("Entrez le montant total de la scolarité pour cet élève (FCFA) :");
            if (!amount) return;
            
            setInitializingFee(true);
            await financeApi.post('fees', {
              studentId: selectedStudent.id,
              totalDue: parseFloat(amount)
            });
            
            notify.success('Frais créés avec succès !');
            const feesResponse = await financeApi.get(`students/${selectedStudent.id}/fees`);
            setFees(feesResponse.data || []);
            if (feesResponse.data?.length > 0) {
              setSelectedFee(feesResponse.data[0]);
            }
          } catch (err) {
            notify.error("Erreur lors de la création des frais");
          } finally {
            setInitializingFee(false);
          }
        }}
        initializingFee={initializingFee}
        paymentForm={paymentForm}
        onFormChange={(field, value) => setPaymentForm(prev => ({ ...prev, [field]: value }))}
      />

      <DisbursementModal 
        show={showDisbursementModal}
        onClose={() => setShowDisbursementModal(false)}
        onSubmit={handleDisbursementSubmit}
        teacherSearch={teacherSearch}
        onTeacherSearch={handleTeacherSearch}
        showTeacherDropdown={showTeacherDropdown}
        teacherResults={teacherResults}
        onSelectTeacher={selectTeacher}
        disbursementForm={disbursementForm}
        onFormChange={(field, value) => setDisbursementForm(prev => ({ ...prev, [field]: value }))}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeletePayment}
        title={t('deletePaymentTitle')}
        message={t('deletePaymentMessage')}
        loading={deleteLoading}
      />
    </div>
  );
};
