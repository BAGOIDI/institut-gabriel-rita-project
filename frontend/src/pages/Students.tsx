import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  UserPlus, 
  GraduationCap, 
  Phone, 
  Calendar,
  MoreVertical,
  QrCode,
  Download,
  AlertCircle,
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
  List as ListIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  phoneNumber: string;
  parentPhoneNumber: string;
  classRoom: string;
  filiere: string;
  specialStatus: string;
  uniqueId: string;
  qrCode: string;
  dateOfBirth: string;
  gender: string; // M ou F
  photo: string;
}

export const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    classRoom: '',
    filiere: '',
    specialStatus: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    matricule: '',
    classRoom: '',
    status: '',
    contact: ''
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  
  const { language } = useTheme();
  const t = translations[language];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters, pagination.page, pagination.limit]);

  const fetchStudents = async () => {
    setLoading(true);
    setBackendError(false);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (filters.classRoom) params.append('classRoom', filters.classRoom);
      if (filters.filiere) params.append('filiere', filters.filiere);
      if (filters.specialStatus) params.append('specialStatus', filters.specialStatus);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const url = searchTerm || Object.values(filters).some(v => v) 
        ? `http://localhost:3000/students/search?${params.toString()}`
        : `http://localhost:3000/students?${params.toString()}`;

      const response = await axios.get(url);
      
      if (response.data.hits) {
        // Typesense response
        setStudents(response.data.hits.map((hit: any) => hit.document));
        setPagination(prev => ({
          ...prev,
          total: response.data.found,
          lastPage: Math.ceil(response.data.found / pagination.limit)
        }));
      } else {
        // Regular API response
        setStudents(response.data.items);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          lastPage: response.data.lastPage
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants', error);
      setBackendError(true);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

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
        await axios.post('http://localhost:3000/students/import', data);
        fetchStudents();
        alert('Importation réussie !');
      } catch (error) {
        alert('Erreur lors de l\'importation');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div 
        style={{ marginBottom: 'var(--card-spacing)' }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.studentManagement}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.studentManagementDesc}</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors text-xs font-normal border border-emerald-700">
            <Upload className="w-3.5 h-3.5" />
            <span>{t.importExcel}</span>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newStudent}</span>
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
            placeholder={t.searchPlaceholder}
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
              value={filters.classRoom}
              onChange={(e) => setFilters({...filters, classRoom: e.target.value})}
            >
              <option value="">{t.allClasses}</option>
              <option value="Terminale C">Terminale C</option>
              <option value="1ère D">1ère D</option>
              <option value="2nde A">2nde A</option>
              <option value="3ème">3ème</option>
            </select>
          </div>

          <select 
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-[11px] px-2 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.specialStatus}
            onChange={(e) => setFilters({...filters, specialStatus: e.target.value})}
          >
            <option value="">{t.allStatus}</option>
            <option value="Standard">{t.standard}</option>
            <option value="Boursier">{t.scholarship}</option>
            <option value="Orphelin">{t.orphan}</option>
            <option value="Récipiendaire">{t.recipient}</option>
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
              setFilters({ classRoom: '', filiere: '', specialStatus: '' });
              setPagination({...pagination, page: 1});
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors border border-gray-200 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
            title={t.reset}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Liste des étudiants (Vue Table ou Grille) */}
      {loading && students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">{t.loadingSearch}</p>
        </div>
      ) : backendError ? (
        <div className="bg-white dark:bg-slate-800 rounded-md p-20 text-center border border-dashed border-red-300 dark:border-red-700">
          <div className="w-48 h-48 mx-auto mb-6">
            <img src="/images/debrancher.png" alt="Connexion perdue" className="w-full h-full object-contain opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t.serverConnectionLost}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t.serverConnectionLostDesc}</p>
          <button 
            onClick={fetchStudents}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-md p-20 text-center border border-dashed border-gray-300 dark:border-slate-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.noStudentFound}</h3>
          <p className="text-gray-500">{t.noStudentFoundDesc}</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span>{t.student}</span>
                    <button 
                      onClick={() => setShowColumnFilters(!showColumnFilters)}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors ${
                        showColumnFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
                      }`}
                      title={t.filterColumns}
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Matricule</th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Genre</th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Classe</th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
              {showColumnFilters && (
                <tr className="bg-gray-100 dark:bg-slate-700/70 border-b border-gray-200 dark:border-slate-600">
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder={t.filterByName}
                      value={columnFilters.name}
                      onChange={(e) => setColumnFilters({...columnFilters, name: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder={t.filterByMatricule}
                      value={columnFilters.matricule}
                      onChange={(e) => setColumnFilters({...columnFilters, matricule: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder={t.filterByClass}
                      value={columnFilters.classRoom}
                      onChange={(e) => setColumnFilters({...columnFilters, classRoom: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </th>
                  <th className="px-6 py-2">
                    <select
                      value={columnFilters.status}
                      onChange={(e) => setColumnFilters({...columnFilters, status: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                      <option value="">{t.all}</option>
                      <option value="Boursier">{t.scholarship}</option>
                      <option value="Orphelin">{t.orphan}</option>
                      <option value="Standard">{t.standard}</option>
                    </select>
                  </th>
                  <th className="px-6 py-2">
                    <input
                      type="text"
                      placeholder={t.filterByContact}
                      value={columnFilters.contact}
                      onChange={(e) => setColumnFilters({...columnFilters, contact: e.target.value})}
                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </th>
                  <th className="px-6 py-2 text-right">
                    <button
                      onClick={() => setColumnFilters({ name: '', matricule: '', classRoom: '', status: '', contact: '' })}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-normal"
                    >
                      {t.reset}
                    </button>
                  </th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {students
                .filter(student => {
                  const matchName = columnFilters.name === '' || 
                    `${student.firstName} ${student.lastName}`.toLowerCase().includes(columnFilters.name.toLowerCase());
                  const matchMatricule = columnFilters.matricule === '' || 
                    student.matricule.toLowerCase().includes(columnFilters.matricule.toLowerCase());
                  const matchClassRoom = columnFilters.classRoom === '' || 
                    student.classRoom.toLowerCase().includes(columnFilters.classRoom.toLowerCase());
                  const matchStatus = columnFilters.status === '' || 
                    (student.specialStatus || 'Standard') === columnFilters.status;
                  const matchContact = columnFilters.contact === '' || 
                    (student.phoneNumber || '').toLowerCase().includes(columnFilters.contact.toLowerCase());
                  
                  return matchName && matchMatricule && matchClassRoom && matchStatus && matchContact;
                })
                .map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                        {student.photo ? (
                          <img src={student.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-normal text-gray-900 dark:text-white uppercase">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-gray-500">{student.filiere || 'Sans filière'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-normal text-blue-600">{student.matricule}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-normal ${
                      student.gender === 'M' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                    }`}>
                      {student.gender === 'M' ? '👨 M' : '👩 F'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs font-medium dark:text-gray-300">
                      {student.classRoom}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-normal uppercase ${
                      student.specialStatus === 'Boursier' ? 'bg-emerald-100 text-emerald-700' :
                      student.specialStatus === 'Orphelin' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                    }`}>
                      {student.specialStatus || 'Standard'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">{student.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
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
          {students.map(student => (
            <div 
              key={student.id} 
              style={{ padding: 'var(--card-spacing)' }}
              className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                      {student.photo ? (
                        <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-normal text-gray-900 dark:text-white uppercase">{student.firstName} {student.lastName}</h3>
                      <span className="text-xs font-mono text-blue-600 font-normal">{student.matricule}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.dateOfBirth}: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : t.na}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.phone}: {student.phoneNumber || t.na}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-semibold">
                    <div className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">
                      {student.classRoom}
                    </div>
                    {student.filiere && (
                      <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-xs">
                        {student.filiere || t.noMajor}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-normal text-gray-500 uppercase">{student.specialStatus || t.standard}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="text-xs text-blue-600 font-normal flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {t.showQr}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Control */}
      {!loading && students.length > 0 && (
        <div 
          style={{ 
            marginTop: 'var(--card-spacing)',
            padding: 'calc(var(--card-spacing) * 0.75)'
          }}
          className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t.showingFromToOfTotalStudents.replace('{from}', String((pagination.page - 1) * pagination.limit + 1)).replace('{to}', String(Math.min(pagination.page * pagination.limit, pagination.total))).replace('{total}', String(pagination.total))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t.perPage}</span>
              <select 
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-gray-50 dark:bg-slate-700 border-none rounded-lg text-sm px-2 py-1 dark:text-white focus:ring-2 focus:ring-blue-500"
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
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center px-4">
              <span className="text-sm font-normal text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                {pagination.page}
              </span>
              <span className="mx-2 text-gray-400 text-sm">sur</span>
              <span className="text-sm font-normal text-gray-700 dark:text-gray-300">
                {pagination.lastPage}
              </span>
            </div>

            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.lastPage}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handlePageChange(pagination.lastPage)}
              disabled={pagination.page === pagination.lastPage}
              className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal QR Code & Détails */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{t.studentCard}</h2>
              <p className="text-sm text-gray-500 italic">{selectedStudent.firstName} {selectedStudent.lastName}</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              {selectedStudent.photo && (
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-blue-50 dark:border-slate-700 shadow-xl">
                  <img src={selectedStudent.photo} alt="Student" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 bg-white rounded-xl shadow-inner border-4 border-gray-50">
                <QRCodeSVG value={selectedStudent.qrCode} size={200} />
              </div>
              
              <div className="w-full space-y-3 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Matricule:</span>
                  <span className="font-normal text-blue-600">{selectedStudent.matricule}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.uniqueId}:</span>
                  <span className="font-mono text-xs">{selectedStudent.uniqueId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Classe:</span>
                  <span className="font-normal">{selectedStudent.classRoom}</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition-colors">
                <Download className="w-4 h-4" />
                {t.downloadCard}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Étudiant */}
      {showModal && (
        <StudentForm 
          onClose={() => setShowModal(false)} 
          onSave={() => {
            setShowModal(false);
            fetchStudents();
          }} 
          translations={t}
        />
      )}
    </div>
  );
};

const StudentForm = ({ onClose, onSave, translations }: { onClose: () => void, onSave: () => void, translations: any }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    phoneNumber: '',
    parentPhoneNumber: '',
    classRoom: '',
    filiere: '',
    specialStatus: '',
    photo: ''
  });
  const [isuploading, setIsUploading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }
      
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/students', formData);
      onSave();
    } catch (error) {
      alert('Erreur lors de la création de l\'étudiant');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-8 my-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <Plus className="w-6 h-6 rotate-45" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase">{translations.newStudentRecord}</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo Upload Section */}
          <div className="md:col-span-2 flex justify-center mb-6">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-2xl bg-gray-100 dark:bg-slate-700 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
                isuploading ? 'border-blue-500 animate-pulse' : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-500'
              }`}>
                {isuploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">Chargement...</span>
                  </div>
                ) : formData.photo ? (
                  <div className="relative w-full h-full">
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, photo: ''})}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase">PHOTO</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  onChange={handlePhotoChange}
                  disabled={isuploading}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg scale-0 group-hover:scale-100 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nom</label>
            <input 
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Prénom</label>
            <input 
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Date de Naissance</label>
            <input 
              type="date"
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.dateOfBirth}
              onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.gender}</label>
            <select 
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.gender || 'M'}
              onChange={e => setFormData({...formData, gender: e.target.value})}
            >
              <option value="M">{translations.male}</option>
              <option value="F">{translations.female}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.class}</label>
            <input 
              required
              placeholder="Ex: Terminale C"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.classRoom}
              onChange={e => setFormData({...formData, classRoom: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.major}</label>
            <input 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.filiere || ''}
              onChange={e => setFormData({...formData, filiere: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.studentPhone}</label>
            <input 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.parentPhone}</label>
            <input 
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.parentPhoneNumber}
              onChange={e => setFormData({...formData, parentPhoneNumber: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">{translations.status}</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg dark:text-white"
              value={formData.specialStatus}
              onChange={e => setFormData({...formData, specialStatus: e.target.value})}
            >
              <option value="">{translations.standard}</option>
              <option value="Boursier">{translations.scholarship}</option>
              <option value="Orphelin">{translations.orphan}</option>
              <option value="Récipiendaire">{translations.recipient}</option>
            </select>
          </div>
          
          <div className="md:col-span-2 pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {translations.registerStudentRecord}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
