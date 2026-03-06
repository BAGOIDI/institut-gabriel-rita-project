import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  Upload,
  Calendar,
  Clock,
  User,
  BookOpen,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import api from '../services/api.service';
import SchedulePrintModal from '../components/SchedulePrintModal';

interface TimeSlot {
  id: string;
  day: string; // Lundi, Mardi, etc.
  startTime: string; // HH:mm
  endTime: string;
  subject: string;
  teacher: string;
  teacherId: string;
  class: string;
  classId: string;
  room: string;
  color: string;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

const SUBJECT_COLORS = [
  { name: 'Mathématiques', color: '#3b82f6', bg: '#eff6ff' },
  { name: 'Physique-Chimie', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Français', color: '#ec4899', bg: '#fdf2f8' },
  { name: 'Anglais', color: '#f59e0b', bg: '#fffbeb' },
  { name: 'SVT', color: '#10b981', bg: '#f0fdf4' },
  { name: 'Histoire-Géo', color: '#f97316', bg: '#fff7ed' },
  { name: 'EPS', color: '#06b6d4', bg: '#ecfeff' },
  { name: 'Philosophie', color: '#6366f1', bg: '#eef2ff' },
  { name: 'Informatique', color: '#14b8a6', bg: '#f0fdfa' },
];

export const Timetable = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState('Terminale C');
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'room'>('class');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week'); // Vue calendrier
  const [currentDate, setCurrentDate] = useState(new Date()); // Date actuelle
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Listes pour les dropdowns
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  // Formulaire
  const [formData, setFormData] = useState({
    day: 'Lundi',
    startTime: '08:00',
    endTime: '09:00',
    subject: '',
    teacher: '',
    teacherId: '',
    class: '',
    classId: '',
    room: '',
  });

  useEffect(() => {
    fetchTimetable();
    fetchTeachers();
    fetchClasses();
    fetchRooms();
  }, [selectedFilter, viewMode]);

  // Initialiser le filtre avec la première valeur disponible
  useEffect(() => {
    if (viewMode === 'class' && classes.length > 0 && !selectedFilter) {
      setSelectedFilter(classes[0]);
    } else if (viewMode === 'teacher' && teachers.length > 0 && !selectedFilter) {
      setSelectedFilter(`${teachers[0].firstName} ${teachers[0].lastName}`);
    } else if (viewMode === 'room' && rooms.length > 0 && !selectedFilter) {
      setSelectedFilter(rooms[0]);
    }
  }, [viewMode, classes, teachers, rooms]);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/api/core/teachers');
      setTeachers(response.data.items || response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants', error);
    }
  };

  const fetchClasses = async () => {
    try {
      // Liste des classes - pourrait venir d'une API dédiée
      setClasses([
        'Terminale C',
        'Terminale D',
        '1ère C',
        '1ère D',
        '2nde A',
        '2nde C',
        '3ème',
        '4ème',
        '5ème',
        '6ème'
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des classes', error);
    }
  };

  const fetchRooms = async () => {
    try {
      // Liste des salles - pourrait venir d'une API dédiée
      setRooms([
        'Salle 101',
        'Salle 102',
        'Salle 103',
        'Salle 201',
        'Salle 202',
        'Laboratoire Physique',
        'Laboratoire Chimie',
        'Laboratoire SVT',
        'Salle Informatique',
        'Gymnase',
        'Bibliothèque'
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des salles', error);
    }
  };

  // Génération dynamique des jours selon la vue
  const displayDays = useMemo(() => {
    if (calendarView === 'day') {
      return [currentDate];
    } else if (calendarView === 'week') {
      // Obtenir le lundi de la semaine
      const monday = new Date(currentDate);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      
      // Générer les 6 jours (Lundi à Samedi)
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date;
      });
    } else {
      // Vue mois : afficher seulement la première semaine pour la vue détaillée
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      
      // Obtenir le lundi de la première semaine du mois
      const monday = new Date(firstDay);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      
      // Générer les 6 jours (Lundi à Samedi)
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date;
      });
    }
  }, [calendarView, currentDate]);

