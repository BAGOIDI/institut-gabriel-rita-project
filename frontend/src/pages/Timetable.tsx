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
  Save,
  Loader2,
  RefreshCw,
  Printer
} from 'lucide-react';
import api from '../services/api.service';
import SchedulePrintModal from '../components/SchedulePrintModal';
import reportService from '../services/report.service';
import { useTheme } from '../contexts/ThemeContext';
import { SystemOptionsService, SystemOption } from '../services/system-options.service';
import { CoreService } from '../services/core.service';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotification } from '../contexts/NotificationContext';
import ClassTimetableView from '../components/ClassTimetableView';
import FreeSlotFinder from '../components/FreeSlotFinder';
import Tooltip from '../components/Tooltip';
import SearchableSelect from '../components/SearchableSelect';

interface TimeSlot {
  id: string;
  dayOfWeek: number; // 1=Lundi ... 6=Samedi
  startTime: string; // HH:mm
  endTime: string;
  subjectId: number;
  subjectName: string;
  staffId: number;
  teacherName: string;
  classId: number;
  className: string;
  roomName: string;
  color: string;
}

export const Timetable = () => {
  const { language } = useTheme();
  const notify = useNotification();

  // 1. Tous les states en premier
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'synthesis_class' | 'free_slot'>(
    () => (localStorage.getItem('timetable_viewMode') as any) || 'class'
  );
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>(
    () => localStorage.getItem('timetable_selectedFilter') || ''
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSpecialtySelector, setShowSpecialtySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  const [conflictingSlot, setConflictingSlot] = useState<TimeSlot | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'day' | 'evening' | 'all'>(
    () => (localStorage.getItem('timetable_viewPeriod') as any) || 'all'
  );

  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<SystemOption[]>([]);
  const [days, setDays] = useState<SystemOption[]>([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState<SystemOption[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem('timetable_selectedSpecialties');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
  );
  
  const [selectedSynthesisClasses, setSelectedSynthesisClasses] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem('timetable_selectedSynthesisClasses');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
  );

  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    subjectId: '',
    staffId: '',
    classId: '',
    roomName: '',
  });

  // 2. Tous les useMemo après les states
  const filteredClasses = useMemo(() => {
    let result = classes;
    if (formData.subjectId) {
      const subject = subjects.find(s => String(s.id) === formData.subjectId);
      if (subject?.class) {
        result = result.filter(c => String(c.id) === String(subject.class.id));
      }
    }
    if (formData.staffId) {
      const teacherSubjects = subjects.filter(s => s.teacher && String(s.teacher.id) === formData.staffId);
      const classIds = new Set(teacherSubjects.map(s => s.class ? String(s.class.id) : null).filter(Boolean));
      result = result.filter(c => classIds.has(String(c.id)));
    }
    return result;
  }, [classes, subjects, formData.subjectId, formData.staffId]);

  const filteredSubjects = useMemo(() => {
    let result = subjects;
    if (formData.classId) {
      result = result.filter(s => s.class && String(s.class.id) === formData.classId);
    }
    if (formData.staffId) {
      result = result.filter(s => s.teacher && String(s.teacher.id) === formData.staffId);
    }
    return result;
  }, [subjects, formData.classId, formData.staffId]);

  const filteredTeachers = useMemo(() => {
    let result = teachers;
    if (formData.classId) {
      const classSubjects = subjects.filter(s => s.class && String(s.class.id) === formData.classId);
      const teacherIds = new Set(classSubjects.map(s => s.teacher ? String(s.teacher.id) : null).filter(Boolean));
      result = result.filter(t => teacherIds.has(String(t.id)));
    }
    if (formData.subjectId) {
      const subject = subjects.find(s => String(s.id) === formData.subjectId);
      if (subject?.teacher) {
        result = result.filter(t => String(t.id) === String(subject.teacher.id));
      }
    }
    return result;
  }, [teachers, subjects, formData.classId, formData.subjectId]);

  const LOCAL_TIME_SLOTS = useMemo(() => {
    const allSlots = [
      { type: 'Cours', value: '08:00', end: '09:50', labelFr: '08:00 - 09:50', labelEn: '08:00 - 09:50' },
      { type: 'PP',    value: '09:50', end: '10:05', labelFr: '09:50 - 10:05', labelEn: '09:50 - 10:05' },
      { type: 'Cours', value: '10:05', end: '12:00', labelFr: '10:05 - 12:00', labelEn: '10:05 - 12:00' },
      { type: 'GP',    value: '12:00', end: '13:00', labelFr: '12:00 - 13:00', labelEn: '12:00 - 13:00' },
      { type: 'Cours', value: '13:00', end: '14:50', labelFr: '13:00 - 14:50', labelEn: '13:00 - 14:50' },
      { type: 'PP',    value: '14:50', end: '15:05', labelFr: '14:50 - 15:05', labelEn: '14:50 - 15:05' },
      { type: 'Cours', value: '15:05', end: '17:00', labelFr: '15:05 - 17:00', labelEn: '15:05 - 17:00' },
      { type: 'Cours', value: '17:30', end: '19:20', labelFr: '17:30 - 19:20', labelEn: '17:30 - 19:20' },
      { type: 'PP',    value: '19:20', end: '19:35', labelFr: '19:20 - 19:35', labelEn: '19:20 - 19:35' },
      { type: 'Cours', value: '19:35', end: '21:00', labelFr: '19:35 - 21:00', labelEn: '19:35 - 21:00' },
    ];
    
    if (viewPeriod === 'day') {
      return allSlots.filter(s => s.value < '17:30');
    } else if (viewPeriod === 'evening') {
      return allSlots.filter(s => s.value >= '17:30');
    }
    return allSlots;
  }, [viewPeriod]);

  const LOCAL_TIME_OPTIONS: SystemOption[] = useMemo(() => {
    return LOCAL_TIME_SLOTS.map((s, idx) => ({
      id: idx + 1,
      category: 'TIMETABLE_TIME_SLOT',
      value: s.value,
      labelFr: s.labelFr,
      labelEn: s.labelEn,
      label: s.labelFr,
      isActive: true,
    }));
  }, [LOCAL_TIME_SLOTS]);

  const LOCAL_END_TIMES = useMemo(() => {
    return Array.from(new Set(LOCAL_TIME_SLOTS.map(s => s.end)));
  }, [LOCAL_TIME_SLOTS]);

  // 3. Tous les useEffect après les useMemo
  useEffect(() => {
    const checkConflicts = () => {
      if (!showModal) {
        setConflictingSlot(null);
        return;
      }

      const { dayOfWeek, startTime, endTime, staffId, classId, roomName } = formData;
      if (!dayOfWeek || !startTime || !endTime) {
        setConflictingSlot(null);
        return;
      }

      const conflict = timeSlots.find(slot => {
        if (selectedSlot && slot.id === selectedSlot.id) return false; // Ne pas se comparer à soi-même

        const sameDay = String(slot.dayOfWeek) === dayOfWeek;
        const overlaps = slot.startTime < endTime && slot.endTime > startTime;

        if (sameDay && overlaps) {
          if (staffId && String(slot.staffId) === staffId) return true;
          if (classId && String(slot.classId) === classId) return true;
          if (roomName && slot.roomName === roomName) return true;
        }
        return false;
      });

      setConflictingSlot(conflict || null);
    };

    checkConflicts();
  }, [formData, timeSlots, showModal, selectedSlot]);

  useEffect(() => {
    localStorage.setItem('timetable_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('timetable_selectedFilter', selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    localStorage.setItem('timetable_selectedSpecialties', JSON.stringify(selectedSpecialties));
  }, [selectedSpecialties]);

  useEffect(() => {
    localStorage.setItem('timetable_selectedSynthesisClasses', JSON.stringify(selectedSynthesisClasses));
  }, [selectedSynthesisClasses]);

  useEffect(() => {
    localStorage.setItem('timetable_viewPeriod', viewPeriod);
  }, [viewPeriod]);

  useEffect(() => {
    setTimeSlotOptions(LOCAL_TIME_OPTIONS);
  }, [LOCAL_TIME_OPTIONS]);

  useEffect(() => {
    loadDynamicOptions();
  }, []);



  // Jours de la semaine par défaut
  const DEFAULT_DAYS: SystemOption[] = useMemo(() => ([
    { id: 1, category: 'TIMETABLE_DAY', value: '1', labelFr: 'Lundi', labelEn: 'Monday', label: 'Lundi', isActive: true },
    { id: 2, category: 'TIMETABLE_DAY', value: '2', labelFr: 'Mardi', labelEn: 'Tuesday', label: 'Mardi', isActive: true },
    { id: 3, category: 'TIMETABLE_DAY', value: '3', labelFr: 'Mercredi', labelEn: 'Wednesday', label: 'Mercredi', isActive: true },
    { id: 4, category: 'TIMETABLE_DAY', value: '4', labelFr: 'Jeudi', labelEn: 'Thursday', label: 'Jeudi', isActive: true },
    { id: 5, category: 'TIMETABLE_DAY', value: '5', labelFr: 'Vendredi', labelEn: 'Friday', label: 'Vendredi', isActive: true },
    { id: 6, category: 'TIMETABLE_DAY', value: '6', labelFr: 'Samedi', labelEn: 'Saturday', label: 'Samedi', isActive: true },
  ]), []);

  const loadDynamicOptions = async () => {
    try {
      setLoading(true);
      setTimeSlotOptions(LOCAL_TIME_OPTIONS);
      const toArray = (v: any) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (Array.isArray(v.items)) return v.items;
        if (Array.isArray(v.data)) return v.data;
        return [];
      };
      const [
        daysRes, 
        roomsRes, 
        classesRes, 
        teachersRes,
        subjectsRes,
        specialtiesRes
      ] = await Promise.all([
        SystemOptionsService.getByCategory('TIMETABLE_DAY').catch(() => ({ items: [] })),
        SystemOptionsService.getByCategory('TIMETABLE_ROOM').catch(() => ({ items: [] })),
        // Le backend /classes n'accepte pas "limit" (ValidationPipe forbidNonWhitelisted)
        CoreService.getAll('classes').catch(() => ({ items: [] })),
        // Le backend /staff peut refuser des query params non whitelistés
        CoreService.getAll('staff').catch(() => ({ items: [] })),
        // Le backend /subjects n'accepte pas "limit" (ValidationPipe forbidNonWhitelisted)
        CoreService.getAll('subjects').catch(() => ({ items: [] })),
        CoreService.getAll('specialties').catch(() => ({ items: [] }))
      ]);

      let daysArr = toArray(daysRes);
      if (daysArr.length === 0) {
        daysArr = DEFAULT_DAYS;
      }
      const roomsArr = toArray(roomsRes);
      setDays(daysArr);
      setRooms(roomsArr);
      // Créneaux horaires issus du frontend pour l'instant
      setTimeSlotOptions(LOCAL_TIME_OPTIONS);
      const classesArr = toArray(classesRes);
      const teachersArr = toArray(teachersRes);
      const subjectsArr = toArray(subjectsRes);
      const specialtiesArr = toArray(specialtiesRes);

      const classesSorted = classesArr.slice().sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
      const teachersSorted = teachersArr.slice().sort((a: any, b: any) => {
        const an = `${a.firstName} ${a.lastName}`.trim();
        const bn = `${b.firstName} ${b.lastName}`.trim();
        return an.localeCompare(bn);
      });
      const subjectsSorted = subjectsArr.slice().sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
      const specialtiesSorted = specialtiesArr.slice().sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
      setClasses(classesSorted);
      setTeachers(teachersSorted);
      setSubjects(subjectsSorted);
      setSpecialties(specialtiesSorted);
      if (selectedSpecialties.length === 0) {
        setSelectedSpecialties(specialtiesSorted.map(s => s.id));
      }

      // Set default values if not set
      if (daysArr.length > 0 && !formData.dayOfWeek) {
        const v = String((daysArr[0] as any).value ?? daysArr[0].id ?? '1');
        setFormData(prev => ({ ...prev, dayOfWeek: v }));
      }
      if (!selectedFilter) {
        if (viewMode === 'class' && classesArr.length > 0) {
          setSelectedFilter(String(classesArr[0].id));
        } else if (viewMode === 'teacher' && teachersArr.length > 0) {
          const t = teachersArr[0];
          setSelectedFilter(String(t.id));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options', error);
      setTimeSlotOptions(LOCAL_TIME_OPTIONS);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (option: SystemOption | any) => {
    if (!option) return '';
    if (option.labelFr && language === 'fr') return option.labelFr;
    if (option.labelEn && language === 'en') return option.labelEn;
    return option.label || option.name || option.value || '';
  };

  const getDayOfWeekFromDate = (date: Date) => {
    const js = date.getDay(); // 0=Sunday
    return js === 0 ? 7 : js; // 1=Mon ... 6=Sat, 7=Sun
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

  const refreshTimetableData = async () => {
    setLoading(true);
    try {
      let url;
      const params: any = {};
      if (viewMode === 'teacher') {
        url = `/api/planning/schedules/staff/${selectedFilter}`;
      } else {
        url = `/api/planning/schedules`;
        if (viewMode === 'class' && selectedFilter) {
          params.classId = selectedFilter;
        }
      }
      
      const response = await api.get(url, { params });
      const data = response.data;
      
      // Mapper les données du backend vers le format attendu
      const mappedSlots: TimeSlot[] = Array.isArray(data) ? data.map((slot: any) => {
        const subjectObj = subjects.find((s: any) => String(s.id) === String(slot.subjectId));
        const teacherObj = teachers.find((t: any) => String(t.id) === String(slot.staffId));
        const classObj = classes.find((c: any) => String(c.id) === String(slot.classId));

        const subjectName = subjectObj?.name || `Matière #${slot.subjectId ?? ''}`.trim();
        const teacherName = teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}`.trim() : `Enseignant #${slot.staffId ?? ''}`.trim();
        const className = classObj?.name || `Classe #${slot.classId ?? ''}`.trim();

        return {
          id: slot.id?.toString() || `temp-${Math.random()}`,
          dayOfWeek: Number(slot.dayOfWeek) || 1,
          startTime: String(slot.startTime || '').substring(0, 5) || '08:00',
          endTime: String(slot.endTime || '').substring(0, 5) || '09:00',
          subjectId: Number(slot.subjectId) || 0,
          subjectName,
          staffId: Number(slot.staffId) || 0,
          teacherName,
          classId: Number(slot.classId) || 0,
          className,
          roomName: slot.roomName || '',
          color: subjectObj?.color || '#3b82f6',
        };
      }) : [];

      // Filtrer côté frontend selon la vue
      let filtered = mappedSlots;
      if (viewMode === 'class' && selectedFilter) {
        filtered = mappedSlots.filter(s => String(s.classId) === String(selectedFilter));
      }
      setTimeSlots(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps', error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getColorForSubject = (subjectName: string) => {
    const found = subjects.find((s: any) => s.name === subjectName);
    const color = found?.color || '#3b82f6';
    const bg = found?.backgroundColor || '#eff6ff';
    if (found?.color || found?.backgroundColor) return { color, bg };
    // fallback deterministic color when backend doesn't provide colors
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) hash = (hash * 31 + subjectName.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return { color: `hsl(${hue} 85% 45%)`, bg: `hsl(${hue} 90% 96%)` };
  };

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const SLOT_META = useMemo(() => {
    return LOCAL_TIME_SLOTS.map(s => ({
      start: toMinutes(s.value),
      end: toMinutes(s.end),
      height: s.type === 'Cours' ? 60 : 30,
      type: s.type,
    }));
  }, [LOCAL_TIME_SLOTS]);

  const SLOT_OFFSETS = useMemo(() => {
    let offset = 0;
    const arr = SLOT_META.map(meta => {
      const entry = { start: meta.start, end: meta.end, offset, height: meta.height, type: meta.type };
      offset += meta.height;
      return entry;
    });
    return arr;
  }, [SLOT_META]);

  const getTimeSlotTop = (startTime: string) => {
    const startMin = toMinutes(startTime);
    // Trouver le segment dont le start correspond
    const seg = SLOT_OFFSETS.find(s => s.start === startMin);
    if (seg) return seg.offset;
    // Sinon approcher: prendre le segment précédent
    const prev = [...SLOT_OFFSETS].reverse().find(s => s.start < startMin);
    return prev ? prev.offset : 0;
  };

  const getTimeSlotHeight = (startTime: string, endTime: string) => {
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (endMin <= startMin) return 0;
    // Somme des hauteurs des segments entièrement inclus
    let height = 0;
    for (const seg of SLOT_OFFSETS) {
      // Aucun chevauchement
      if (seg.end <= startMin) continue;
      if (seg.start >= endMin) break;
      // Si entièrement inclus
      if (seg.start >= startMin && seg.end <= endMin) {
        height += seg.height;
      } else if (startMin >= seg.start && endMin <= seg.end) {
        // Inclus partiel dans un seul segment
        const ratio = (endMin - startMin) / (seg.end - seg.start);
        height += Math.max(0, ratio * seg.height);
      } else if (startMin > seg.start && startMin < seg.end) {
        // Début en milieu de segment
        const ratio = (seg.end - startMin) / (seg.end - seg.start);
        height += Math.max(0, ratio * seg.height);
      } else if (endMin > seg.start && endMin < seg.end) {
        // Fin en milieu de segment
        const ratio = (endMin - seg.start) / (seg.end - seg.start);
        height += Math.max(0, ratio * seg.height);
      }
    }
    return height;
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dayIndex = Number(formData.dayOfWeek) || 1;
      const selectedStart = LOCAL_TIME_SLOTS.find(s => s.value === formData.startTime);
      // Bloquer si c'est une pause (par sécurité)
      if (selectedStart && selectedStart.type !== 'Cours') {
        notify.warning('Impossible de programmer pendant une pause');
        return;
      }

      const payload = {
        dayOfWeek: isNaN(dayIndex) || dayIndex <= 0 ? 1 : dayIndex,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subjectId: Number(formData.subjectId),
        staffId: Number(formData.staffId),
        classId: Number(formData.classId),
        roomName: formData.roomName || 'TBD',
      };

      if (!payload.subjectId || !payload.staffId || !payload.classId || !payload.startTime || !payload.endTime) {
        notify.warning('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (selectedSlot) {
        await api.put(`/api/planning/schedules/${selectedSlot.id}`, payload);
      } else {
        await api.post(`/api/planning/schedules`, payload);
      }
      
      setShowModal(false);
      setSelectedSlot(null);
      refreshTimetableData();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      notify.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    setTargetDeleteId(slotId);
    setConfirmOpen(true);
  };
  const deleteSlot = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/planning/schedules/${targetDeleteId}`);
      refreshTimetableData();
    } catch (error) {
      notify.error('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const handleDragStart = (slot: TimeSlot) => {
    setDraggedSlot(slot);
  };

  const handleDrop = async (dayOfWeek: number, time: string) => {
    if (!draggedSlot) return;

    try {
      const dayIndex = Number(dayOfWeek) || draggedSlot.dayOfWeek || 1;
      const localSlot = LOCAL_TIME_SLOTS.find(s => s.value === time);
      if (localSlot && localSlot.type !== 'Cours') {
        notify.warning('Impossible de déplacer vers une pause');
        return;
      }
      const updateData: any = {
        dayOfWeek: isNaN(dayIndex) || dayIndex <= 0 ? undefined : dayIndex,
        startTime: time,
        endTime: localSlot?.end || draggedSlot.endTime,
        roomName: draggedSlot.roomName,
      };
      await api.put(`/api/planning/schedules/${draggedSlot.id}`, updateData);
      refreshTimetableData();
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      notify.error('Erreur lors du déplacement');
    } finally {
      setDraggedSlot(null);
    }
  };


  const handleExport = () => {
    // Ancienne fonction export
    notify.info('Ouverture de la fenêtre d’export…');
  };

  const handlePrintSchedule = () => {
    // Préparer les données pour l'impression
    const selectedLabel =
      viewMode === 'class'
        ? (classes.find(c => String(c.id) === String(selectedFilter))?.name || selectedFilter)
        : viewMode === 'teacher'
          ? (() => {
              const t = teachers.find(tt => String(tt.id) === String(selectedFilter));
              return t ? `${t.firstName} ${t.lastName}` : selectedFilter;
            })()
          : selectedFilter;
    const scheduleData = {
      title: `Emploi du temps - ${selectedLabel}`,
      period: getPeriodTitle(),
      slots: timeSlots,
      viewMode,
      filter: selectedFilter,
      dateGenerated: new Date().toISOString(),
    };
    
    // Ouvrir le modal d'impression
    setShowPrintModal(true);
  };

  const visibleSubjects = useMemo(() => {
    const visible = new Map<string, any>();
    timeSlots.forEach(slot => {
      if (!visible.has(slot.subjectName)) {
        const subject = subjects.find(s => s.name === slot.subjectName);
        visible.set(slot.subjectName, subject || { name: slot.subjectName });
      }
    });
    return Array.from(visible.values());
  }, [timeSlots, subjects]);

  const visibleSpecialties = useMemo(() => {
    const visible = new Map<string, any>();
    timeSlots.forEach(slot => {
      const classInfo = classes.find(c => c.id === slot.classId);
      if (classInfo && classInfo.specialty) {
        if (!visible.has(classInfo.specialty.name)) {
          visible.set(classInfo.specialty.name, classInfo.specialty);
        }
      }
    });
    return Array.from(visible.values());
  }, [timeSlots, classes]);

  const handleSpecialtySelection = (specialtyId: string) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialtyId)) {
        return prev.filter(id => id !== specialtyId);
      } else {
        return [...prev, specialtyId];
      }
    });
  };

  const handleSynthesisClassSelection = (classId: string) => {
    setSelectedSynthesisClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSelectAllSpecialties = () => {
    setSelectedSpecialties(specialties.map(s => s.id));
  };

  const handleDeselectAllSpecialties = () => {
    setSelectedSpecialties([]);
  };

  const handleSelectAllSynthesisClasses = () => {
    setSelectedSynthesisClasses(classes.map(c => String(c.id)));
  };

  const handleDeselectAllSynthesisClasses = () => {
    setSelectedSynthesisClasses([]);
  };

  const handleCreateNewSlot = (dayId: string, startTime: string, classId: string) => {
    setSelectedSlot(null);
    const ts = LOCAL_TIME_SLOTS.find(s => s.value === startTime);
    setFormData({
      dayOfWeek: dayId,
      startTime: startTime,
      endTime: ts?.end || '',
      subjectId: '',
      staffId: '',
      classId: classId,
      roomName: 'TBD',
    });
    setShowModal(true);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setFormData({
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: String(slot.subjectId),
      staffId: String(slot.staffId),
      classId: String(slot.classId),
      roomName: slot.roomName,
    });
    setShowModal(true);
  };

  const handleDirectPrint = async () => {
    try {
      setLoading(true);
      let blob: Blob;
      if (viewMode === 'class' && selectedFilter) {
        const className = classes.find(c => String(c.id) === String(selectedFilter))?.name || selectedFilter;
        blob = await reportService.getScheduleBlob(className, 'pdf');
      } else if (viewMode === 'teacher' && selectedFilter) {
        const teacher = teachers.find(t => String(t.id) === String(selectedFilter));
        const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : selectedFilter;
        blob = await reportService.getTeacherScheduleBlob(teacherName, 'pdf');
      } else if (viewMode === 'synthesis_class') {
        const specialtyIds = selectedSpecialties.length > 0 ? selectedSpecialties : undefined;
        blob = await reportService.getSynthesisBlob(undefined, undefined, 'pdf', specialtyIds);
      } else {
        notify.warning("Sélectionnez une classe ou un enseignant pour l'impression directe.");
        setLoading(false);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      notify.error("Erreur lors de la génération du document d'impression");
    } finally {
      setLoading(false);
    }
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
          <Tooltip text="Exporter">
            <button 
              onClick={handlePrintSchedule}
              className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors border border-primary/30 shadow-sm shadow-blue-500/10"
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text="Imprimer">
            <button 
              onClick={handleDirectPrint}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-md transition-colors border border-gray-300 dark:border-slate-600 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip text="Nouveau créneau">
            <button 
              onClick={() => {
                setSelectedSlot(null);
                setFormData({
                  dayOfWeek: days.length > 0 ? String((days[0] as any).value ?? days[0].id) : '1',
                  startTime: '',
                  endTime: '',
                  subjectId: '',
                  staffId: '',
                  classId: viewMode === 'class' ? selectedFilter : '',
                  roomName: 'TBD',
                });
                setShowModal(true);
              }}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
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
            <ChevronLeft className="w-3 h-3" />
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
            <ChevronRight className="w-3 h-3" />
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
          <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600 grid grid-cols-4">
            <button 
              onClick={() => {
                // on force le reset pour que loadDynamicOptions choisisse la 1ère classe dispo
                setViewMode('class');
                setSelectedFilter('');
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
                // reset pour que le prochain chargement choisisse le 1er enseignant
                setViewMode('teacher');
                setSelectedFilter('');
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
                setViewMode('synthesis_class');
                setSelectedFilter('');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewMode === 'synthesis_class' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Synthèse par Classe
            </button>
            <button 
              onClick={() => {
                setViewMode('free_slot');
                setSelectedFilter('');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewMode === 'free_slot' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Chercher créneaux
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Période:</span>
          <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600 grid grid-cols-3">
            <button 
              onClick={() => setViewPeriod('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewPeriod === 'all' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Complet
            </button>
            <button 
              onClick={() => setViewPeriod('day')}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewPeriod === 'day' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Jour
            </button>
            <button 
              onClick={() => setViewPeriod('evening')}
              className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${
                viewPeriod === 'evening' 
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Soir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          {viewMode === 'synthesis_class' ? (
            <div className="relative">
              <button
                onClick={() => setShowSpecialtySelector(!showSpecialtySelector)}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                Filtrer par Classe
              </button>
              {showSpecialtySelector && (
                <div className="absolute z-[100] mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 flex justify-between">
                      <button onClick={handleSelectAllSynthesisClasses} className="text-xs text-blue-600 hover:underline">Tout</button>
                      <button onClick={handleDeselectAllSynthesisClasses} className="text-xs text-blue-600 hover:underline">Aucun</button>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700"></div>
                    <div className="max-h-64 overflow-y-auto">
                      {classes.map(cls => (
                        <label key={cls.id} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedSynthesisClasses.includes(String(cls.id))}
                            onChange={() => handleSynthesisClassSelection(String(cls.id))}
                            className="mr-2"
                          />
                          {cls.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'free_slot' ? (
            <div className="text-xs text-gray-500 italic">
              Sélectionnez les classes dans l'outil ci-dessous
            </div>
          ) : (
            <SearchableSelect
              value={selectedFilter}
              onChange={setSelectedFilter}
              placeholder={`Sélectionner ${viewMode === 'class' ? 'une classe' : 'un enseignant'}`}
              options={
                viewMode === 'class'
                  ? classes.map(c => ({ value: String(c.id), label: c.name }))
                  : teachers.map(t => ({ value: String(t.id), label: `${t.firstName} ${t.lastName}` }))
              }
            />
          )}
          <Tooltip text="Visualiser">
            <button
              onClick={refreshTimetableData}
              className="ml-2 flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700"
            >
              <Search className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div id="printable">
        {/* Calendrier */}
      {viewMode === 'free_slot' ? (
        <FreeSlotFinder 
          teachers={teachers}
          classes={classes}
          rooms={rooms}
          timeSlots={timeSlots}
          days={days}
          timeSlotOptions={timeSlotOptions}
        />
      ) : viewMode === 'synthesis_class' ? (
        <ClassTimetableView 
          timeSlots={timeSlots}
          classes={classes.filter(c => selectedSynthesisClasses.includes(String(c.id)))}
          days={days}
          timeSlotOptions={timeSlotOptions}
          onEditSlot={handleEditSlot}
          onCreateSlot={handleCreateNewSlot}
          onDeleteSlot={handleDeleteSlot}
        />
      ) : calendarView === 'month' ? (
        // Vue mois : grille avec jours en colonnes et semaines en lignes
        <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* En-têtes des jours */}
              <div 
                className="grid border-b border-gray-200 dark:border-slate-700"
                style={{ gridTemplateColumns: `repeat(${days.length || 6}, 1fr)` }}
              >
                {days.map((day) => (
                  <div 
                    key={day.id}
                    className="bg-gray-50 dark:bg-slate-700/50 p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                  >
                    <div className="text-xs font-bold uppercase text-gray-900 dark:text-white">
                      {getLabel(day)}
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
                      style={{ gridTemplateColumns: `repeat(${days.length || 6}, 1fr)` }}
                    >
                      {week.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isCurrentMonth = date.getMonth() === currentMonth;
                        const dayOfWeek = getDayOfWeekFromDate(date);
                        const daySlots = timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
                        
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
                                const colors = getColorForSubject(slot.subjectName);
                                return (
                                  <div
                                    key={slot.id}
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setFormData({
                                        dayOfWeek: String(slot.dayOfWeek),
                                        startTime: slot.startTime,
                                        endTime: slot.endTime,
                                        subjectId: String(slot.subjectId),
                                        staffId: String(slot.staffId),
                                        classId: String(slot.classId),
                                        roomName: slot.roomName,
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
                                      {slot.subjectName}
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
              style={{ gridTemplateColumns: `140px repeat(${displayDays.length}, 1fr)` }}
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
                style={{ gridTemplateColumns: `140px repeat(${displayDays.length}, 1fr)` }}
              >
                {/* Colonne des heures */}
                <div className="border-r border-gray-200 dark:border-slate-700">
                  {timeSlotOptions.map((slot) => {
                    const local = LOCAL_TIME_SLOTS.find(s => s.value === slot.value);
                    const isPause = local ? (local.type !== 'Cours') : false;
                    const p1 = calendarView === 'day' ? 0.25 : 0.15;
                    const p2 = calendarView === 'day' ? 0.35 : 0.25;
                    const fillA = calendarView === 'day' ? 0.18 : 0.10;
                    const pauseBg = `repeating-linear-gradient(135deg, rgba(163,230,53,${p1}) 0 10px, rgba(163,230,53,${p2}) 10px 20px)`;
                    return (
                      <div 
                        key={slot.id}
                        className={`${isPause ? '' : 'border-b border-gray-100 dark:border-slate-700/50'} flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 font-medium`}
                        style={{ 
                          height: isPause ? 30 : 60,
                          backgroundImage: isPause ? pauseBg : undefined,
                          backgroundColor: isPause ? `rgba(163,230,53,${fillA})` : undefined
                        }}
                      >
                        <span className="whitespace-nowrap text-center">
                          {local ? `${slot.value} - ${local.end}` : slot.value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Colonnes des jours */}
                {displayDays.map((date, index) => {
                  const dayOfWeek = getDayOfWeekFromDate(date);
                  return (
                    <div 
                      key={index}
                      className="relative border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                    >
                      {/* Lignes de fond */}
                      {timeSlotOptions.map((slot) => {
                        const local = LOCAL_TIME_SLOTS.find(s => s.value === slot.value);
                        const isPause = local ? (local.type !== 'Cours') : false;
                        const q1 = calendarView === 'day' ? 0.25 : 0.15;
                        const q2 = calendarView === 'day' ? 0.35 : 0.25;
                        const fillB = calendarView === 'day' ? 0.18 : 0.10;
                        const pauseBg = `repeating-linear-gradient(135deg, rgba(163,230,53,${q1}) 0 10px, rgba(163,230,53,${q2}) 10px 20px)`;
                        return (
                          <div
                            key={`${dayOfWeek}-${slot.value}`}
                            className={`transition-colors ${isPause ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10'} ${isPause ? '' : 'border-b border-gray-100 dark:border-slate-700/50'}`}
                            style={{ 
                              height: isPause ? 30 : 60, 
                              padding: 0, 
                              margin: 0,
                              backgroundImage: isPause ? pauseBg : undefined,
                              backgroundColor: isPause ? `rgba(163,230,53,${fillB})` : undefined
                            }}
                            onDragOver={(e) => {
                              if (isPause) return;
                              e.preventDefault();
                            }}
                            onDrop={() => {
                              if (isPause) return;
                              handleDrop(dayOfWeek, slot.value);
                            }}
                            onClick={() => {
                              if (isPause) return;
                              const localSlot = LOCAL_TIME_SLOTS.find(s => s.value === slot.value);
                              setFormData({ ...formData, dayOfWeek: String(dayOfWeek), startTime: slot.value, endTime: localSlot?.end || formData.endTime });
                              setShowModal(true);
                            }}
                          >
                          </div>
                        );
                      })}

                      {/* Créneaux de cours */}
                      {timeSlots
                        .filter(slot => slot.dayOfWeek === dayOfWeek)
                        .map((slot) => {
                        const colors = getColorForSubject(slot.subjectName);
                        const height = getTimeSlotHeight(slot.startTime, slot.endTime);
                        const top = getTimeSlotTop(slot.startTime);

                        return (
                          <div
                            key={slot.id}
                            draggable
                            onDragStart={() => handleDragStart(slot)}
                            onMouseEnter={() => setHoveredSlot(slot)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setFormData({
                                dayOfWeek: String(slot.dayOfWeek),
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                subjectId: String(slot.subjectId),
                                staffId: String(slot.staffId),
                                classId: String(slot.classId),
                                roomName: slot.roomName,
                              });
                              setShowModal(true);
                            }}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: colors.bg,
                              borderLeft: `3px solid ${colors.color}`,
                            }}
                            className={`absolute left-1 right-1 rounded-md shadow-sm hover:shadow-md transition-all cursor-move group overflow-hidden ${
                              conflictingSlot && conflictingSlot.id === slot.id ? 'ring-2 ring-red-500' : ''
                            }`}
                          >
                            <div className="p-2 h-full flex flex-col justify-between">
                              <div>
                                <div 
                                  className="text-xs font-bold mb-0.5 truncate"
                                  style={{ color: colors.color }}
                                >
                                  {slot.subjectName}
                                </div>
                                <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {slot.teacherName}
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
                            {hoveredSlot && hoveredSlot.id === slot.id && (
                              <div className="absolute z-10 top-0 left-full ml-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg p-4">
                                <h3 className="font-bold text-sm mb-2" style={{ color: colors.color }}>{slot.subjectName}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"><User className="w-3 h-3" /> {slot.teacherName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"><BookOpen className="w-3 h-3" /> {slot.className}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"><MapPin className="w-3 h-3" /> {slot.roomName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"><Clock className="w-3 h-3" /> {slot.startTime} - {slot.endTime}</p>
                              </div>
                            )}
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
      </div>

      {/* Légende */}
      <div 
        style={{ marginTop: 'var(--card-spacing)' }}
        className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-4"
      >
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase">Légende</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {visibleSubjects.map((s: any) => {
            const colors = getColorForSubject(s.name);
            return (
            <div key={s.id || s.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{s.name}</span>
            </div>
          )})}
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
                  setFormData({
                    dayOfWeek: '',
                    startTime: '',
                    endTime: '',
                    subjectId: '',
                    staffId: '',
                    classId: '',
                    roomName: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conflictingSlot && (
                  <div className="md:col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Conflit détecté !</strong>
                    <span className="block sm:inline"> Ce créneau entre en conflit avec le cours de {conflictingSlot.subjectName}.</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jour *</label>
                  <select
                    required
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {days.map(day => (
                      <option key={day.id} value={String((day as any).value ?? day.id)}>{getLabel(day)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Matière *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {filteredSubjects.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de début *</label>
                  <select
                    required
                    value={formData.startTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      const slot = LOCAL_TIME_SLOTS.find(s => s.value === v);
                      setFormData({ ...formData, startTime: v, endTime: slot?.end || formData.endTime });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {LOCAL_TIME_SLOTS.filter(s => s.type === 'Cours').map((s, idx) => (
                      <option key={`start-${idx}`} value={s.value}>{s.value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Heure de fin *</label>
                  <select
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                    disabled
                  >
                    <option value="">Sélectionner...</option>
                    <option value={formData.endTime || ''}>{formData.endTime || 'Fin'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enseignant *</label>
                  <select
                    required
                    value={formData.staffId || ''}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      setFormData({
                        ...formData, 
                        staffId: String(selectedId),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un enseignant...</option>
                    {filteredTeachers.length === 0 && (
                      <option value="" disabled>Chargement des enseignants...</option>
                    )}
                    {filteredTeachers.map((teacher) => (
                      <option key={teacher.id} value={Number(teacher.id)}>
                        {teacher.firstName} {teacher.lastName} {teacher.specialty ? `- ${teacher.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Classe *</label>
                  <select
                    required
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une classe...</option>
                    {filteredClasses.map((c) => (
                      <option key={c.id || c.name} value={String(c.id)}>
                        {c.name}
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
                    setFormData({
                      dayOfWeek: '',
                      startTime: '',
                      endTime: '',
                      subjectId: '',
                      staffId: '',
                      classId: '',
                      roomName: '',
                    });
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
          title: `Emploi du temps - ${
            viewMode === 'class'
              ? (classes.find(c => String(c.id) === String(selectedFilter))?.name || selectedFilter)
              : viewMode === 'teacher'
                ? (() => {
                    const t = teachers.find(tt => String(tt.id) === String(selectedFilter));
                    return t ? `${t.firstName} ${t.lastName}` : selectedFilter;
                  })()
                : selectedFilter
          }`,
          period: getPeriodTitle(),
          slots: timeSlots,
          viewMode,
          filter: selectedFilter,
          dateGenerated: new Date().toISOString(),
        }}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        defaultPeriod={viewPeriod}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (deleteLoading) return;
          setConfirmOpen(false);
          setTargetDeleteId(null);
        }}
        onConfirm={deleteSlot}
        title="Supprimer le créneau"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce créneau ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};