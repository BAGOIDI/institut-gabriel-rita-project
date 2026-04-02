import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  Calendar,
  Clock,
  User,
  BookOpen,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import api from '../services/api.service';
import ScheduleExportModal from '../components/ScheduleExportModal';
import { useTheme } from '../contexts/ThemeContext';
import { SystemOptionsService, SystemOption } from '../services/system-options.service';
import { CoreService } from '../services/core.service';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNotification } from '../contexts/NotificationContext';
import ClassTimetableView from '../components/ClassTimetableView';
import FreeSlotFinder from '../components/FreeSlotFinder';
import Tooltip from '../components/Tooltip';
import SearchableSelect from '../components/SearchableSelect';
import { useTranslation } from '../hooks/useTranslation';
import WhatsAppSender from '../components/WhatsAppSender';
import TimetableConfig from '../components/TimetableConfig';

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
  const { t } = useTranslation();
  const notify = useNotification();

  // 1. States
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'synthesis_class' | 'free_slot'>(
    () => (localStorage.getItem('timetable_viewMode') as any) || 'class'
  );
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>(
    () => (localStorage.getItem('timetable_calendarView') as any) || 'week'
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>(
    () => localStorage.getItem('timetable_selectedFilter') || ''
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: number, time: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSpecialtySelector, setShowSpecialtySelector] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  const [conflictingSlot, setConflictingSlot] = useState<TimeSlot | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'day' | 'evening' | 'all'>(
    () => (localStorage.getItem('timetable_viewPeriod') as any) || 'all'
  );
  const [showConfiguration, setShowConfiguration] = useState(false);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<SystemOption[]>([]);
  const [days, setDays] = useState<SystemOption[]>([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState<SystemOption[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  const [dialogClasses, setDialogClasses] = useState<any[]>([]);
  const [dialogSubjects, setDialogSubjects] = useState<any[]>([]);
  const [dialogTeachers, setDialogTeachers] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

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

  // 2. Memos
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
      label: language === 'fr' ? s.labelFr : s.labelEn,
      isActive: true,
    }));
  }, [LOCAL_TIME_SLOTS, language]);

  const LOCAL_END_TIMES = useMemo(() => {
    return Array.from(new Set(LOCAL_TIME_SLOTS.map(s => s.end)));
  }, [LOCAL_TIME_SLOTS]);

  // 3. Effects
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
        if (selectedSlot && slot.id === selectedSlot.id) return false;

        const sameDay = String(slot.dayOfWeek) === dayOfWeek;
        const overlaps = slot.startTime < endTime && slot.endTime > startTime;

        if (sameDay && overlaps) {
          if (staffId && String(slot.staffId) === staffId) return true;
          if (classId && String(slot.classId) === classId) return true;
          if (roomName && roomName !== 'TBD' && slot.roomName === roomName) return true;
        }
        return false;
      });

      setConflictingSlot(conflict || null);
    };

    checkConflicts();
  }, [formData, timeSlots, showModal, selectedSlot]);

  useEffect(() => {
    localStorage.setItem('timetable_viewMode', viewMode);
    localStorage.setItem('timetable_calendarView', calendarView);
    localStorage.setItem('timetable_selectedFilter', selectedFilter);
    localStorage.setItem('timetable_viewPeriod', viewPeriod);
    localStorage.setItem('timetable_selectedSynthesisClasses', JSON.stringify(selectedSynthesisClasses));
  }, [viewMode, calendarView, selectedFilter, viewPeriod, selectedSynthesisClasses]);

  // Chargement dynamique des options du dialogue
  useEffect(() => {
    const fetchDialogOptions = async () => {
      if (!showModal) return;
      
      setDialogLoading(true);
      try {
        const { classId, staffId, subjectId } = formData;
        
        const toArr = (v: any) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          if (Array.isArray(v.items)) return v.items;
          return [];
        };

        setDialogClasses(classes);

        if (classId) {
          const subjectsForClass = toArr(await CoreService.getSubjectsByClassV2(classId));
          const teachersForClass = toArr(await CoreService.getTeachersByClassV2(classId));
          
          let finalSubjects = subjectsForClass;
          let finalTeachers = teachersForClass;

          if (subjectId) {
            const mappings = toArr(await CoreService.getAll('teacher-subject-class', { classId, subjectId }));
            const teacherIds = mappings.map((m: any) => m.staffId);
            finalTeachers = teachersForClass.filter((t: any) => teacherIds.includes(t.id));
          }

          if (staffId) {
            const mappings = toArr(await CoreService.getAll('teacher-subject-class', { classId, staffId }));
            const subjectIds = mappings.map((m: any) => m.subjectId);
            finalSubjects = subjectsForClass.filter((s: any) => subjectIds.includes(s.id));
          }

          setDialogSubjects(finalSubjects);
          setDialogTeachers(finalTeachers);
        } else {
          setDialogSubjects(subjects);
          setDialogTeachers(teachers);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options filtrées:', error);
      } finally {
        setDialogLoading(false);
      }
    };

    fetchDialogOptions();
  }, [showModal, formData.classId, formData.staffId, formData.subjectId, classes, subjects, teachers]);

  useEffect(() => {
    setTimeSlotOptions(LOCAL_TIME_OPTIONS);
  }, [LOCAL_TIME_OPTIONS]);

  useEffect(() => {
    loadDynamicOptions();
  }, []);

  // Jours de la semaine par défaut
  const DEFAULT_DAYS: SystemOption[] = useMemo(() => ([
    { id: 1, category: 'TIMETABLE_DAY', value: '1', labelFr: 'Lundi', labelEn: 'Monday', label: language === 'fr' ? 'Lundi' : 'Monday', isActive: true },
    { id: 2, category: 'TIMETABLE_DAY', value: '2', labelFr: 'Mardi', labelEn: 'Tuesday', label: language === 'fr' ? 'Mardi' : 'Tuesday', isActive: true },
    { id: 3, category: 'TIMETABLE_DAY', value: '3', labelFr: 'Mercredi', labelEn: 'Wednesday', label: language === 'fr' ? 'Mercredi' : 'Wednesday', isActive: true },
    { id: 4, category: 'TIMETABLE_DAY', value: '4', labelFr: 'Jeudi', labelEn: 'Thursday', label: language === 'fr' ? 'Jeudi' : 'Thursday', isActive: true },
    { id: 5, category: 'TIMETABLE_DAY', value: '5', labelFr: 'Vendredi', labelEn: 'Friday', label: language === 'fr' ? 'Vendredi' : 'Friday', isActive: true },
    { id: 6, category: 'TIMETABLE_DAY', value: '6', labelFr: 'Samedi', labelEn: 'Saturday', label: language === 'fr' ? 'Samedi' : 'Saturday', isActive: true },
  ]), [language]);

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchSpecialty = !selectedSpecialty || String(cls.specialty?.id) === selectedSpecialty;
      const matchLevel = !selectedLevel || String(cls.level) === selectedLevel;
      return matchSpecialty && matchLevel;
    });
  }, [classes, selectedSpecialty, selectedLevel]);

  const loadDynamicOptions = async () => {
    try {
      setLoading(true);
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
        CoreService.getAll('classes').catch(() => ({ items: [] })),
        CoreService.getAll('staff').catch(() => ({ items: [] })),
        CoreService.getAll('subjects').catch(() => ({ items: [] })),
        CoreService.getAll('specialties').catch(() => ({ items: [] }))
      ]);

      let daysArr = toArray(daysRes);
      if (daysArr.length === 0) daysArr = DEFAULT_DAYS;
      const roomsArr = toArray(roomsRes);
      setDays(daysArr);
      setRooms(roomsArr);
      
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

      if (daysArr.length > 0 && !formData.dayOfWeek) {
        const v = String((daysArr[0] as any).value ?? daysArr[0].id ?? '1');
        setFormData(prev => ({ ...prev, dayOfWeek: v }));
      }
      
      if (!selectedFilter) {
        if (viewMode === 'class' && classesSorted.length > 0) {
          setSelectedFilter(String(classesSorted[0].id));
        } else if (viewMode === 'teacher' && teachersSorted.length > 0) {
          setSelectedFilter(String(teachersSorted[0].id));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options', error);
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

  const displayDays = useMemo(() => {
    if (calendarView === 'day') return [currentDate];
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [calendarView, currentDate]);

  const monthWeeks = useMemo(() => {
    if (calendarView !== 'month') return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startMonday = new Date(firstDay);
    const startDay = startMonday.getDay();
    const startDiff = startMonday.getDate() - startDay + (startDay === 0 ? -6 : 1);
    startMonday.setDate(startDiff);
    const weeks: Date[][] = [];
    let currentWeekStart = new Date(startMonday);
    while (currentWeekStart <= lastDay || weeks.length === 0) {
      const week = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date;
      });
      weeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      if (weeks.length > 6) break;
    }
    return weeks;
  }, [calendarView, currentDate]);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') newDate.setDate(currentDate.getDate() - 1);
    else if (calendarView === 'week') newDate.setDate(currentDate.getDate() - 7);
    else newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'day') newDate.setDate(currentDate.getDate() + 1);
    else if (calendarView === 'week') newDate.setDate(currentDate.getDate() + 7);
    else newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getPeriodTitle = () => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    if (calendarView === 'day') return currentDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (calendarView === 'week') {
      const firstDay = displayDays[0];
      const lastDay = displayDays[displayDays.length - 1];
      return `${firstDay.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const refreshTimetableData = async () => {
    if (!selectedFilter && (viewMode === 'class' || viewMode === 'teacher')) {
      setTimeSlots([]);
      return;
    }
    setLoading(true);
    try {
      let url;
      const params: any = {};
      if (viewMode === 'teacher') {
        url = `/api/planning/schedules/staff/${selectedFilter}`;
      } else {
        url = `/api/planning/schedules`;
        if (viewMode === 'class' && selectedFilter) params.classId = selectedFilter;
      }
      
      const response = await api.get(url, { params });
      const data = response.data;
      
      const mappedSlots: TimeSlot[] = Array.isArray(data) ? data.map((slot: any) => {
        const subjectObj = subjects.find((s: any) => String(s.id) === String(slot.subjectId));
        const teacherObj = teachers.find((t: any) => String(t.id) === String(slot.staffId));
        const classObj = classes.find((c: any) => String(c.id) === String(slot.classId));

        return {
          id: slot.id?.toString() || `temp-${Math.random()}`,
          dayOfWeek: Number(slot.dayOfWeek) || 1,
          startTime: String(slot.startTime || '').substring(0, 5) || '08:00',
          endTime: String(slot.endTime || '').substring(0, 5) || '09:00',
          subjectId: Number(slot.subjectId) || 0,
          subjectName: subjectObj?.name || `${t('subject')} #${slot.subjectId ?? ''}`,
          staffId: Number(slot.staffId) || 0,
          teacherName: teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : `${t('teacher')} #${slot.staffId ?? ''}`,
          classId: Number(slot.classId) || 0,
          className: classObj?.name || `${t('class')} #${slot.classId ?? ''}`,
          roomName: slot.roomName || '',
          color: subjectObj?.color || '#3b82f6',
        };
      }) : [];

      let filtered = mappedSlots;
      if (viewMode === 'class' && selectedFilter) {
        filtered = mappedSlots.filter(s => String(s.classId) === String(selectedFilter));
      }
      
      if (selectedRoom) {
        filtered = filtered.filter(s => s.roomName === selectedRoom);
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
    return SLOT_META.map(meta => {
      const entry = { start: meta.start, end: meta.end, offset, height: meta.height, type: meta.type };
      offset += meta.height;
      return entry;
    });
  }, [SLOT_META]);

  const getTimeSlotTop = (startTime: string) => {
    const startMin = toMinutes(startTime);
    const seg = SLOT_OFFSETS.find(s => s.start === startMin);
    if (seg) return seg.offset;
    const prev = [...SLOT_OFFSETS].reverse().find(s => s.start < startMin);
    return prev ? prev.offset : 0;
  };

  const getTimeSlotHeight = (startTime: string, endTime: string) => {
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (endMin <= startMin) return 0;
    let height = 0;
    for (const seg of SLOT_OFFSETS) {
      if (seg.end <= startMin) continue;
      if (seg.start >= endMin) break;
      if (seg.start >= startMin && seg.end <= endMin) height += seg.height;
      else {
        const intersectionStart = Math.max(startMin, seg.start);
        const intersectionEnd = Math.min(endMin, seg.end);
        const ratio = (intersectionEnd - intersectionStart) / (seg.end - seg.start);
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
      if (selectedStart && selectedStart.type !== 'Cours') {
        notify.warning(t('cannotProgramDuringPause'));
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
        notify.warning(t('pleaseFillAllFields'));
        return;
      }

      if (selectedSlot) await api.put(`/api/planning/schedules/${selectedSlot.id}`, payload);
      else await api.post(`/api/planning/schedules`, payload);
      
      setShowModal(false);
      setSelectedSlot(null);
      refreshTimetableData();
      notify.success(selectedSlot ? t('slotUpdated') : t('slotSaved'));
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorSavingSlot'));
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
      notify.success(t('slotDeleted'));
    } catch (error) {
      notify.error(t('errorDeletingSlot'));
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const handleDragStart = (slot: TimeSlot) => {
    setDraggedSlot(slot);
    // Ajouter un effet visuel
    const element = document.getElementById(`slot-${slot.id}`);
    if (element) {
      element.style.opacity = '0.5';
      element.style.transform = 'scale(1.05)';
      element.style.zIndex = '100';
    }
  };

  const handleDrop = async (dayOfWeek: number, time: string) => {
    if (!draggedSlot) return;
    if (dayOfWeek > 6) {
      notify.error(t('cannotProgramOnSunday'));
      return;
    }
    
    // Animation de succès
    const dropZone = document.getElementById(`drop-zone-${dayOfWeek}-${time}`);
    if (dropZone) {
      dropZone.classList.add('bg-green-100', 'dark:bg-green-900/30');
      setTimeout(() => {
        dropZone.classList.remove('bg-green-100', 'dark:bg-green-900/30');
      }, 300);
    }
    
    try {
      const localSlot = LOCAL_TIME_SLOTS.find(s => s.value === time);
      if (localSlot && localSlot.type !== 'Cours') {
        notify.warning(t('cannotMoveToPause'));
        return;
      }
      const updateData: any = {
        dayOfWeek: dayOfWeek,
        startTime: time,
        endTime: localSlot?.end || draggedSlot.endTime,
        subjectId: Number(draggedSlot.subjectId),
        staffId: Number(draggedSlot.staffId),
        classId: Number(draggedSlot.classId),
        roomName: draggedSlot.roomName || 'TBD',
      };
      await api.put(`/api/planning/schedules/${draggedSlot.id}`, updateData);
      refreshTimetableData();
      notify.success(t('slotMoved'));
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorMovingSlot'));
    } finally {
      setDraggedSlot(null);
      setDragOverCell(null);
    }
  };

  const handleExportSchedule = () => {
    const selectedLabel = viewMode === 'class'
      ? (classes.find(c => String(c.id) === String(selectedFilter))?.name || selectedFilter)
      : viewMode === 'teacher'
        ? (() => {
            const tFound = teachers.find(tt => String(tt.id) === String(selectedFilter));
            return tFound ? `${tFound.firstName} ${tFound.lastName}` : selectedFilter;
          })()
        : selectedFilter;

    setExportData({
      title: `${t('timetable')} - ${selectedLabel}`,
      period: getPeriodTitle(),
      slots: timeSlots,
      viewMode,
      filter: selectedFilter,
      dateGenerated: new Date().toISOString(),
    });
    setShowExportModal(true);
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

  const handleSynthesisClassSelection = (classId: string) => {
    setSelectedSynthesisClasses(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  };

  const handleSelectAllSynthesisClasses = () => setSelectedSynthesisClasses(classes.map(c => String(c.id)));
  const handleDeselectAllSynthesisClasses = () => setSelectedSynthesisClasses([]);

  const handleCreateNewSlot = (dayId: string, startTime: string, targetId: string) => {
    setSelectedSlot(null);
    const ts = LOCAL_TIME_SLOTS.find(s => s.value === startTime);
    setFormData({
      dayOfWeek: dayId,
      startTime: startTime,
      endTime: ts?.end || '',
      subjectId: '',
      staffId: viewMode === 'teacher' ? targetId : '',
      classId: viewMode === 'class' ? targetId : '',
      roomName: 'TBD',
    });
    setShowModal(true);
  };

  const handleCreateSlotFromFreeSlot = async (slotData: any) => {
    // Ouvrir le modal avec les données pré-remplies
    const ts = LOCAL_TIME_SLOTS.find(s => s.value === slotData.startTime);
    setFormData({
      dayOfWeek: slotData.dayOfWeek,
      startTime: slotData.startTime,
      endTime: ts?.end || '',
      subjectId: '',
      staffId: viewMode === 'teacher' ? selectedFilter : '',
      classId: viewMode === 'class' ? selectedFilter : '',
      roomName: 'TBD',
    });
    setSelectedSlot(null);
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

  return (
    <div className="w-full">
      {showConfiguration ? (
        <TimetableConfig onClose={() => setShowConfiguration(false)} />
      ) : (
        <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--card-spacing)' }} className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t('timetable')}</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('timetableDesc')}</p>
        </div>
        <div className="flex gap-2">
          {selectedFilter && (viewMode === 'class' || viewMode === 'teacher') && (
            <WhatsAppSender
              targetType={viewMode === 'class' ? 'class' : 'teacher'}
              targetId={selectedFilter}
              targetName={
                viewMode === 'class'
                  ? classes.find(c => String(c.id) === String(selectedFilter))?.name || selectedFilter
                  : (() => {
                      const tFound = teachers.find(tt => String(tt.id) === String(selectedFilter));
                      return tFound ? `${tFound.firstName} ${tFound.lastName}` : selectedFilter;
                    })()
              }
            />
          )}
          {viewMode === 'synthesis_class' && selectedSynthesisClasses.length > 0 && (
             <WhatsAppSender
                targetType="class"
                targetId={selectedSynthesisClasses.join(',')}
                targetName={t('classSynthesis')}
             />
          )}
          <Tooltip text={t('timetableConfiguration')}>
            <button 
              onClick={() => setShowConfiguration(!showConfiguration)} 
              className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors border ${
                showConfiguration 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700' 
                  : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text={t('export')}>
            <button onClick={handleExportSchedule} className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors border border-primary/30 shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text={t('newSlot')}>
            <button 
              onClick={() => {
                setSelectedSlot(null);
                setFormData({
                  dayOfWeek: days.length > 0 ? String((days[0] as any).value ?? days[0].id) : '1',
                  startTime: '',
                  endTime: '',
                  subjectId: '',
                  staffId: viewMode === 'teacher' ? selectedFilter : '',
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

      {/* Navigation */}
      <div style={{ padding: 'calc(var(--card-spacing) * 0.75)', marginBottom: 'var(--card-spacing)' }} className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-normal transition-colors border border-blue-700">
            {t('today')}
          </button>
          <button onClick={goToPrevious} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600 text-xs font-normal text-gray-700 dark:text-gray-300">
            <ChevronLeft className="w-3 h-3" />
            <span>{calendarView === 'day' ? t('previousDay') : calendarView === 'week' ? t('previousWeek') : t('previousMonth')}</span>
          </button>
          <button onClick={goToNext} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600 text-xs font-normal text-gray-700 dark:text-gray-300">
            <span>{calendarView === 'day' ? t('nextDay') : calendarView === 'week' ? t('nextWeek') : t('nextMonth')}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <div className="text-sm font-bold text-gray-900 dark:text-white ml-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600">
            {getPeriodTitle()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('year')}:</span>
          <select value={currentDate.getFullYear()} onChange={(e) => { const d = new Date(currentDate); d.setFullYear(parseInt(e.target.value)); setCurrentDate(d); }} className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - 3 + i; return <option key={y} value={y}>{y}</option>; })}
          </select>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">{t('month')}:</span>
          <select value={currentDate.getMonth()} onChange={(e) => { const d = new Date(currentDate); d.setMonth(parseInt(e.target.value)); setCurrentDate(d); }} className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}</option>)}
          </select>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2">{t('display')}:</span>
          <select value={calendarView} onChange={(e) => setCalendarView(e.target.value as any)} className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="day">{t('day')}</option>
            <option value="week">{t('week')}</option>
            <option value="month">{t('month')}</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: 'calc(var(--card-spacing) * 0.75)', marginBottom: 'var(--card-spacing)' }} className="bg-white dark:bg-slate-800 rounded-md shadow-md border border-gray-200 dark:border-slate-700 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('view')}:</span>
          <div className="flex bg-gray-50 dark:bg-slate-700 p-0.5 rounded-md border border-gray-200 dark:border-slate-600">
            <button onClick={() => { setViewMode('class'); setSelectedFilter(''); }} className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${viewMode === 'class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {t('byClass')}
            </button>
            <button onClick={() => { setViewMode('teacher'); setSelectedFilter(''); }} className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${viewMode === 'teacher' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {t('byTeacher')}
            </button>
            <button onClick={() => { setViewMode('synthesis_class'); setSelectedFilter(''); }} className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${viewMode === 'synthesis_class' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {t('synthesisByClass')}
            </button>
            <button onClick={() => { setViewMode('free_slot'); setSelectedFilter(''); }} className={`px-3 py-1.5 rounded-md text-xs font-normal transition-all ${viewMode === 'free_slot' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {t('findSlots')}
            </button>
          </div>
        </div>

        {viewMode === 'class' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('specialtyFilter')}:</span>
              <select 
                value={selectedSpecialty} 
                onChange={(e) => { setSelectedSpecialty(e.target.value); setSelectedFilter(''); }}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('allSpecialties')}</option>
                {specialties.map(s => <option key={s.id} value={String(s.id)}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('levelFilter')}:</span>
              <select 
                value={selectedLevel} 
                onChange={(e) => { setSelectedLevel(e.target.value); setSelectedFilter(''); }}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('allLevels')}</option>
                {[1, 2, 3, 4, 5].map(l => <option key={l} value={String(l)}>{t('level')} {l}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('roomFilter')}:</span>
          <select 
            value={selectedRoom} 
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('allRooms')}</option>
            {rooms.map(r => <option key={r.id} value={r.value}>{getLabel(r)}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('period')}:</span>
          <select 
            value={viewPeriod} 
            onChange={(e) => setViewPeriod(e.target.value as any)}
            className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('allPeriods')}</option>
            <option value="day">{t('daySession')}</option>
            <option value="evening">{t('eveningSession')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-grow justify-end">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          {viewMode === 'synthesis_class' ? (
            <div className="relative">
              <button onClick={() => setShowSpecialtySelector(!showSpecialtySelector)} className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-xs px-3 py-1.5 dark:text-white focus:ring-2 focus:ring-blue-500">
                {t('filterByClass')}
              </button>
              {showSpecialtySelector && (
                <div className="absolute z-[100] mt-2 right-0 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 flex justify-between">
                      <button onClick={handleSelectAllSynthesisClasses} className="text-xs text-blue-600 hover:underline">{t('all')}</button>
                      <button onClick={handleDeselectAllSynthesisClasses} className="text-xs text-blue-600 hover:underline">{t('none')}</button>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700"></div>
                    <div className="max-h-64 overflow-y-auto">
                      {classes.map(cls => (
                        <label key={cls.id} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                          <input type="checkbox" checked={selectedSynthesisClasses.includes(String(cls.id))} onChange={() => handleSynthesisClassSelection(String(cls.id))} className="mr-2" />
                          {cls.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'free_slot' ? (
            <div className="text-xs text-gray-500 italic">{t('selectClassesBelow')}</div>
          ) : (
            <SearchableSelect
              value={selectedFilter}
              onChange={setSelectedFilter}
              placeholder={viewMode === 'class' ? t('selectClass') : t('selectTeacher')}
              options={viewMode === 'class' ? filteredClasses.map(c => ({ value: String(c.id), label: c.name })) : teachers.map(tFound => ({ value: String(tFound.id), label: `${tFound.firstName} ${tFound.lastName}` }))}
            />
          )}
          <Tooltip text={t('visualize')}>
            <button onClick={refreshTimetableData} className="ml-2 flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700">
              <Search className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div id="printable">
        {loading ? (
          <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : viewMode === 'free_slot' ? (
          <FreeSlotFinder teachers={teachers} classes={classes} rooms={rooms} timeSlots={timeSlots} days={days} timeSlotOptions={timeSlotOptions} onCreateSlot={handleCreateSlotFromFreeSlot} />
        ) : viewMode === 'synthesis_class' ? (
          <ClassTimetableView timeSlots={timeSlots} classes={classes.filter(c => selectedSynthesisClasses.includes(String(c.id)))} teachers={teachers} days={days} timeSlotOptions={timeSlotOptions} onEditSlot={handleEditSlot} onCreateNewSlot={handleCreateNewSlot} onDeleteSlot={handleDeleteSlot} viewMode={viewMode} selectedFilter={selectedFilter} getColorForSubject={getColorForSubject} />
        ) : calendarView === 'month' ? (
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid border-b border-gray-200 dark:border-slate-700" style={{ gridTemplateColumns: `repeat(${days.length || 6}, 1fr)` }}>
                  {days.map((day) => <div key={day.id} className="bg-gray-50 dark:bg-slate-700/50 p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 font-bold uppercase text-[10px] text-gray-500">{getLabel(day)}</div>)}
                </div>
                <div>
                  {monthWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid border-b border-gray-200 dark:border-slate-700 last:border-b-0" style={{ gridTemplateColumns: `repeat(${days.length || 6}, 1fr)` }}>
                      {week.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayOfWeek = getDayOfWeekFromDate(date);
                        const daySlots = timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
                        return (
                          <div key={dayIndex} className={`min-h-[120px] p-2 border-r border-gray-200 dark:border-slate-700 last:border-r-0 relative ${date.getMonth() === currentDate.getMonth() ? '' : 'opacity-40'} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <div className={`text-xs font-bold mb-2 ${isToday ? 'text-blue-600' : ''}`}>{date.getDate()}</div>
                            <div className="space-y-1">
                              {daySlots.slice(0, 3).map((slot) => {
                                const colors = getColorForSubject(slot.subjectName);
                                return (
                                  <div key={slot.id} onClick={() => handleEditSlot(slot)} style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.color}` }} className="rounded-sm p-1 cursor-pointer hover:shadow-md transition-shadow text-[10px] truncate">
                                    <span className="font-bold" style={{ color: colors.color }}>{slot.subjectName}</span>
                                  </div>
                                );
                              })}
                              {daySlots.length > 3 && <div className="text-[10px] text-gray-500 text-center">+{daySlots.length - 3} {t('others')}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid border-b border-gray-200 dark:border-slate-700" style={{ gridTemplateColumns: `140px repeat(${displayDays.length}, 1fr)` }}>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 border-r border-gray-200 dark:border-slate-700 flex justify-center items-center"><Clock className="w-4 h-4 text-gray-400" /></div>
                  {displayDays.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={index} className={`bg-gray-50 dark:bg-slate-700/50 p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <div className={`text-xs font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{date.toLocaleDateString('fr-FR', { weekday: 'long' })}</div>
                        <div className={`text-[10px] ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="relative">
                  <div className="grid" style={{ gridTemplateColumns: `140px repeat(${displayDays.length}, 1fr)` }}>
                    <div className="border-r border-gray-200 dark:border-slate-700">
                      {timeSlotOptions.map((slot) => {
                        const local = LOCAL_TIME_SLOTS.find(s => s.value === slot.value);
                        const isPause = local?.type !== 'Cours';
                        const isEvening = slot.value >= '17:30';
                        return (
                          <div key={slot.id} className={`${isPause ? 'bg-lime-50/30' : 'border-b border-gray-100'} flex flex-col items-center justify-center text-[10px] text-gray-500 font-medium px-1`} style={{ height: isPause ? 30 : 60 }}>
                            <div>{slot.value} - {local?.end}</div>
                            {viewPeriod === 'all' && !isPause && (
                              <div className={`text-[8px] uppercase px-1 rounded ${isEvening ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isEvening ? t('evening') : t('day')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {displayDays.map((date, index) => {
                      const dayOfWeek = getDayOfWeekFromDate(date);
                      return (
                        <div 
                          key={index} 
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverCell({ day: dayOfWeek, time: '' }); // Optionnel pour le feedback
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            // Le drop sur la colonne elle-même sans slot spécifique
                          }}
                          className="relative border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                        >
                          {timeSlotOptions.map((slot) => {
                            const local = LOCAL_TIME_SLOTS.find(s => s.value === slot.value);
                            const isPause = local?.type !== 'Cours';
                            const isOver = dragOverCell?.day === dayOfWeek && dragOverCell?.time === slot.value;
                            
                            return (
                              <div 
                                key={`${dayOfWeek}-${slot.value}`} 
                                id={`drop-zone-${dayOfWeek}-${slot.value}`}
                                onClick={() => !isPause && handleCreateNewSlot(String(dayOfWeek), slot.value, selectedFilter)} 
                                onDragOver={(e) => {
                                  if (!isPause) {
                                    e.preventDefault();
                                    setDragOverCell({ day: dayOfWeek, time: slot.value });
                                  }
                                }}
                                onDragLeave={() => setDragOverCell(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (!isPause) handleDrop(dayOfWeek, slot.value);
                                }}
                                className={`border-b border-gray-100 ${isPause ? 'bg-lime-50/20' : 'hover:bg-blue-50/10 cursor-pointer'} ${isOver ? 'bg-blue-100/50' : ''}`} 
                                style={{ height: isPause ? 30 : 60 }} 
                              />
                            );
                          })}
                          {timeSlots.filter(s => s.dayOfWeek === dayOfWeek).map((slot) => {
                            const colors = getColorForSubject(slot.subjectName);
                            const height = getTimeSlotHeight(slot.startTime, slot.endTime);
                            const top = getTimeSlotTop(slot.startTime);
                            const isDragged = draggedSlot?.id === slot.id;
                            
                            return (
                              <div 
                                key={slot.id} 
                                id={`slot-${slot.id}`}
                                draggable
                                onDragStart={() => handleDragStart(slot)}
                                onClick={() => handleEditSlot(slot)} 
                                style={{ 
                                  top: `${top}px`, 
                                  height: `${height}px`, 
                                  backgroundColor: colors.bg, 
                                  borderLeft: `3px solid ${colors.color}`,
                                  opacity: isDragged ? 0.5 : 1,
                                  zIndex: isDragged ? 50 : 10
                                }} 
                                className="absolute left-1 right-1 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer p-2 overflow-hidden"
                              >
                                <div className="text-[10px] font-bold truncate" style={{ color: colors.color }}>{slot.subjectName}</div>
                                <div className="text-[9px] text-gray-500 truncate">{slot.teacherName}</div>
                                <div className="text-[8px] text-gray-400">{slot.startTime} - {slot.endTime}</div>
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

      {/* Legend */}
      <div style={{ marginTop: 'var(--card-spacing)' }} className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase">{t('legend')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {visibleSubjects.map((s: any) => {
            const colors = getColorForSubject(s.name);
            return (
              <div key={s.id || s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase">{selectedSlot ? t('editSlot') : t('newSlot')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('day')} *</label>
                  <select required value={formData.dayOfWeek} onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white">
                    <option value="">{t('select')}</option>
                    {days.map(day => <option key={day.id} value={String((day as any).value ?? day.id)}>{getLabel(day)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subject')} *</label>
                  <select required value={formData.subjectId} onChange={(e) => setFormData({...formData, subjectId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white" disabled={dialogLoading}>
                    <option value="">{t('select')}</option>
                    {dialogSubjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('startTime')} *</label>
                  <select required value={formData.startTime} onChange={(e) => { const v = e.target.value; const slot = LOCAL_TIME_SLOTS.find(s => s.value === v); setFormData({ ...formData, startTime: v, endTime: slot?.end || formData.endTime }); }} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white">
                    <option value="">{t('select')}</option>
                    {LOCAL_TIME_SLOTS.filter(s => s.type === 'Cours').map((s, idx) => <option key={idx} value={s.value}>{s.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('endTime')} *</label>
                  <select required value={formData.endTime} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white" disabled>
                    <option value={formData.endTime}>{formData.endTime}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('teacher')} *</label>
                  <select required value={formData.staffId} onChange={(e) => setFormData({...formData, staffId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white" disabled={dialogLoading}>
                    <option value="">{t('select')}</option>
                    {dialogTeachers.map(tFound => <option key={tFound.id} value={String(tFound.id)}>{tFound.firstName} {tFound.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('class')} *</label>
                  <select required value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white" disabled={dialogLoading}>
                    <option value="">{t('select')}</option>
                    {dialogClasses.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('room')}</label>
                  <select value={formData.roomName} onChange={(e) => setFormData({...formData, roomName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white">
                    <option value="TBD">TBD</option>
                    {rooms.map(r => <option key={r.id} value={r.value}>{getLabel(r)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 text-sm font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors border border-blue-700">{selectedSlot ? t('update') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && exportData && (
        <ScheduleExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          scheduleData={exportData}
          classes={classes}
        />
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={deleteSlot}
        title={t('deleteSlotTitle')}
        message={t('deleteSlotMessage')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
        loading={deleteLoading}
      />
      </div>
      )}
    </div>
  );
};

export default Timetable;