import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  UserPlus, 
  BookOpen,
  Phone, 
  Calendar,
  MoreVertical,
  Download,
  Camera,
  X,
  User,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List as ListIcon,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Edit,
  Trash2,
  Eye,
  FileText,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api.service';
import { SearchService } from '../services/search.service';
import { CoreService } from '../services/core.service';
import { useSystemOptions } from '../hooks/useSystemOptions';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../lib/translations';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotification } from '../contexts/NotificationContext';

interface Assignment {
  id?: number;
  classId: number;
  subjectId: number;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  gender: string;
  maritalStatus: string;
  hireDate: string;
  status: string; // Permanent, Vacataire, Contractuel
  specialty: string; // Spécialité/Discipline principale
  diploma: string; // Niveau d'étude
  assignments: Assignment[]; // Assignments (class + subject)
  subjects?: string[]; // For display
  classes?: string[]; // For display
  photo: string;
  idCardNumber: string;
  socialSecurityNumber: string;
  bankAccount: string;
  salary: number;
  contractType: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    specialty: '',
    contractType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    matricule: '',
    specialty: '',
    status: '',
    contact: ''
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [subjectsFilter, setSubjectsFilter] = useState('');
  const [classesFilter, setClassesFilter] = useState('');
  
  const { language } = useTheme();
  const { t } = useTranslation();
  const notify = useNotification();
  const { data: genderOptions } = useSystemOptions('GENDER');
  const { data: maritalOptions } = useSystemOptions('MARITAL_STATUS');
  const { data: specialtyOptions } = useSystemOptions('SPECIALTY');
  const { data: degreeOptions } = useSystemOptions('DEGREE');
  const { data: statusOptions } = useSystemOptions('TEACHER_STATUS');
  const { data: contractOptions } = useSystemOptions('CONTRACT_TYPE');
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);

  const getOptionLabel = (opt: any) =>
    language === 'fr' ? opt?.labelFr || opt?.label || opt?.value : opt?.labelEn || opt?.label || opt?.value;

  // Formulaire pour nouveau/édition enseignant
  const [formData, setFormData] = useState<Partial<Teacher>>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: 'Ivoirienne',
    gender: '',
    maritalStatus: 'Célibataire',
    hireDate: '',
    status: 'Permanent',
    specialty: '',
    diploma: '',
    assignments: [],
    idCardNumber: '',
    socialSecurityNumber: '',
    bankAccount: '',
    salary: 0,
    contractType: 'CDI',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTeachers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters, pagination.page, pagination.limit]);

  const fetchTeachers = async () => {
    setLoading(true);
    setBackendError(false);
    try {
      // Si une recherche texte est saisie, on interroge Typesense directement
      if (searchTerm.trim()) {
        const result = await SearchService.search(
          'teachers',
          searchTerm.trim(),
          'full_name,matricule,email,phone_number,specialty',
          {
            page: pagination.page,
            per_page: pagination.limit,
          }
        );

        const hits = Array.isArray((result as any).hits) ? (result as any).hits : [];
        const docs: Teacher[] = hits
          .map((hit: any) => hit.document)
          .filter(Boolean)
          .map((doc: any) => ({
            id: doc.id,
            firstName: doc.first_name || doc.firstName || '',
            lastName: doc.last_name || doc.lastName || '',
            matricule: doc.matricule || '',
            email: doc.email || '',
            phoneNumber: doc.phone_number || doc.phoneNumber || '',
            address: doc.address || '',
            dateOfBirth: doc.date_of_birth || doc.dateOfBirth || '',
            placeOfBirth: doc.place_of_birth || doc.placeOfBirth || '',
            nationality: doc.nationality || '',
            gender: doc.gender || '',
            maritalStatus: doc.marital_status || doc.maritalStatus || '',
            hireDate: doc.hire_date || doc.hireDate || '',
            status: doc.status || '',
            specialty: doc.specialty || '',
            diploma: doc.diploma || '',
            subjects: doc.subjects || [],
            classes: doc.classes || [],
            photo: doc.photo || '',
            idCardNumber: doc.id_card_number || doc.idCardNumber || '',
            socialSecurityNumber: doc.social_security_number || doc.socialSecurityNumber || '',
            bankAccount: doc.bank_account || doc.bankAccount || '',
            salary: doc.salary || 0,
            contractType: doc.contract_type || doc.contractType || '',
            emergencyContact: doc.emergencyContact || {
              name: '',
              phone: '',
              relationship: '',
            },
          }));

        setTeachers(docs);
        const totalFound =
          typeof (result as any).found === 'number'
            ? (result as any).found
            : docs.length;
        setPagination(prev => ({
          ...prev,
          total: totalFound,
          lastPage: Math.max(1, Math.ceil(totalFound / prev.limit)),
        }));
      } else {
        // Sinon, on utilise l'API backend classique
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.specialty) params.append('specialty', filters.specialty);
        if (filters.contractType) params.append('contractType', filters.contractType);
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());

        const url = `/api/core/staff?${params.toString()}`;
        const response = await api.get(url);
        
        const teachersWithAssignments = (response.data.items || []).map((teacher: any) => {
          const assignments = teacher.teacherAssignments || [];
          const uniqueClasses = new Set(assignments.map((a: any) => a.classId || a.class?.id).filter(Boolean));
          const uniqueSubjects = new Set(assignments.map((a: any) => a.subjectId || a.subject?.id).filter(Boolean));
          return {
            ...teacher,
            classes: Array.from(uniqueClasses),
            subjects: Array.from(uniqueSubjects)
          };
        });

        setTeachers(teachersWithAssignments);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          lastPage: response.data.lastPage || 1
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants', error);
      setBackendError(true);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const subjectsRes = await CoreService.getAll('subjects');
        const classesRes = await CoreService.getAll('classes');
        const subjectsData = subjectsRes.items || subjectsRes || [];
        const classesData = classesRes.items || classesRes || [];
        setSubjectsList(subjectsData);
        setClassesList(classesData);
      } catch {}
    };
    loadDynamicOptions();
  }, []);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination({ ...pagination, limit: newLimit, page: 1 });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      try {
        await api.post('/api/core/staff/import', data);
        fetchTeachers();
        notify.success('Importation réussie');
      } catch (error) {
        notify.error("Erreur lors de l'importation");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let teacherId = selectedTeacher?.id;
      if (selectedTeacher) {
        await api.put(`/api/core/staff/${selectedTeacher.id}`, formData);
      } else {
        const response = await api.post('/api/core/staff', formData);
        teacherId = response.data.id;
      }

      // Handle assignments update
      if (teacherId) {
        const assignments = (formData.assignments || []).map(a => ({
          classId: Number(a.classId),
          subjectId: Number(a.subjectId)
        })).filter(a => a.classId && a.subjectId);

        await api.post(`/api/core/teacher-subject-class/sync/${teacherId}`, assignments);
      }

      setShowModal(false);
      setSelectedTeacher(null);
      setFormData({ assignments: [] });
      setFormStep(1);
      setSubjectsFilter('');
      setClassesFilter('');
      fetchTeachers();
      notify.success('Enseignant enregistré avec succès');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
      notify.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (teacher: any) => {
    // Current assignments are already in teacherAssignments or can be mapped from assignments if we want
    // But since findOne or findAll now includes them, let's use them
    const assignments = teacher.teacherAssignments || teacher.assignments || [];
    const currentAssignments = assignments.map((a: any) => ({
      id: a.id,
      classId: a.classId || a.class?.id,
      subjectId: a.subjectId || a.subject?.id
    }));
    
    setSelectedTeacher(teacher);
    setFormData({
      ...teacher,
      assignments: currentAssignments
    });
    setFormStep(1);
    setSubjectsFilter('');
    setClassesFilter('');
    setShowModal(true);
  };

  const handleOpenAssignments = (teacher: any) => {
    const assignments = teacher.teacherAssignments || teacher.assignments || [];
    const currentAssignments = assignments.map((a: any) => ({
      id: a.id,
      classId: a.classId || a.class?.id,
      subjectId: a.subjectId || a.subject?.id
    }));
    
    setSelectedTeacher(teacher);
    setFormData({
      ...teacher,
      assignments: currentAssignments
    });
    setFormStep(4); // Open directly at assignments step
    setSubjectsFilter('');
    setClassesFilter('');
    setShowModal(true);
  };

  const validateStep = (step: 1 | 2 | 3 | 4) => {
    const missing: string[] = [];

    if (step === 1) {
      if (!String(formData.lastName || '').trim()) missing.push(t('lastName'));
    }

    if (step === 2) {
      // Email is no longer strictly required if we want to reduce required fields
    }

    if (step === 3) {
      if (!String(formData.specialty || '').trim()) missing.push(t('specialty'));
    }

    // step 4 has no strict required fields (subjects/classes optional)

    if (missing.length > 0) {
      notify.error(`${t('requiredFields') || 'Champs obligatoires'}: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(formStep)) return;
    setFormStep((prev) => (prev === 4 ? 4 : ((prev + 1) as any)));
  };

  const goPrev = () => setFormStep((prev) => (prev === 1 ? 1 : ((prev - 1) as any)));

  const deleteTeacher = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/core/staff/${targetDeleteId}`);
      fetchTeachers();
    } catch (error) {
      notify.error('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  return (
    <div className="w-full">
      <div 
        style={{ marginBottom: 'var(--card-spacing)' }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t('teacherManagement')}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('teacherManagementDesc')}</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors text-xs font-semibold border border-primary/30 shadow-sm shadow-blue-500/10">
            <Upload className="w-3.5 h-3.5" />
            <span>{t('importExcel')}</span>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => {
              setSelectedTeacher(null);
              setFormData({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newTeacher')}</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et Filtres */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="w-full sm:w-64 md:w-80 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input 
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select 
              className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-[11px] px-2 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
            <option value="">{t('allStatuses')}</option>
            {(statusOptions || []).map((opt: any) => (
              <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
            ))}
            </select>
          </div>

          <select 
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-[11px] px-2 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.specialty}
            onChange={(e) => setFilters({...filters, specialty: e.target.value})}
          >
            <option value="">{t('allSpecialties')}</option>
            {(specialtyOptions || []).map((opt: any) => (
              <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
            ))}
          </select>

          <select 
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-[11px] px-2 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.contractType}
            onChange={(e) => setFilters({...filters, contractType: e.target.value})}
          >
            <option value="">{t('allContracts')}</option>
            {(contractOptions || []).map((opt: any) => (
              <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
            ))}
          </select>

          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all border ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border-gray-200 dark:border-slate-500' : 'text-gray-400 border-transparent'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all border ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 border-gray-200 dark:border-slate-500' : 'text-gray-400 border-transparent'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button 
            onClick={() => {
              setSearchTerm('');
              setFilters({ status: '', specialty: '', contractType: '' });
              setPagination({...pagination, page: 1});
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors border border-gray-200 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
            title={t('reset')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Liste des enseignants */}
      {loading && teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">{t('loadingSearch')}</p>
        </div>
      ) : backendError ? (
        <div className="bg-white dark:bg-slate-800 rounded-md p-20 text-center border border-dashed border-red-300 dark:border-red-700">
          <div className="w-48 h-48 mx-auto mb-6">
            <img src="/images/debrancher.jpg" alt="Connexion perdue" className="w-full h-full object-contain opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('serverConnectionLost')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('serverConnectionLostDesc')}</p>
          <button 
            onClick={fetchTeachers}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </button>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-md p-20 text-center border border-dashed border-gray-300 dark:border-slate-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('noStudentFound')}</h3>
          <p className="text-gray-500">{t('noStudentFoundDesc')}</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>{t('teacher')}</span>
                      <button 
                        onClick={() => setShowColumnFilters(!showColumnFilters)}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors ${
                          showColumnFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                        }`}
                        title={t('filterColumns')}
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">{t('gender')}</th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">{t('specialty')}</th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {teachers
                  .filter(teacher => {
                    const matchName = columnFilters.name === '' || 
                      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(columnFilters.name.toLowerCase());
                    const matchMatricule = columnFilters.matricule === '' || 
                      (teacher.matricule || '').toLowerCase().includes(columnFilters.matricule.toLowerCase());
                    const matchSpecialty = columnFilters.specialty === '' || 
                      (teacher.specialty || '').toLowerCase().includes(columnFilters.specialty.toLowerCase());
                    const matchStatus = columnFilters.status === '' || 
                      teacher.status === columnFilters.status;
                    const matchContact = columnFilters.contact === '' || 
                      (teacher.phoneNumber || '').toLowerCase().includes(columnFilters.contact.toLowerCase());
                    
                    return matchName && matchMatricule && matchSpecialty && matchStatus && matchContact;
                  })
                  .map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                            {teacher.photo ? (
                              <img src={teacher.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <User className="w-5 h-5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-normal text-gray-900 dark:text-white uppercase">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-xs text-gray-500">{teacher.email || t('noEmail')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-normal text-purple-600">{teacher.matricule || t('na')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-normal ${
                          teacher.gender === 'M' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                        }`}>
                          {teacher.gender === 'M' ? t('male') : t('female')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-700 dark:text-blue-400">
                          {teacher.specialty || t('notDefined')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-normal uppercase ${
                          teacher.status === 'Permanent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          teacher.status === 'Vacataire' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          teacher.status === 'Contractuel' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                        }`}>
                          {teacher.status || t('standard')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{teacher.phoneNumber || t('na')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenAssignments(teacher)}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors border border-purple-200 dark:border-purple-700"
                            title="Affecter matières/classes"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(teacher)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-700"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setTargetDeleteId(teacher.id);
                              setConfirmOpen(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors border border-red-200 dark:border-red-700"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div 
          style={{ gap: 'var(--card-spacing)' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {teachers.map(teacher => (
            <div 
              key={teacher.id} 
              style={{ padding: 'var(--card-spacing)' }}
              className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                      {teacher.photo ? (
                        <img src={teacher.photo} alt="Teacher" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-normal text-gray-900 dark:text-white uppercase">{teacher.firstName} {teacher.lastName}</h3>
                      <span className="text-xs font-mono text-purple-600 font-normal">{teacher.matricule || 'N/A'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEdit(teacher)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{teacher.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Tél: {teacher.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-3.5 h-3.5" />
                    <span className={`text-xs font-normal ${
                      teacher.gender === 'M' ? 'text-blue-600' : 'text-pink-600'
                    }`}>
                      {teacher.gender === 'M' ? t('male') : t('female')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-semibold">
                    <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-xs">
                      {teacher.specialty || 'Non définie'}
                    </div>
                    {teacher.status && (
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        teacher.status === 'Permanent' ? 'bg-emerald-100 text-emerald-700' :
                        teacher.status === 'Vacataire' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {teacher.status}
                      </div>
                    )}
                  </div>
                  
                  {/* Display number of classes and subjects if available */}
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700">
                      <LayoutGrid className="w-3 h-3" />
                      <span>{teacher.classes?.length || 0} classes</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700">
                      <BookOpen className="w-3 h-3" />
                      <span>{teacher.subjects?.length || 0} matières</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleEdit(teacher)}
                      className="text-xs text-blue-600 font-normal flex items-center gap-1 hover:underline"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t('modify')}
                    </button>
                    <button 
                      onClick={() => handleOpenAssignments(teacher)}
                      className="text-xs text-purple-600 font-normal flex items-center gap-1 hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('assign')}
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setTargetDeleteId(teacher.id);
                      setConfirmOpen(true);
                    }}
                    className="text-xs text-red-600 font-normal flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && teachers.length > 0 && (
        <div 
          style={{ 
            marginTop: 'var(--card-spacing)',
            padding: 'calc(var(--card-spacing) * 0.75)'
          }}
          className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('showingFromToOfTotal', { from: (pagination.page - 1) * pagination.limit + 1, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('perPage')}</span>
              <select 
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm px-2 py-1 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors border border-gray-200 dark:border-slate-600 rounded-md"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors border border-gray-200 dark:border-slate-600 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {[...Array(Math.min(5, pagination.lastPage))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[2rem] px-3 py-1.5 text-sm font-normal rounded-md transition-colors border ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.lastPage}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors border border-gray-200 dark:border-slate-600 rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.lastPage)}
              disabled={pagination.page === pagination.lastPage}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors border border-gray-200 dark:border-slate-600 rounded-md"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                {selectedTeacher ? t('editTeacher') : t('newTeacher')}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedTeacher(null);
                  setFormData({});
                  setFormStep(1);
                  setSubjectsFilter('');
                  setClassesFilter('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Wizard header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    {formStep === 1 ? t('personalInfo') : formStep === 2 ? t('contact') : formStep === 3 ? t('professionalInfo') : t('assignedClasses')}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {formStep}/4
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${(formStep / 4) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                  <div className={`text-center ${formStep === 1 ? 'text-blue-600 font-semibold' : ''}`}>1. {t('personalInfo')}</div>
                  <div className={`text-center ${formStep === 2 ? 'text-blue-600 font-semibold' : ''}`}>2. {t('contact')}</div>
                  <div className={`text-center ${formStep === 3 ? 'text-blue-600 font-semibold' : ''}`}>3. {t('professionalInfo')}</div>
                  <div className={`text-center ${formStep === 4 ? 'text-blue-600 font-semibold' : ''}`}>4. {t('assignedClasses')}</div>
                </div>
              </div>

              {/* Step 1: Identité */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('lastName')} *</label>
                      <input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('firstName')}</label>
                      <input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('birthDate')}</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('birthPlace')}</label>
                      <input
                        type="text"
                        value={formData.placeOfBirth || ''}
                        onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('gender')}</label>
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('select')}</option>
                        {(genderOptions || []).map((opt: any) => (
                          <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('maritalStatus')}</label>
                      <select
                        value={formData.maritalStatus || 'Célibataire'}
                        onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        {(maritalOptions || []).map((opt: any) => (
                          <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nationality')}</label>
                      <input
                        type="text"
                        value={formData.nationality || 'Ivoirienne'}
                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('idCardNumber')}</label>
                      <input
                        type="text"
                        value={formData.idCardNumber || ''}
                        onChange={(e) => setFormData({...formData, idCardNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase border-b border-gray-200 dark:border-slate-700 pb-2">
                      {t('contact')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                        <input
                          type="tel"
                          value={formData.phoneNumber || ''}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase border-b border-gray-200 dark:border-slate-700 pb-2">
                      {t('emergencyContact')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')}</label>
                        <input
                          type="text"
                          value={formData.emergencyContact?.name || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            emergencyContact: {...formData.emergencyContact, name: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={formData.emergencyContact?.phone || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('relationship')}</label>
                        <input
                          type="text"
                          value={formData.emergencyContact?.relationship || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pro */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase border-b border-gray-200 dark:border-slate-700 pb-2">
                      {t('professionalInfo')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('specialty')} *</label>
                        <select
                          value={formData.specialty || ''}
                          onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('select')}</option>
                          {(specialtyOptions || []).map((opt: any) => (
                            <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('degree')}</label>
                        <select
                          value={formData.diploma || ''}
                          onChange={(e) => setFormData({...formData, diploma: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('select')}</option>
                          {(degreeOptions || []).map((opt: any) => (
                            <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('teacherStatus')}</label>
                        <select
                          value={formData.status || 'Permanent'}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {(statusOptions || []).map((opt: any) => (
                            <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('teacherContract')}</label>
                        <select
                          value={formData.contractType || 'CDI'}
                          onChange={(e) => setFormData({...formData, contractType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {(contractOptions || []).map((opt: any) => (
                            <option key={opt.id} value={opt.value}>{getOptionLabel(opt)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hireDate')}</label>
                        <input
                          type="date"
                          value={formData.hireDate || ''}
                          onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('salary')}</label>
                        <input
                          type="number"
                          value={formData.salary || 0}
                          onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase border-b border-gray-200 dark:border-slate-700 pb-2">
                      {t('bankingInfo')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bankAccount')}</label>
                        <input
                          type="text"
                          value={formData.bankAccount || ''}
                          onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('socialSecurityNumber')}</label>
                        <input
                          type="text"
                          value={formData.socialSecurityNumber || ''}
                          onChange={(e) => setFormData({...formData, socialSecurityNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Assigned Classes */}
              {formStep === 4 && (
                <div>
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase">
                      {t('assignedClasses')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const current = formData.assignments || [];
                        setFormData({
                          ...formData,
                          assignments: [...current, { classId: 0, subjectId: 0 }]
                        });
                      }}
                      className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addAssignment')}</span>
                    </button>
                  </div>

                  {(!formData.assignments || formData.assignments.length === 0) ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-700/50 rounded-md border border-dashed border-gray-300 dark:border-slate-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('noAssignment')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.assignments.map((assignment, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-white dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm relative group">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                              {t('class')}
                            </label>
                            <select
                              value={assignment.classId || ''}
                              onChange={(e) => {
                                const newAssignments = [...(formData.assignments || [])];
                                newAssignments[index] = { ...newAssignments[index], classId: Number(e.target.value), subjectId: 0 };
                                setFormData({ ...formData, assignments: newAssignments });
                              }}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">{t('selectClass')}</option>
                              {(classesList || []).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name || getOptionLabel(c)}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                              {t('subject')}
                            </label>
                            <select
                              value={assignment.subjectId || ''}
                              onChange={(e) => {
                                const newAssignments = [...(formData.assignments || [])];
                                newAssignments[index] = { ...newAssignments[index], subjectId: Number(e.target.value) };
                                setFormData({ ...formData, assignments: newAssignments });
                              }}
                              disabled={!assignment.classId}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="">{t('selectSubject')}</option>
                              {(subjectsList || [])
                                .filter((s: any) => {
                                  const classId = Number(assignment.classId);
                                  return s.class?.id === classId || s.classId === classId;
                                })
                                .map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.name || getOptionLabel(s)}</option>
                                ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newAssignments = (formData.assignments || []).filter((_, i) => i !== index);
                              setFormData({ ...formData, assignments: newAssignments });
                            }}
                            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors border border-red-100 dark:border-red-900/30"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Wizard actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTeacher(null);
                    setFormData({});
                    setFormStep(1);
                    setSubjectsFilter('');
                    setClassesFilter('');
                  }}
                  className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
                >
                  {t('cancel')}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={formStep === 1}
                    className="px-4 py-2 text-sm font-normal rounded-md transition-colors border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    {t('previous') || 'Précédent'}
                  </button>

                  {formStep < 4 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="px-4 py-2 text-sm font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700"
                    >
                      {t('next') || 'Suivant'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700"
                    >
                      {selectedTeacher ? t('update') : t('save')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (deleteLoading) return;
          setConfirmOpen(false);
          setTargetDeleteId(null);
        }}
        onConfirm={deleteTeacher}
        title={t('deleteTeacher')}
        message={t('confirmDeleteTeacher')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
