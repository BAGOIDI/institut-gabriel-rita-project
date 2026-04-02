import React, { useMemo } from 'react';
import { Trash2, User, BookOpen, MapPin } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
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

interface ClassTimetableViewProps {
  timeSlots: TimeSlot[];
  classes: any[];
  teachers: any[];
  days: any[];
  timeSlotOptions: any[];
  onEditSlot: (slot: TimeSlot) => void;
  onCreateNewSlot: (dayId: string, startTime: string, targetId: string) => void;
  onDeleteSlot: (slotId: string) => void;
  viewMode: 'class' | 'teacher' | 'synthesis_class' | 'free_slot';
  selectedFilter: string;
  getColorForSubject: (name: string) => { color: string; bg: string };
}

const ClassTimetableView: React.FC<ClassTimetableViewProps> = ({ 
  timeSlots, 
  classes, 
  teachers,
  days, 
  timeSlotOptions, 
  onEditSlot, 
  onCreateNewSlot, 
  onDeleteSlot,
  viewMode,
  selectedFilter,
  getColorForSubject
}) => {
  const { t } = useTranslation();
  
  // Déterminer les colonnes dynamiquement
  const columns = useMemo(() => {
    if (viewMode === 'teacher') {
      if (selectedFilter) {
        return teachers.filter(t => String(t.id) === selectedFilter);
      }
      return teachers;
    }
    
    // Mode classe par défaut
    if (selectedFilter) {
      return classes.filter(c => String(c.id) === selectedFilter);
    }
    return classes;
  }, [viewMode, selectedFilter, classes, teachers]);

  const grid = useMemo(() => {
    const res: Record<string, Record<string, Record<string, TimeSlot[]>>> = {};
    
    days.forEach(day => {
      const dayId = String(day.value || day.id);
      res[dayId] = {};
      timeSlotOptions.forEach(ts => {
        const tsValue = String(ts.value);
        res[dayId][tsValue] = {};
        columns.forEach(col => {
          res[dayId][tsValue][String(col.id)] = [];
        });
      });
    });

    timeSlots.forEach(slot => {
      const dayId = String(slot.dayOfWeek);
      const tsValue = String(slot.startTime);
      const targetId = viewMode === 'teacher' ? String(slot.staffId) : String(slot.classId);

      if (res[dayId] && res[dayId][tsValue] && res[dayId][tsValue][targetId]) {
        res[dayId][tsValue][targetId].push(slot);
      }
    });

    return res;
  }, [timeSlots, columns, days, timeSlotOptions, viewMode]);

  const getLabel = (obj: any) => obj.labelFr || obj.label || obj.name || obj.value || '';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
      <div className="overflow-x-auto max-h-[75vh]">
        <table className="w-full divide-y divide-gray-200 dark:divide-slate-700 border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 w-24 sticky left-0 z-30">
                {t('days')}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 w-32 sticky left-24 z-30">
                {t('hours')}
              </th>
              {columns.map(col => (
                <th key={col.id} className="px-4 py-3 text-center text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest border border-gray-200 dark:border-slate-700 min-w-[200px] bg-gray-50 dark:bg-slate-800">
                  {viewMode === 'teacher' ? `${col.firstName} ${col.lastName}` : col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {days.map(day => {
              const dayId = String(day.value || day.id);
              return (
                <React.Fragment key={dayId}>
                  {timeSlotOptions.map((ts, tsIdx) => {
                    const tsValue = String(ts.value);
                    return (
                      <tr key={`${dayId}-${tsValue}`} className="group hover:bg-gray-50/30 dark:hover:bg-slate-700/20 transition-colors">
                        {tsIdx === 0 && (
                          <td 
                            rowSpan={timeSlotOptions.length} 
                            className="px-2 py-4 whitespace-nowrap text-[10px] font-black text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/10 text-center uppercase tracking-widest sticky left-0 z-10"
                            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                          >
                            {getLabel(day)}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/5 sticky left-24 z-10">
                          {getLabel(ts)}
                        </td>
                        {columns.map(col => {
                          const colId = String(col.id);
                          const slots = grid[dayId]?.[tsValue]?.[colId] || [];
                          return (
                            <td 
                              key={colId} 
                              onClick={() => slots.length === 0 && onCreateNewSlot?.(dayId, tsValue, colId)}
                              className={`p-1.5 border border-gray-100 dark:border-slate-700 min-w-[200px] align-top transition-all ${slots.length === 0 ? 'cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-900/10' : ''}`}
                            >
                              {slots.length > 0 ? (
                                <div className="space-y-1.5">
                                  {slots.map(slot => {
                                    const { color, bg } = getColorForSubject(slot.subjectName);
                                    return (
                                      <div 
                                        key={slot.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditSlot?.(slot);
                                        }}
                                        style={{ borderLeftColor: color, backgroundColor: bg }}
                                        className="relative p-2.5 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-all group/item overflow-hidden"
                                      >
                                        <div className="flex justify-between items-start mb-1.5 gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color }} />
                                            <div className="font-black text-[11px] uppercase tracking-tight truncate" style={{ color }}>
                                              {slot.subjectName}
                                            </div>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteSlot?.(slot.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors opacity-0 group-hover/item:opacity-100 flex-shrink-0"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                            <User className="w-2.5 h-2.5 opacity-50" />
                                            <span className="truncate">{viewMode === 'teacher' ? slot.className : slot.teacherName}</span>
                                          </div>
                                          {slot.roomName && (
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                              <MapPin className="w-2.5 h-2.5 opacity-50" />
                                              <span className="truncate">{slot.roomName}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Overlay for hover effect */}
                                        <div className="absolute inset-0 bg-white/0 group-hover/item:bg-white/10 dark:group-hover/item:bg-black/5 pointer-events-none transition-colors" />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-full min-h-[40px] w-full group-hover:bg-blue-50/10 dark:group-hover:bg-blue-900/5 transition-colors" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassTimetableView;