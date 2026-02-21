import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { BancoButton } from '../components/BancoButton';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';

export const Settings = () => {
  const { language, toggleLanguage, theme, toggleTheme } = useTheme();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'profile', label: t.profile, icon: User },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'security', label: t.security, icon: Shield },
    { id: 'appearance', label: t.appearance, icon: Palette },
    { id: 'billing', label: t.billing, icon: CreditCard },
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
              {t.phone}
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
          {t.changePassword}
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
              {t.confirmNewPassword}
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
            {t.changePasswordBtn}
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
            label={t.weeklyReports}
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
          {t.inAppNotifications}
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            label={t.pushNotifications}
            description="Activer les notifications push sur votre appareil"
            initialValue={true}
          />
          <ToggleSwitch
            label={t.notificationSound}
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
            label={t.activeSessions}
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
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full font-inter">
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
                {t.darkMode}
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
          {t.interfaceLanguage}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-medium capitalize text-gray-800 dark:text-white font-inter">
                {t.interfaceLanguage}
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
          {t.paymentMethods}
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
                {t.addPaymentMethod}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                {t.connectCard}
              </p>
              <BancoButton variant="outline" className="mt-4">
                <CreditCard className="w-4 h-4" />
                {t.addCard}
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
              <p className="font-medium text-gray-900 dark:text-white font-inter">{t.monthlySubscription}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Janvier 2026</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white font-inter">150.000 FCFA</p>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full font-inter">
                Payé
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'notifications': return renderNotificationsTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'billing': return renderBillingTab();
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
            {t.managePreferences}
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
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-primary-light dark:hover:bg-primary-dark/20 hover:text-primary dark:hover:text-primary'
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
    </div>
  );
};