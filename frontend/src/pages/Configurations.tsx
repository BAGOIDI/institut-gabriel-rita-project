import React, { useState, useEffect } from 'react';
import { SystemOptionsService, SystemOption } from '../services/system-options.service';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export const Configurations = () => {
  const [options, setOptions] = useState<SystemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SystemOption>>({});
  const [newForm, setNewForm] = useState({ category: 'GENDER', value: '', label: '', isActive: true });
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['GENDER', 'MARITAL_STATUS', 'DEGREE', 'SPECIALTY', 'CLASS_ROOM', 'BLOOD_GROUP'];

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const data = await SystemOptionsService.getAll();
      setOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await SystemOptionsService.create(newForm as any);
      setIsAdding(false);
      setNewForm({ category: 'GENDER', value: '', label: '', isActive: true });
      loadOptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await SystemOptionsService.update(id, editForm);
      setEditingId(null);
      loadOptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        await SystemOptionsService.delete(id);
        loadOptions();
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurations Système</h1>
        <div className="flex gap-4">
          <select 
            className="border border-gray-300 rounded-lg p-2 bg-white shadow-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} /> Ajouter une option
          </button>
        </div>
      </div>


      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Nouvelle Option</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={newForm.category}
                onChange={e => setNewForm({...newForm, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur (Code)</label>
              <input 
                type="text" className="w-full border rounded-lg p-2"
                value={newForm.value} onChange={e => setNewForm({...newForm, value: e.target.value})}
                placeholder="Ex: M"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libellé (Affichage)</label>
              <input 
                type="text" className="w-full border rounded-lg p-2"
                value={newForm.label} onChange={e => setNewForm({...newForm, label: e.target.value})}
                placeholder="Ex: Masculin"
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg w-full">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-medium text-gray-600">Catégorie</th>
              <th className="p-4 font-medium text-gray-600">Valeur</th>
              <th className="p-4 font-medium text-gray-600">Libellé</th>
              <th className="p-4 font-medium text-gray-600">Statut</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {options.filter(opt => filterCategory === 'ALL' || opt.category === filterCategory).map(opt => (
              <tr key={opt.id} className="hover:bg-gray-50">
                {editingId === opt.id ? (
                  <>
                    <td className="p-4">
                      <select 
                        className="border rounded p-1 w-full"
                        value={editForm.category}
                        onChange={e => setEditForm({...editForm, category: e.target.value})}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <input type="text" className="border rounded p-1 w-full" value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} />
                    </td>
                    <td className="p-4">
                      <input type="text" className="border rounded p-1 w-full" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} />
                    </td>
                    <td className="p-4">
                      <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} />
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleUpdate(opt.id)} className="text-green-600"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={18} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{opt.category}</span></td>
                    <td className="p-4 font-mono text-sm">{opt.value}</td>
                    <td className="p-4">{opt.label}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${opt.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {opt.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingId(opt.id); setEditForm(opt); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(opt.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
