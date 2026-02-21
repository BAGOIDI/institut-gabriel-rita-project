import React, { useState } from 'react';
import { Search, Bell, Settings, User, Menu, Moon, Sun, Globe, Maximize2, Minimize2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { translations } from '../lib/translations';

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, toggleTheme, language, toggleLanguage, interfaceSize, toggleInterfaceSize } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header 
      style={{ height: 'var(--header-height)' }}
      className="banco-topbar flex items-center justify-between px-4 sticky top-0 z-10 transition-all"
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg hover:text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar avec style BanCo */}
        <div className="hidden sm:flex items-center bg-gray-50 dark:bg-slate-700 border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-slate-700 focus-within:ring-4 focus-within:ring-primary/5 rounded-xl px-4 py-2 w-40 md:w-56 transition-all banco-input">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder={t.search}
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 font-inter"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Interface Size Toggle */}
        <button 
          onClick={toggleInterfaceSize}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 hover:text-primary"
          title={`Changer la taille (actuel: ${interfaceSize === 'medium' ? 'Moyen' : 'Grand'})`}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            {interfaceSize === 'medium' ? (
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-in zoom-in duration-300" />
            ) : (
              <Minimize2 className="w-5 h-5 text-blue-600 animate-in zoom-in duration-300" />
            )}
          </div>
          <span className="text-[10px] font-normal uppercase hidden xs:block">
            {interfaceSize === 'medium' ? 'MOYEN' : 'GRAND'}
          </span>
        </button>

        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 hover:text-primary"
          title={`Changer la langue (actuel: ${language === 'fr' ? 'Français' : 'English'})`}
        >
          <Globe className="w-5 h-5" />
          <span className="text-[10px] font-normal uppercase">
            {language === 'fr' ? 'FR' : 'EN'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-300"
          aria-label="Changer de thème"
          title={theme === 'dark' ? 'Mode jour' : 'Mode nuit'}
        >
          <div className="relative w-5 h-5">
            <Moon className={`w-5 h-5 absolute transition-all duration-500 ${
              theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : 'rotate-180 opacity-0 scale-0'
            }`} />
            <Sun className={`w-5 h-5 absolute transition-all duration-500 ${
              theme === 'light' ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-0'
            }`} />
          </div>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors hidden sm:block">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg p-2 transition-colors hover:text-primary"
          >
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-normal text-gray-900 dark:text-white uppercase font-inter">{user?.fullName || user?.username || t.admin}</div>
              <div className="text-[8px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-inter">{user?.role || t.administrator}</div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-20">
                <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-inter">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">{user?.email || ''}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-inter"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
