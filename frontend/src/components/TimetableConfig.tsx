import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GripVertical, 
  Palette, 
  BookOpen,
  Users,
  Building,
  Clock,
  Calendar,
  Hash,
  Move,
  Check,
  AlertCircle
} from 'lucide-react';
import { SystemOptionsService, SystemOption } from '../services/system-options.service';
import { CoreService } from '../services/core.service';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { ConfirmDialog } from './ConfirmDialog';
import { useNotification } from '../contexts/NotificationContext';

interface DraggableItem {
  id: string | number;
  name: string;
  code?: string;
  color?: string;
  backgroundColor?: string;
  coefficient?: number;
  isActive: boolean;
  category?: string;
  value?: string;
  labelFr?: string;
  labelEn?: string;
}

interface TimetableConfigProps {
  onClose?: () => void;
}

export const TimetableConfig = ({ onClose }: TimetableConfigProps) => {
  const { language } = useTheme();
  const { t } = useTranslation();
  const notify = useNotification();

  // States
  const [activeTab, setActiveTab] = useState<'subjects' | 'classes' | 'rooms' | 'days' | 'timeslots'>('subjects');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<DraggableItem[]>([]);
  const [classes, setClasses] = useState<DraggableItem[]>([]);
  const [rooms, setRooms] = useState<SystemOption[]>([]);
  const [days, setDays] = useState<SystemOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<SystemOption[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DraggableItem | null>(null);
  const [editingItem, setEditingItem] = useState<DraggableItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    color: '#3b82f6',
    coefficient: 1,
    isActive: true,
  });

  const tabs = [
    { id: 'subjects', label: t('subjects'), icon: BookOpen },
    { id: 'classes', label: t('classes'), icon: Users },
    { id: 'rooms', label: t('rooms'), icon: Building },
    { id: 'days', label: t('days'), icon: Calendar },
    { id: 'timeslots', label: t('timeSlots'), icon: Clock },
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'subjects':
          const subjectsData = await CoreService.getAll('subjects');
          setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
          break;
        case 'classes':
          const classesData = await CoreService.getAll('classes');
          setClasses(Array.isArray(classesData) ? classesData : []);
          break;
        case 'rooms':
          const roomsData = await SystemOptionsService.getByCategory('TIMETABLE_ROOM');
          setRooms(Array.isArray(roomsData.items) ? roomsData.items : []);
          break;
        case 'days':
          const daysData = await SystemOptionsService.getByCategory('TIMETABLE_DAY');
          setDays(Array.isArray(daysData.items) ? daysData.items : []);
          break;
        case 'timeslots':
          const timeslotsData = await SystemOptionsService.getByCategory('TIMETABLE_TIME_SLOT');
          setTimeSlots(Array.isArray(timeslotsData.items) ? timeslotsData.items : []);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      notify.error(t('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (item: DraggableItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, item: DraggableItem) => {
    e.preventDefault();
    setDragOverItem(item);
  };

  const handleDrop = async (targetItem: DraggableItem) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    try {
      // Ici on pourrait implémenter un réordonnancement
      // Pour l'instant, on swap juste les positions dans l'affichage
      notify.success(t('itemMoved'));
    } catch (error) {
      notify.error(t('errorMovingItem'));
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // CRUD operations
  const handleAddSubject = async () => {
    try {
      await CoreService.create('subjects', newSubject);
      notify.success(t('subjectAdded'));
      setShowAddModal(false);
      setNewSubject({ name: '', code: '', color: '#3b82f6', coefficient: 1, isActive: true });
      loadData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorAddingSubject'));
    }
  };

  const handleUpdateSubject = async (id: number, data: any) => {
    try {
      await CoreService.update('subjects', id, data);
      notify.success(t('subjectUpdated'));
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorUpdatingSubject'));
    }
  };

  const handleDeleteSubject = async (id: number) => {
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteTimeslot = async (id: number | string) => {
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const deleteSubject = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await CoreService.delete('subjects', Number(targetDeleteId));
      notify.success(t('subjectDeleted'));
      loadData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorDeletingSubject'));
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const deleteTimeslot = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await SystemOptionsService.delete('TIMETABLE_TIME_SLOT', targetDeleteId);
      notify.success(t('timeslotDeleted'));
      loadData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || t('errorDeletingTimeslot'));
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const toggleItemActive = async (item: DraggableItem, tab: string) => {
    try {
      const endpoint = tab === 'subjects' ? 'subjects' : 'classes';
      await CoreService.update(endpoint, Number(item.id), { isActive: !item.isActive });
      notify.success(t('statusUpdated'));
      loadData();
    } catch (error) {
      notify.error(t('errorUpdatingStatus'));
    }
  };

  // Render functions
  const renderSubjectsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('configureSubjects')}</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addSubject')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            draggable
            onDragStart={() => handleDragStart(subject)}
            onDragOver={(e) => handleDragOver(e, subject)}
            onDrop={() => handleDrop(subject)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-move ${
              dragOverItem?.id === subject.id ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-slate-700'
            } ${draggedItem?.id === subject.id ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: subject.color || '#3b82f6' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingItem(subject)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(Number(subject.id))}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 dark:text-white mb-1">{subject.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{subject.code}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t('coefficient')}: {subject.coefficient || 1}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.isActive}
                    onChange={() => toggleItemActive(subject, 'subjects')}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${subject.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${subject.isActive ? 'translate-x-6' : 'translate-x-1'} mt-1`} />
                  </div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClassesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('configureClasses')}</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('dragToReorder')}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('move')}</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('className')}</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('level')}</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('specialty')}</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status')}</th>
              <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {classes.map((cls: any) => (
              <tr
                key={cls.id}
                draggable
                onDragStart={() => handleDragStart(cls)}
                onDragOver={(e) => handleDragOver(e, cls)}
                onDrop={() => handleDrop(cls)}
                onDragEnd={handleDragEnd}
                className={`transition-colors ${
                  dragOverItem?.id === cls.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                } ${draggedItem?.id === cls.id ? 'opacity-50' : 'opacity-100'}`}
              >
                <td className="p-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                </td>
                <td className="p-3 font-medium text-gray-900 dark:text-white">{cls.name}</td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{t('level')} {cls.level}</td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{cls.specialty?.name || '-'}</td>
                <td className="p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cls.isActive}
                      onChange={() => toggleItemActive(cls, 'classes')}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors ${cls.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${cls.isActive ? 'translate-x-4' : 'translate-x-0.5'} mt-1`} />
                    </div>
                  </label>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setEditingItem(cls)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoomsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('configureRooms')}</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addRoom')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            draggable
            onDragStart={() => handleDragStart(room as any)}
            onDragOver={(e) => handleDragOver(e, room as any)}
            onDrop={() => handleDrop(room as any)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-move p-4 ${
              dragOverItem?.id === room.id ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-slate-700'
            } ${draggedItem?.id === room.id ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-400" />
                <h4 className="font-bold text-gray-900 dark:text-white">{room.label}</h4>
              </div>
              <button
                onClick={() => setEditingItem(room as any)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{room.value}</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={room.isActive}
                onChange={() => toggleItemActive(room as any, 'rooms')}
                className="sr-only"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{room.isActive ? t('active') : t('inactive')}</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${room.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${room.isActive ? 'translate-x-4' : 'translate-x-0.5'} mt-1`} />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDaysTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('configureDays')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => (
          <div
            key={day.id}
            draggable
            onDragStart={() => handleDragStart(day as any)}
            onDragOver={(e) => handleDragOver(e, day as any)}
            onDrop={() => handleDrop(day as any)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-move p-4 ${
              dragOverItem?.id === day.id ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-slate-700'
            } ${draggedItem?.id === day.id ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h4 className="font-bold text-gray-900 dark:text-white">{day.label}</h4>
              </div>
              <button
                onClick={() => setEditingItem(day as any)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{day.value}</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={day.isActive}
                onChange={() => toggleItemActive(day as any, 'days')}
                className="sr-only"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{day.isActive ? t('active') : t('inactive')}</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${day.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${day.isActive ? 'translate-x-4' : 'translate-x-0.5'} mt-1`} />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTimeslotsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('configureTimeSlots')}</h3>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {timeSlots.map((slot) => {
            const isPause = slot.value === '09:50' || slot.value === '12:00' || slot.value === '14:50' || slot.value === '19:20';
            return (
              <div
                key={slot.id}
                draggable
                onDragStart={() => handleDragStart(slot as any)}
                onDragOver={(e) => handleDragOver(e, slot as any)}
                onDrop={() => handleDrop(slot as any)}
                onDragEnd={handleDragEnd}
                className={`rounded-lg border-2 transition-all cursor-move p-4 ${
                  dragOverItem?.id === slot.id ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-slate-700'
                } ${draggedItem?.id === slot.id ? 'opacity-50' : 'opacity-100'} ${isPause ? 'bg-lime-50 dark:bg-lime-900/20' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <h4 className="font-bold text-gray-900 dark:text-white">{slot.label}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingItem(slot as any)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                      title={t('edit')}
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTimeslot(slot.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{slot.value}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${isPause ? 'bg-lime-200 text-lime-800' : 'bg-blue-100 text-blue-800'}`}>
                    {isPause ? t('break') : t('class')}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.isActive}
                      onChange={() => toggleItemActive(slot as any, 'timeslots')}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors ${slot.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${slot.isActive ? 'translate-x-4' : 'translate-x-0.5'} mt-1`} />
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase">
            {t('timetableConfiguration')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('timetableConfigDesc')}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors shadow-md"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">{t('close')}</span>
          </button>
        )}
        </div>

      {/* Tabs */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'subjects' && renderSubjectsTab()}
          {activeTab === 'classes' && renderClassesTab()}
          {activeTab === 'rooms' && renderRoomsTab()}
          {activeTab === 'days' && renderDaysTab()}
          {activeTab === 'timeslots' && renderTimeslotsTab()}
        </>
      )}

      {/* Add Modal would go here */}
      {showAddModal && activeTab === 'subjects' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('addSubject')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('subjectName')}
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('subjectCode')}
                  </label>
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('color')}
                  </label>
                  <input
                    type="color"
                    value={newSubject.color}
                    onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('coefficient')}
                  </label>
                  <input
                    type="number"
                    value={newSubject.coefficient}
                    onChange={(e) => setNewSubject({ ...newSubject, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddSubject}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {t('save')}
                </button>
              </div>
            </div>
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
        onConfirm={activeTab === 'timeslots' ? deleteTimeslot : deleteSubject}
        title={activeTab === 'timeslots' ? t('deleteTimeslot') : t('deleteSubject')}
        message={activeTab === 'timeslots' ? t('confirmDeleteTimeslot') : t('confirmDelete')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default TimetableConfig;