  // Générer toutes les semaines du mois pour la vue mois
  const monthWeeks = useMemo(() => {
    if (calendarView !== 'month') return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Obtenir le lundi de la première semaine
    const startMonday = new Date(firstDay);
    const startDay = startMonday.getDay();
    const startDiff = startMonday.getDate() - startDay + (startDay === 0 ? -6 : 1);
    startMonday.setDate(startDiff);
    
    // Générer toutes les semaines jusqu'à couvrir le dernier jour du mois
    const weeks: Date[][] = [];
    let currentWeekStart = new Date(startMonday);
    
    while (currentWeekStart <= lastDay || weeks.length === 0 || weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1] < lastDay) {
      const week = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
      });
      weeks.push(week);
      
      // Passer à la semaine suivante
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      
      // Éviter les boucles infinies
      if (weeks.length > 6) break;
    }
    
    return weeks;
  }, [calendarView, currentDate]);

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      // Vue mois : naviguer par mois
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      // Vue mois : naviguer par mois
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formater le titre de la période
  const getPeriodTitle = () => {
    if (calendarView === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (calendarView === 'week') {
      const firstDay = displayDays[0];
      const lastDay = displayDays[displayDays.length - 1];
      return `${firstDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let url;
      if (viewMode === 'class') {
        url = `/api/planning/schedule/class/${selectedFilter}`;
      } else if (viewMode === 'teacher') {
        url = `/api/planning/schedule/teacher/${encodeURIComponent(selectedFilter)}`;
      } else {
        url = `/api/planning/schedule/room/${encodeURIComponent(selectedFilter)}`;
      }
      
      const response = await api.get(url);
      const data = response.data;
      
      // Mapper les données du backend vers le format attendu
      const mappedSlots: TimeSlot[] = Array.isArray(data) ? data.map((slot: any) => ({
        id: slot.id?.toString() || `temp-${Math.random()}`,
        day: DAYS[slot.dayOfWeek - 1] || 'Lundi',
        startTime: slot.startTime?.substring(0, 5) || '08:00',
        endTime: slot.endTime?.substring(0, 5) || '09:00',
        subject: slot.subjectName || slot.subject || '',
        teacher: slot.teacherName || slot.teacher || '',
        teacherId: slot.teacherId || '',
        class: slot.className || slot.class || '',
        classId: slot.classId || '',
        room: slot.room || '',
        color: SUBJECT_COLORS.find(s => s.name === slot.subjectName)?.color || '#3b82f6',
      })) : [];
      
      setTimeSlots(mappedSlots);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps', error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getColorForSubject = (subject: string) => {
    const found = SUBJECT_COLORS.find(s => s.name === subject);
    return found || { color: '#6b7280', bg: '#f3f4f6' };
  };

  const getTimeSlotHeight = (startTime: string, endTime: string) => {
    const start = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const end = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const duration = end - start;
    return (duration / 30) * 60; // 60px par tranche de 30min
  };

  const getTimeSlotTop = (startTime: string) => {
    const start = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const firstSlot = 7 * 60; // 07:00
    const offset = start - firstSlot;
    return (offset / 30) * 60; // 60px par tranche de 30min
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const colors = getColorForSubject(formData.subject);
      const newSlot = {
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        teacherId: formData.teacherId,
        class: formData.class,
        room: formData.room,
      };

      if (selectedSlot) {
        await api.put(`/api/planning/schedule/${selectedSlot.id}`, newSlot);
      } else {
        // Pour création, utiliser l'endpoint POST
        await api.post(`/api/planning/schedule`, newSlot);
      }
      
      setShowModal(false);
      setSelectedSlot(null);
      setFormData({
        day: 'Lundi',
        startTime: '08:00',
        endTime: '09:00',
        subject: '',
        teacher: '',
        teacherId: '',
        class: '',
        classId: '',
        room: '',
      });
      fetchTimetable();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;
    
    try {
      await api.delete(`/api/planning/schedule/${slotId}`);
      fetchTimetable();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleDragStart = (slot: TimeSlot) => {
    setDraggedSlot(slot);
  };

  const handleDrop = async (day: string, time: string) => {
    if (!draggedSlot) return;

    try {
      const updateData = {
        day,
        startTime: time,
        endTime: draggedSlot.endTime,
        subject: draggedSlot.subject,
        teacherId: draggedSlot.teacherId,
        class: draggedSlot.class,
        room: draggedSlot.room,
      };
      
      await api.put(`/api/planning/schedule/${draggedSlot.id}`, updateData);
      fetchTimetable();
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      alert('Erreur lors du déplacement');
    } finally {
      setDraggedSlot(null);
    }
  };

  const handleExport = () => {
    // Ancienne fonction export
    alert('Export en cours...');
  };

  const handlePrintSchedule = () => {
    // Préparer les données pour l'impression
    const scheduleData = {
      title: `Emploi du temps - ${viewMode === 'class' ? selectedFilter : viewMode === 'teacher' ? selectedFilter : selectedFilter}`,
      period: getPeriodTitle(),
      slots: timeSlots,
      viewMode,
      filter: selectedFilter,
      dateGenerated: new Date().toISOString(),
    };
    
    // Ouvrir le modal d'impression
    setShowPrintModal(true);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div 
        style={{ marginBottom: 'var(--card-spacing)' }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">EMPLOI DU TEMPS</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Planification des cours et salles</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrintSchedule}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-emerald-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORTER</span>
          </button>
          <button 
            onClick={() => {
              setSelectedSlot(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-normal border border-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NOUVEAU CRÉNEAU</span>
          </button>
        </div>
      </div>

      {/* Barre de navigation temporelle */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between"
      >
        {/* Navigation gauche */}
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-normal transition-colors border border-blue-700"
          >
            Aujourd'hui
          </button>
          <button 
            onClick={goToPrevious}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600 text-xs font-normal text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>
              {calendarView === 'day' && 'Jour précédent'}
              {calendarView === 'week' && 'Semaine précédente'}
              {calendarView === 'month' && 'Mois précédent'}
            </span>
          </button>
          <button 
            onClick={goToNext}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600 text-xs font-normal text-gray-700 dark:text-gray-300"
          >
            <span>
              {calendarView === 'day' && 'Jour suivant'}
              {calendarView === 'week' && 'Semaine suivante'}
              {calendarView === 'month' && 'Mois suivant'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="text-sm font-bold text-gray-900 dark:text-white ml-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600">
            {getPeriodTitle()}
          </div>
        </div>

        {/* Sélecteur de vue calendrier */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Année:</span>
          <select 
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(parseInt(e.target.value));
              setCurrentDate(newDate);
            }}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() - 3 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">Mois:</span>
          <select 
            value={currentDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(e.target.value));
              setCurrentDate(newDate);
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
          
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">Affichage:</span>
          <select 
            value={calendarView}
            onChange={(e) => setCalendarView(e.target.value as 'day' | 'week' | 'month')}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
        </div>
      </div>

      {/* Filtres */}
      <div 
        style={{ 
          padding: 'calc(var(--card-spacing) * 0.75)',
          marginBottom: 'var(--card-spacing)'
        }}
        className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vue:</span>
          <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600">
            <button 
              onClick={() => {
                setViewMode('class');
                setSelectedFilter(classes[0] || '');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewMode === 'class' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Par Classe
            </button>
            <button 
              onClick={() => {
                setViewMode('teacher');
                if (teachers.length > 0) {
                  setSelectedFilter(`${teachers[0].firstName} ${teachers[0].lastName}`);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewMode === 'teacher' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Par Enseignant
            </button>
            <button 
              onClick={() => {
                setViewMode('room');
                setSelectedFilter(rooms[0] || '');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewMode === 'room' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Par Salle
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {viewMode === 'class' && (
              <>
                {classes.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </>
            )}
            {viewMode === 'teacher' && (
              <>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={`${teacher.firstName} ${teacher.lastName}`}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </>
            )}
            {viewMode === 'room' && (
              <>
                {rooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Calendrier */}
      {calendarView === 'month' ? (
        // Vue mois : grille avec jours en colonnes et semaines en lignes
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* En-têtes des jours */}
              <div 
                className="grid border-b border-gray-200 dark:border-slate-700"
                style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              >
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((dayName) => (
                  <div 
                    key={dayName}
                    className="bg-gray-50 dark:bg-slate-700/50 p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                  >
                    <div className="text-xs font-bold uppercase text-gray-900 dark:text-white">
                      {dayName}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grille des semaines */}
              <div>
                {monthWeeks.map((week, weekIndex) => {
                  const currentMonth = currentDate.getMonth();
                  return (
                    <div 
                      key={weekIndex}
                      className="grid border-b border-gray-200 dark:border-slate-700 last:border-b-0"
                      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                    >
                      {week.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isCurrentMonth = date.getMonth() === currentMonth;
                        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
                        // Normaliser le nom du jour pour la comparaison (première lettre en majuscule)
                        const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                        const daySlots = timeSlots.filter(slot => slot.day === normalizedDayName);
                        
                        return (
                          <div 
                            key={dayIndex}
                            className={`min-h-[120px] p-2 border-r border-gray-200 dark:border-slate-700 last:border-r-0 relative ${
                              isCurrentMonth ? '' : 'bg-gray-50/50 dark:bg-slate-900/20'
                            } ${
                              isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {/* Numéro du jour */}
                            <div className={`text-xs font-bold mb-2 ${
                              isToday ? 'text-blue-600 dark:text-blue-400' : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                            }`}>
                              {date.getDate()}
                            </div>
                            
                            {/* Créneaux de cours en version compacte */}
                            <div className="space-y-1">
                              {daySlots.slice(0, 3).map((slot) => {
                                const colors = getColorForSubject(slot.subject);
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setFormData({
                                        day: slot.day,
                                        startTime: slot.startTime,
                                        endTime: slot.endTime,
                                        subject: slot.subject,
                                        teacher: slot.teacher,
                                        teacherId: slot.teacherId || '',
                                        class: slot.class,
                                        classId: slot.classId || '',
                                        room: slot.room,
                                      });
                                      setShowModal(true);
                                    }}
                                    style={{
                                      backgroundColor: colors.bg,
                                      borderLeft: `3px solid ${colors.color}`,
                                    }}
                                    className="rounded-sm p-1 cursor-pointer hover:shadow-md transition-shadow text-[10px]"
                                  >
                                    <div 
                                      className="font-bold truncate"
                                      style={{ color: colors.color }}
                                    >
                                      {slot.subject}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 truncate">
                                      {slot.startTime}
                                    </div>
                                  </div>
                                );
                              })}
                              {daySlots.length > 3 && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center">
                                  +{daySlots.length - 3} autres
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Vue jour et semaine : affichage temporel classique
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
            {/* En-têtes des jours */}
            <div 
              className="grid border-b border-gray-200 dark:border-slate-700"
              style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}
            >
              <div className="bg-gray-50 dark:bg-slate-700/50 p-3 border-r border-gray-200 dark:border-slate-700">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              {displayDays.map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const dayName = date.toLocaleDateString('fr-FR', { weekday: calendarView === 'month' ? 'short' : 'long' });
                return (
                  <div 
                    key={index}
                    className={`bg-gray-50 dark:bg-slate-700/50 p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`text-xs font-bold uppercase ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {dayName}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${
                      isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'
                    }`}>
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grille horaire */}
            <div className="relative">
              <div 
                className="grid"
                style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}
              >
                {/* Colonne des heures */}
                <div className="border-r border-gray-200 dark:border-slate-700">
                  {TIME_SLOTS.map((time, idx) => (
                    <div 
                      key={time}
                      className={`h-[60px] px-2 flex items-start justify-end text-[10px] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700/50 ${
                        idx % 2 === 0 ? 'font-medium' : 'font-normal'
                      }`}
                    >
                      {idx % 2 === 0 ? time : ''}
                    </div>
                  ))}
                </div>

                {/* Colonnes des jours */}
                {displayDays.map((date, index) => {
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
                  // Normaliser le nom du jour pour la comparaison (première lettre en majuscule)
                  const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                  return (
                    <div 
                      key={index}
                      className="relative border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                    >
                      {/* Lignes de fond */}
                      {TIME_SLOTS.map((time) => (
                        <div
                          key={`${normalizedDayName}-${time}`}
                          className="h-[60px] border-b border-gray-100 dark:border-slate-700/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(normalizedDayName, time)}
                          onClick={() => {
                            setFormData({ ...formData, day: normalizedDayName, startTime: time });
                            setShowModal(true);
                          }}
                        />
                      ))}

                      {/* Créneaux de cours */}
                      {timeSlots
                        .filter(slot => slot.day === normalizedDayName)
                        .map((slot) => {
                        const colors = getColorForSubject(slot.subject);
                        const height = getTimeSlotHeight(slot.startTime, slot.endTime);
                        const top = getTimeSlotTop(slot.startTime);

                        return (
                          <div
                            key={slot.id}
                            draggable
                            onDragStart={() => handleDragStart(slot)}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setFormData({
                                day: slot.day,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                subject: slot.subject,
                                teacher: slot.teacher,
                                teacherId: slot.teacherId || '',
                                class: slot.class,
                                classId: slot.classId || '',
                                room: slot.room,
                              });
                              setShowModal(true);
                            }}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: colors.bg,
                              borderLeft: `3px solid ${colors.color}`,
                            }}
                            className="absolute left-1 right-1 rounded-md shadow-sm hover:shadow-md transition-all cursor-move group overflow-hidden"
                          >
                            <div className="p-2 h-full flex flex-col justify-between">
                              <div>
                                <div 
                                  className="text-xs font-bold mb-0.5 truncate"
                                  style={{ color: colors.color }}
                                >
                                  {slot.subject}
                                </div>
                                <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {slot.teacher}
                                </div>
                                <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {slot.room}
                                </div>
                              </div>
                              <div className="text-[9px] font-medium text-gray-500">
                                {slot.startTime} - {slot.endTime}
                              </div>
                            </div>

                            {/* Actions au survol */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(slot.id);
                                }}
                                className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div 
        style={{ marginTop: 'var(--card-spacing)' }}
        className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-4"
      >
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase">Légende</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SUBJECT_COLORS.map((subject) => (
            <div key={subject.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{subject.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase">
                {selectedSlot ? 'MODIFIER CRÉNEAU' : 'NOUVEAU CRÉNEAU'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedSlot(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jour *</label>
                  <select
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Matière *</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {SUBJECT_COLORS.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de fin *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enseignant *</label>
                  <select
                    required
                    value={formData.teacherId || ''}
                    onChange={(e) => {
                      const selectedTeacher = teachers.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData, 
                        teacherId: e.target.value,
                        teacher: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un enseignant...</option>
                    {teachers.length === 0 && (
                      <option value="" disabled>Chargement des enseignants...</option>
                    )}
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} {teacher.specialty ? `- ${teacher.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Classe *</label>
                  <select
                    required
                    value={formData.class || ''}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une classe...</option>
                    {classes.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Salle *</label>
                  <select
                    required
                    value={formData.room || ''}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une salle...</option>
                    {rooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedSlot(null);
                  }}
                  className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700"
                >
                  {selectedSlot ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal d'impression */}
      <SchedulePrintModal
        scheduleData={{
          title: `Emploi du temps - ${viewMode === 'class' ? selectedFilter : viewMode === 'teacher' ? selectedFilter : selectedFilter}`,
          period: getPeriodTitle(),
          slots: timeSlots,
          viewMode,
          filter: selectedFilter,
          dateGenerated: new Date().toISOString(),
        }}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};
