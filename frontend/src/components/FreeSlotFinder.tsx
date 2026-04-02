import React, { useState } from 'react';
import { Search, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

const FreeSlotFinder = ({ teachers, classes, timeSlots, days, timeSlotOptions, onCreateSlot }) => {
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    const occupiedSlots = new Set();

    timeSlots.forEach(slot => {
      const key = `${slot.dayOfWeek}-${slot.startTime}`;
      if (selectedTeachers.includes(String(slot.staffId))) occupiedSlots.add(key);
      if (selectedClasses.includes(String(slot.classId))) occupiedSlots.add(key);
    });

    const availableSlots = [];
    days.forEach(day => {
      timeSlotOptions.forEach(ts => {
        const key = `${day.value || day.id}-${ts.value}`;
        if (!occupiedSlots.has(key)) {
          availableSlots.push({ 
            day: day.labelFr || day.label || day.name, 
            time: ts.label || ts.value,
            dayValue: day.value || day.id,
            timeValue: ts.value
          });
        }
      });
    });

    setFreeSlots(availableSlots);
    setSearched(true);
  };

  const toggleClass = (id) => {
    setSelectedClasses(prev => 
      prev.includes(String(id)) 
        ? prev.filter(c => c !== String(id)) 
        : [...prev, String(id)]
    );
  };

  const toggleTeacher = (id) => {
    setSelectedTeachers(prev => 
      prev.includes(String(id)) 
        ? prev.filter(t => t !== String(id)) 
        : [...prev, String(id)]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map(c => String(c.id)));
  };

  const deselectAllClasses = () => {
    setSelectedClasses([]);
  };

  const handleCreateSlot = (slot) => {
    if (onCreateSlot) {
      onCreateSlot({
        dayOfWeek: slot.dayValue,
        startTime: slot.timeValue,
        endTime: slot.timeValue,
        label: `${slot.day} - ${slot.time}`
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-4 h-4 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Recherche de créneaux libres</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Classes Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Classes
            </label>
            <div className="flex gap-3">
              <button 
                onClick={selectAllClasses}
                className="text-[10px] text-blue-600 hover:underline font-medium"
              >
                Tout sélectionner
              </button>
              <button 
                onClick={deselectAllClasses}
                className="text-[10px] text-gray-500 hover:underline font-medium"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-100 dark:border-slate-700 rounded-md bg-gray-50/50 dark:bg-slate-900/20">
            {classes.map(c => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedClasses.includes(String(c.id))}
                  onChange={() => toggleClass(c.id)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Teachers Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Enseignants (Optionnel)
            </label>
            <button 
              onClick={() => setSelectedTeachers([])}
              className="text-[10px] text-gray-500 hover:underline font-medium"
            >
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-100 dark:border-slate-700 rounded-md bg-gray-50/50 dark:bg-slate-900/20">
            {teachers.map(t => (
              <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedTeachers.includes(String(t.id))}
                  onChange={() => toggleTeacher(t.id)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                  {t.firstName} {t.lastName}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button 
          onClick={handleSearch} 
          disabled={selectedClasses.length === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-bold text-sm uppercase transition-all shadow-md ${
            selectedClasses.length > 0 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Search className="w-4 h-4" />
          Trouver les créneaux disponibles
        </button>
      </div>

      {searched && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Créneaux libres détectés ({freeSlots.length})
          </h3>
          
          {freeSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {freeSlots.map((slot, index) => (
                <div 
                  key={index}
                  onClick={() => handleCreateSlot(slot)}
                  className="p-3 bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700 rounded-md hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {slot.day}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {slot.time}
                  </div>
                  <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    + Créer ce créneau
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <XCircle className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm italic">Aucun créneau libre trouvé pour cette sélection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeSlotFinder;