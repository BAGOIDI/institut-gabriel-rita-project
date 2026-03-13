import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';

const ClassTimetableView = ({ timeSlots, classes, days, timeSlotOptions, onEditSlot, onCreateSlot, onDeleteSlot }) => {
  const grid = useMemo(() => {
    // On prépare la structure de la grille : [dayId][timeSlotValue][classId]
    const res = {};
    
    days.forEach(day => {
      const dayId = String(day.value || day.id);
      res[dayId] = {};
      timeSlotOptions.forEach(ts => {
        const tsValue = String(ts.value);
        res[dayId][tsValue] = {};
        classes.forEach(c => {
          res[dayId][tsValue][String(c.id)] = [];
        });
      });
    });

    // On remplit la grille avec les créneaux existants
    timeSlots.forEach(slot => {
      const dayId = String(slot.dayOfWeek);
      const tsValue = String(slot.startTime);
      const classId = String(slot.classId);

      if (res[dayId] && res[dayId][tsValue]) {
        if (!res[dayId][tsValue][classId]) {
          res[dayId][tsValue][classId] = [];
        }
        res[dayId][tsValue][classId].push(slot);
      }
    });

    return res;
  }, [timeSlots, classes, days, timeSlotOptions]);

  const getLabel = (obj) => obj.labelFr || obj.label || obj.name || obj.value || '';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full divide-y divide-gray-200 dark:divide-slate-700 border-collapse table-fixed">
          <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th 
                style={{ width: '150px', maxWidth: '150px' }}
                className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
              >
                Jours
              </th>
              <th 
                style={{ width: '150px', maxWidth: '150px' }}
                className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
              >
                Horaires
              </th>
              {classes.map(c => (
                <th key={c.id} className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border border-gray-200 dark:border-slate-700 min-w-[150px] bg-gray-50 dark:bg-slate-800">
                  {c.name}
                </th>
              ))}
              <th className="px-4 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 w-full"></th>
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
                      <tr key={`${dayId}-${tsValue}`} className="hover:bg-gray-50/30 dark:hover:bg-slate-700/20 transition-colors">
                        {tsIdx === 0 && (
                          <td 
                            rowSpan={timeSlotOptions.length} 
                            style={{ width: '150px', maxWidth: '150px' }}
                            className="px-4 py-4 whitespace-nowrap text-xs font-bold text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/10 text-center uppercase tracking-widest [writing-mode:vertical-lr] rotate-180"
                          >
                            {getLabel(day)}
                          </td>
                        )}
                        <td 
                          style={{ width: '150px', maxWidth: '150px' }}
                          className="px-4 py-3 whitespace-nowrap text-[11px] font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/5"
                        >
                          {getLabel(ts)}
                        </td>
                        {classes.map(c => {
                          const classId = String(c.id);
                          const slots = grid[dayId]?.[tsValue]?.[classId] || [];
                          return (
                            <td 
                              key={classId} 
                              onClick={() => slots.length === 0 && onCreateSlot?.(dayId, tsValue, classId)}
                              className={`px-2 py-2 border border-gray-100 dark:border-slate-700 min-w-[150px] vertical-top transition-colors ${slots.length === 0 ? 'cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-900/10' : ''}`}
                            >
                              {slots.length > 0 ? (
                                <div className="space-y-1.5">
                                  {slots.map(slot => (
                                    <div 
                                      key={slot.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSlot?.(slot);
                                      }}
                                      className="group relative p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-all bg-blue-50/50 dark:bg-blue-900/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                    >
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-[10px] text-blue-700 dark:text-blue-300 leading-tight truncate mr-4">
                                          {slot.subjectName}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSlot?.(slot.id);
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                      <div className="text-[9px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        <span className="opacity-70 truncate">{slot.teacherName}</span>
                                      </div>
                                      {slot.roomName && (
                                        <div className="text-[8px] text-gray-400 dark:text-gray-500 italic mt-0.5">
                                          {slot.roomName}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full min-h-[30px] w-full"></div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 border border-gray-100 dark:border-slate-700 w-full"></td>
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