import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Calendar, Clock, Percent, AlertCircle } from 'lucide-react';
import { BancoButton } from '../components/BancoButton';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';

interface PaymentRule {
  id: string;
  name: string;
  type: 'late_fee' | 'discount' | 'installment';
  amount: number;
  percentage?: number;
  condition: string;
  isActive: boolean;
  createdAt: string;
}

export const PaymentRules = () => {
  const { language } = useTheme();
  const t = translations[language];
  const [rules, setRules] = useState<PaymentRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PaymentRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'late_fee' as 'late_fee' | 'discount' | 'installment',
    amount: 0,
    percentage: 0,
    condition: '',
    isActive: true
  });

  // Données de démonstration
  useEffect(() => {
    setRules([
      {
        id: '1',
        name: 'Pénalité de retard',
        type: 'late_fee',
        amount: 5000,
        percentage: 5,
        condition: 'Après 7 jours de retard',
        isActive: true,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        name: 'Remise boursier',
        type: 'discount',
        amount: 0,
        percentage: 20,
        condition: 'Pour les étudiants boursiers',
        isActive: true,
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        name: 'Paiement échelonné',
        type: 'installment',
        amount: 0,
        percentage: 25,
        condition: '4 versements mensuels',
        isActive: true,
        createdAt: '2024-01-05'
      }
    ]);
  }, []);

  const handleAddRule = () => {
    const rule: PaymentRule = {
      id: Date.now().toString(),
      ...newRule,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRules([...rules, rule]);
    setIsModalOpen(false);
    resetForm();
  };

  const handleUpdateRule = () => {
    if (editingRule) {
      setRules(rules.map(rule => 
        rule.id === editingRule.id ? { ...editingRule, ...newRule } : rule
      ));
      setEditingRule(null);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleEditRule = (rule: PaymentRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      type: rule.type,
      amount: rule.amount,
      percentage: rule.percentage || 0,
      condition: rule.condition,
      isActive: rule.isActive
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      type: 'late_fee',
      amount: 0,
      percentage: 0,
      condition: '',
      isActive: true
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'late_fee': return 'bg-red-100 text-red-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'installment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'late_fee': return t.lateFee;
      case 'discount': return t.discount;
      case 'installment': return t.installment;
      default: return type;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-tight font-inter">
            {t.paymentRules}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
            {t.configurePaymentRules}
          </p>
        </div>
        <BancoButton 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          {t.addRule}
        </BancoButton>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div 
            key={rule.id} 
            className="banco-card rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 font-inter">
                  {rule.name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(rule.type)}`}>
                  {getTypeLabel(rule.type)}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditRule(rule)}
                  className="p-2 hover:bg-primary-light dark:hover:bg-primary-dark/20 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">{t.amount}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {rule.amount > 0 ? `${rule.amount.toLocaleString()} FCFA` : `${rule.percentage}%`}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">{t.condition}:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 text-right">{rule.condition}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                    {t.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rule.isActive 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.isActive ? t.active : t.inactive}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                <Calendar className="inline w-3 h-3 mr-1" />
                Créé le {rule.createdAt}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="banco-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-inter">
                {editingRule ? t.editRule : t.addNewRule}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                  {t.ruleName}
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="banco-input w-full px-4 py-2.5"
                  placeholder={t.enterRuleName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                  {t.ruleType}
                </label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                  className="banco-input w-full px-4 py-2.5"
                >
                  <option value="late_fee">{t.lateFee}</option>
                  <option value="discount">{t.discount}</option>
                  <option value="installment">{t.installment}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                    {t.amount} (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newRule.amount}
                    onChange={(e) => setNewRule({...newRule, amount: parseInt(e.target.value) || 0})}
                    className="banco-input w-full px-4 py-2.5"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                    {t.percentage} (%)
                  </label>
                  <input
                    type="number"
                    value={newRule.percentage}
                    onChange={(e) => setNewRule({...newRule, percentage: parseInt(e.target.value) || 0})}
                    className="banco-input w-full px-4 py-2.5"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                  {t.condition}
                </label>
                <textarea
                  value={newRule.condition}
                  onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                  className="banco-input w-full px-4 py-2.5 min-h-[100px]"
                  placeholder={t.enterCondition}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newRule.isActive}
                    onChange={(e) => setNewRule({...newRule, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-inter">
                    {t.activeRule}
                  </label>
                </div>

                <div className="flex space-x-3">
                  <BancoButton
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    <X className="w-4 h-4" />
                    {t.cancel}
                  </BancoButton>
                  <BancoButton
                    variant="primary"
                    onClick={editingRule ? handleUpdateRule : handleAddRule}
                  >
                    <Save className="w-4 h-4" />
                    {editingRule ? t.update : t.save}
                  </BancoButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 font-inter">
            {t.noRulesYet}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-inter">
            {t.createFirstRule}
          </p>
          <BancoButton 
            variant="primary" 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {t.addFirstRule}
          </BancoButton>
        </div>
      )}
    </div>
  );
};