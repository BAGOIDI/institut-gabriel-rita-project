import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  Menu, 
  Moon, 
  Sun, 
  Globe, 
  Maximize2, 
  Minimize2, 
  LogOut,
  ChevronDown,
  Mail,
  Calendar as CalendarIcon,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'payment' | 'attendance' | 'system';
}

export const BancoTopbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, toggleTheme, language, toggleLanguage, interfaceSize, toggleInterfaceSize, direction, toggleDirection } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { success } = useNotification();
  const t = translations[language];
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const disableAuth = ((import.meta as any).env?.VITE_DISABLE_AUTH || 'true') === 'true';

  // Notifications de démonstration
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Nouveau paiement',
      message: 'Un paiement de 50.000 FCFA a été effectué',
      time: 'Il y a 5 min',
      read: false,
      type: 'payment'
    },
    {
      id: '2',
      title: 'Retard signalé',
      message: '3 étudiants en retard ce matin',
      time: 'Il y a 1 heure',
      read: false,
      type: 'attendance'
    },
    {
      id: '3',
      title: 'Mise à jour système',
      message: 'Nouvelle version disponible',
      time: 'Hier',
      read: true,
      type: 'system'
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    success('Déconnexion effectuée');
    navigate('/', { replace: true });
  };

  const markAsRead = (id: string) => {
    // Logique pour marquer comme lu
    console.log('Notification marquée comme lue:', id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCardIcon className="w-4 h-4" />;
      case 'attendance':
        return <CalendarIcon className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-emerald-600 bg-emerald-100';
      case 'attendance':
        return 'text-amber-600 bg-amber-100';
      case 'system':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <header 
      style={{ height: 'var(--header-height)' }}
      className="banco-topbar flex items-center justify-between px-4 sticky top-0 z-10 transition-all bg-white/70 dark:bg-slate-900/35 backdrop-blur-xl"
    >
      {/* Section gauche */}
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg hover:text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Barre de recherche améliorée */}
        <div className="hidden sm:flex items-center bg-white/60 dark:bg-slate-900/30 border border-gray-200/70 dark:border-slate-700/60 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 rounded-xl px-4 py-2.5 w-52 md:w-64 transition-all">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
          <input 
            type="text" 
            placeholder={`${t.search}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 font-inter"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Section droite */}
      <div className="flex items-center gap-2">
        {/* Contrôle de taille d'interface */}
        <button 
          onClick={toggleInterfaceSize}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 hover:text-primary"
          title={`Changer la taille (actuel: ${interfaceSize === 'medium' ? 'Moyen' : 'Grand'})`}
        >
          <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
            {interfaceSize === 'medium' ? (
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300 animate-in zoom-in duration-300" />
            ) : (
              <Minimize2 className="w-4 h-4 text-primary animate-in zoom-in duration-300" />
            )}
          </div>
          <span className="text-xs font-medium uppercase hidden md:block font-inter">
            {interfaceSize === 'medium' ? 'MOYEN' : 'GRAND'}
          </span>
        </button>

        {/* Sélecteur de langue */}
        <button 
          onClick={toggleLanguage}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 hover:text-primary"
          title={`Changer la langue (actuel: ${language === 'fr' ? 'Français' : 'English'})`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium uppercase hidden md:block font-inter">
            {language === 'fr' ? 'FR' : 'EN'}
          </span>
        </button>

        {/* Direction LTR/RTL */}
        <button
          onClick={toggleDirection}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 hover:text-primary"
          title={`Direction (actuel: ${direction.toUpperCase()})`}
        >
          <span className="text-xs font-medium uppercase hidden md:block font-inter">
            {direction === 'rtl' ? 'RTL' : 'LTR'}
          </span>
        </button>

        {/* Toggle thème */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-300"
          aria-label="Changer de thème"
          title={theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
        >
          <div className="relative w-5 h-5">
            <Moon className={`w-4 h-4 absolute transition-all duration-500 ${
              theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : 'rotate-180 opacity-0 scale-0'
            }`} />
            <Sun className={`w-4 h-4 absolute transition-all duration-500 ${
              theme === 'light' ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-0'
            }`} />
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notifications */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/70 dark:border-slate-700/60 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white font-inter">Notifications</h3>
                    <button className="text-xs text-primary hover:text-primary-dark font-inter">
                      Tout marquer comme lu
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-slate-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate font-inter">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2 font-inter">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-inter">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
                  <button className="text-sm text-primary hover:text-primary-dark font-medium font-inter">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Menu utilisateur */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg p-2 transition-colors hover:text-primary"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase font-inter">
                Admin ISGR
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-inter">
                Administrateur
              </div>
            </div>
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/15">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown menu utilisateur */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/70 dark:border-slate-700/60 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/15">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white font-inter">Administrateur ISGR</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">admin@isgr.bf</p>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 font-inter">
                    <User className="w-4 h-4" />
                    Mon profil
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 font-inter">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 font-inter">
                    <Mail className="w-4 h-4" />
                    Support
                  </button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-slate-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 font-inter"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
