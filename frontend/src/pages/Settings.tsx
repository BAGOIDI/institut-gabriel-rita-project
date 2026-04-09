import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard,
  Key,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Clock,
  Download,
  Upload,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Plus,
  Save,
  X,
  Edit2,
  AlertCircle,
  Percent
} from 'lucide-react';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { BancoButton } from '../components/BancoButton';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../lib/translations';
import { SystemOptionsService, SystemOption } from '../services/system-options.service';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Settings = () => {
  const { language, toggleLanguage, theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  // États pour les configurations système
  const [systemOptions, setSystemOptions] = useState<SystemOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SystemOption>>({});
  const [newForm, setNewForm] = useState({ category: 'GENDER', value: '', label: '', isActive: true });
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // États pour les règles de paiement
  const [paymentRules, setPaymentRules] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'late_fee' as 'late_fee' | 'discount' | 'installment',
    amount: 0,
    percentage: 0,
    condition: '',
    isActive: true
  });

  const categories = ['GENDER', 'MARITAL_STATUS', 'DEGREE', 'SPECIALTY', 'CLASS_ROOM', 'BLOOD_GROUP'];

  // Charger les options système
  useEffect(() => {
    loadSystemOptions();
    loadPaymentRules();
  }, []);

  const loadSystemOptions = async () => {
    try {
      const data = await SystemOptionsService.getAll();
      setSystemOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadPaymentRules = () => {
    // Données de démonstration
    setPaymentRules([
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
  };

  const handleAddSystemOption = async () => {
    try {
      await SystemOptionsService.create(newForm as any);
      setIsAdding(false);
      setNewForm({ category: 'GENDER', value: '', label: '', isActive: true });
      loadSystemOptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateSystemOption = async (id: string) => {
    try {
      await SystemOptionsService.update(id, editForm);
      setEditingId(null);
      loadSystemOptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSystemOption = (id: string) => {
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDeleteSystemOption = async () => {
    if (!targetDeleteId) return;
    setDeleteLoading(true);
    try {
      await SystemOptionsService.delete(targetDeleteId);
      await loadSystemOptions();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const handleAddPaymentRule = () => {
    const rule = {
      id: Date.now().toString(),
      ...newRule,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPaymentRules([...paymentRules, rule]);
    setIsPaymentModalOpen(false);
    resetPaymentForm();
  };

  const handleUpdatePaymentRule = () => {
    if (editingRule) {
      setPaymentRules(paymentRules.map(rule => 
        rule.id === editingRule.id ? { ...editingRule, ...newRule } : rule
      ));
      setEditingRule(null);
      setIsPaymentModalOpen(false);
      resetPaymentForm();
    }
  };

  const handleDeletePaymentRule = (id: string) => {
    setPaymentRules(paymentRules.filter(rule => rule.id !== id));
  };

  const handleEditPaymentRule = (rule: any) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      type: rule.type,
      amount: rule.amount,
      percentage: rule.percentage || 0,
      condition: rule.condition,
      isActive: rule.isActive
    });
    setIsPaymentModalOpen(true);
  };

  const resetPaymentForm = () => {
    setNewRule({
      name: '',
      type: 'late_fee',
      amount: 0,
      percentage: 0,
      condition: '',
      isActive: true
    });
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'late_fee': return 'bg-red-100 text-red-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'installment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'late_fee': return t.lateFee;
      case 'discount': return t.discount;
      case 'installment': return t.installment;
      default: return type;
    }
  };

  const tabs = [
    { id: 'profile', label: t.profile, icon: User },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'security', label: t.security, icon: Shield },
    { id: 'appearance', label: t.appearance, icon: Palette },
    { id: 'billing', label: t.billing, icon: CreditCard },
    { id: 'system-config', label: 'Configurations Système', icon: SettingsIcon },
    { id: 'payment-rules', label: t.paymentRules, icon: Percent },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.personalInfo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t.fullName}
            </label>
            <input
              type="text"
              defaultValue="Administrateur ISGR"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              Email
            </label>
            <input
              type="email"
              defaultValue="admin@isgr.bf"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t('phone')}
            </label>
            <input
              type="tel"
              defaultValue="+226 70 00 00 00"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t.position}
            </label>
            <input
              type="text"
              defaultValue="Administrateur système"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
        </div>
        <div className="mt-6">
          <BancoButton variant="primary">
            <Edit3 className="w-4 h-4" />
            {t.updateProfile}
          </BancoButton>
        </div>
      </div>

      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t('changePassword')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t.currentPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="banco-input w-full px-4 py-2.5"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t.newPassword}
            </label>
            <input
              type="password"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              className="banco-input w-full px-4 py-2.5"
            />
          </div>
        </div>
        <div className="mt-6">
          <BancoButton variant="primary">
            <Key className="w-4 h-4" />
            {t('changePasswordBtn')}
          </BancoButton>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.emailNotifications}
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            label={t.paymentAlerts}
            description="Recevoir des notifications lorsque des paiements sont en retard"
            initialValue={true}
          />
          <ToggleSwitch
            label={t('weeklyReports')}
            description="Recevoir un résumé hebdomadaire des activités"
            initialValue={false}
          />
          <ToggleSwitch
            label={t.attendanceAlerts}
            description="Notifications pour les retards et absences"
            initialValue={true}
          />
          <ToggleSwitch
            label={t.systemUpdates}
            description="Recevoir des notifications sur les mises à jour"
            initialValue={false}
          />
        </div>
      </div>

      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t('inAppNotifications')}
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            label={t.pushNotifications}
            description="Activer les notifications push sur votre appareil"
            initialValue={true}
          />
          <ToggleSwitch
            label={t('notificationSound')}
            description="Émettre un son lors de nouvelles notifications"
            initialValue={false}
          />
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.authentication}
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            label={t.twoFactorAuth}
            description="Ajouter une couche de sécurité supplémentaire à votre compte"
            initialValue={false}
          />
          <ToggleSwitch
            label={t('activeSessions')}
            description="Gérer les sessions actives sur différents appareils"
            initialValue={true}
          />
        </div>
      </div>

      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.activeSessions}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white font-inter">Chrome sur Windows</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Votre appareil actuel • En ligne</p>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-medium rounded-full font-inter">
              Actif
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white font-inter">Safari sur iPhone</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Dernière activité: Il y a 2 jours</p>
            </div>
            <BancoButton variant="outline" size="sm">
              <Trash2 className="w-4 h-4" />
              Déconnecter
            </BancoButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.interfaceTheme}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-medium capitalize text-gray-800 dark:text-white font-inter">
                {t('darkMode')}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-inter">
                {t.reduceEyeStrain}
              </p>
            </div>
            <button
              type="button"
              className={`switch-btn relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                theme === 'dark' 
                  ? 'bg-primary' 
                  : 'bg-gray-200 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t('interfaceLanguage')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-medium capitalize text-gray-800 dark:text-white font-inter">
                {t('interfaceLanguage')}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-inter">
                {t.changeLanguage}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => language === 'en' && toggleLanguage()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'fr' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500'
                } font-inter`}
              >
                Français
              </button>
              <button
                onClick={() => language === 'fr' && toggleLanguage()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500'
                } font-inter`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t('paymentMethods')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-lg bg-gray-100 dark:bg-slate-700 p-6">
            <div className="mb-4 flex gap-x-2">
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
            </div>
            <h4 className="mb-2 text-base font-bold text-gray-900 dark:text-white font-inter">
              {t.creditCard}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
              **** **** **** 1234
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-inter">
              Expire le 12/2028
            </p>
            <button className="absolute right-4 top-4 p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="relative rounded-lg bg-gray-100 dark:bg-slate-700 p-6 border-2 border-dashed border-gray-300 dark:border-slate-600">
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2 font-inter">
                {t('addPaymentMethod')}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                {t.connectCard}
              </p>
              <BancoButton variant="outline" className="mt-4">
                <CreditCard className="w-4 h-4" />
                {t('addCard')}
              </BancoButton>
            </div>
          </div>
        </div>
      </div>

      <div className="banco-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-inter">
          {t.billingHistory}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white font-inter">{t('monthlySubscription')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Janvier 2026</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white font-inter">150.000 FCFA</p>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-medium rounded-full font-inter">
                Payé
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemConfigTab = () => (
    <div className="space-y-6">
      <div className="banco-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter">
            Options Système
          </h3>
          <div className="flex gap-4">
            <select 
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-slate-700 shadow-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Toutes les catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <BancoButton variant="primary" onClick={() => setIsAdding(!isAdding)}>
              <Plus size={20} /> Ajouter une option
            </BancoButton>
          </div>
        </div>

        {isAdding && (
          <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl mb-6 border border-gray-200 dark:border-gray-600">
            <h4 className="text-base font-semibold mb-4 font-inter">Nouvelle Option</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Catégorie</label>
                <select 
                  className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-gray-600"
                  value={newForm.category}
                  onChange={e => setNewForm({...newForm, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Valeur (Code)</label>
                <input 
                  type="text" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-gray-600"
                  value={newForm.value} onChange={e => setNewForm({...newForm, value: e.target.value})}
                  placeholder="Ex: M"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">Libellé (Affichage)</label>
                <input 
                  type="text" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-gray-600"
                  value={newForm.label} onChange={e => setNewForm({...newForm, label: e.target.value})}
                  placeholder="Ex: Masculin"
                />
              </div>
              <div className="flex items-end">
                <BancoButton onClick={handleAddSystemOption} className="w-full">
                  Enregistrer
                </BancoButton>
              </div>
            </div>
          </div>
        )}

        {loadingOptions ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="p-4 font-medium text-gray-600 dark:text-gray-300 font-inter">Catégorie</th>
                  <th className="p-4 font-medium text-gray-600 dark:text-gray-300 font-inter">Valeur</th>
                  <th className="p-4 font-medium text-gray-600 dark:text-gray-300 font-inter">Libellé</th>
                  <th className="p-4 font-medium text-gray-600 dark:text-gray-300 font-inter">Statut</th>
                  <th className="p-4 font-medium text-gray-600 dark:text-gray-300 font-inter text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {systemOptions.filter((opt: any) => filterCategory === 'ALL' || opt.category === filterCategory).map((opt: any) => (
                  <tr key={opt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    {editingId === opt.id ? (
                      <>
                        <td className="p-4">
                          <select 
                            className="border rounded p-1 w-full dark:bg-slate-700 dark:border-gray-600"
                            value={editForm.category}
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <input type="text" className="border rounded p-1 w-full dark:bg-slate-700 dark:border-gray-600" value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} />
                        </td>
                        <td className="p-4">
                          <input type="text" className="border rounded p-1 w-full dark:bg-slate-700 dark:border-gray-600" value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} />
                        </td>
                        <td className="p-4">
                          <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} />
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => handleUpdateSystemOption(opt.id)} className="text-green-600"><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4"><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">{opt.category}</span></td>
                        <td className="p-4 font-mono text-sm">{opt.value}</td>
                        <td className="p-4">{opt.label}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${opt.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                            {opt.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => { setEditingId(opt.id); setEditForm(opt); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                          <button onClick={() => handleDeleteSystemOption(opt.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter">
            {t.paymentRules}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
            {t.configurePaymentRules}
          </p>
        </div>
        <BancoButton variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
          <Plus className="w-4 h-4" />
          {t.addRule}
        </BancoButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentRules.map((rule) => (
          <div 
            key={rule.id} 
            className="banco-card rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 font-inter">
                  {rule.name}
                </h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeColor(rule.type)}`}>
                  {getPaymentTypeLabel(rule.type)}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPaymentRule(rule)}
                  className="p-2 hover:bg-primary-light dark:hover:bg-primary-dark/20 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeletePaymentRule(rule.id)}
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
                <span className="text-sm text-gray-900 dark:text-white font-inter">{rule.condition}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">Statut:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                  {rule.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal pour ajouter/modifier une règle */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-inter">
                {editingRule ? 'Modifier la règle' : 'Ajouter une règle'}
              </h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setEditingRule(null); resetPaymentForm(); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">Nom</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="banco-input w-full px-4 py-2.5"
                  placeholder="Ex: Pénalité de retard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">Type</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">Montant (FCFA)</label>
                  <input
                    type="number"
                    value={newRule.amount}
                    onChange={(e) => setNewRule({...newRule, amount: Number(e.target.value)})}
                    className="banco-input w-full px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">Pourcentage</label>
                  <input
                    type="number"
                    value={newRule.percentage}
                    onChange={(e) => setNewRule({...newRule, percentage: Number(e.target.value)})}
                    className="banco-input w-full px-4 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">Condition</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                  className="banco-input w-full px-4 py-2.5"
                  placeholder="Ex: Après 7 jours de retard"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <BancoButton 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setIsPaymentModalOpen(false); setEditingRule(null); resetPaymentForm(); }}
                >
                  Annuler
                </BancoButton>
                <BancoButton 
                  variant="primary" 
                  className="flex-1"
                  onClick={editingRule ? handleUpdatePaymentRule : handleAddPaymentRule}
                >
                  {editingRule ? 'Modifier' : 'Ajouter'}
                </BancoButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'notifications': return renderNotificationsTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'billing': return renderBillingTab();
      case 'system-config': return renderSystemConfigTab();
      case 'payment-rules': return renderPaymentRulesTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-tight font-inter">
            {t.settingsTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
            {t('managePreferences')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="banco-card rounded-xl p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all font-inter ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-lg shadow-blue-500/10'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-primary dark:hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>

      {/* Dialog de confirmation pour la suppression */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (deleteLoading) return;
          setConfirmOpen(false);
          setTargetDeleteId(null);
        }}
        onConfirm={confirmDeleteSystemOption}
        title="Supprimer l'option"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette option ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};