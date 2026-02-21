import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../lib/translations';
import {
  BancoDashboardIcon,
  BancoTeachersIcon,
  BancoStudentsIcon,
  BancoTimetableIcon,
  BancoAttendanceIcon,
  BancoPaymentsIcon,
  BancoPaymentRulesIcon,
  BancoReportsIcon,
  BancoSettingsIcon
} from './BancoIcons';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  badge?: string | number;
  submenu?: MenuItem[];
}

export const BancoSidebar = () => {
  const location = useLocation();
  const { language } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const t = translations[language];

  // Structure de menu essentielle pour le système de gestion
  const menuItems: MenuItem[] = [
    { 
      icon: BancoDashboardIcon, 
      label: t.dashboard, 
      path: '/' 
    },
    { 
      icon: BancoTeachersIcon, 
      label: t.teachers, 
      path: '/teachers' 
    },
    { 
      icon: BancoStudentsIcon, 
      label: t.students, 
      path: '/students' 
    },
    { 
      icon: BancoTimetableIcon, 
      label: t.timetable, 
      path: '/timetable' 
    },
    { 
      icon: BancoAttendanceIcon, 
      label: t.attendance, 
      path: '/attendance' 
    },
    { 
      icon: BancoPaymentsIcon, 
      label: t.payments, 
      path: '/payments' 
    },
    { 
      icon: BancoPaymentRulesIcon, 
      label: t.paymentRules, 
      path: '/payment-rules' 
    },
    { 
      icon: BancoReportsIcon, 
      label: t.reports, 
      path: '/reports' 
    },
    { 
      icon: BancoSettingsIcon, 
      label: t.settingsTitle, 
      path: '/settings' 
    }
  ];

  const toggleSubmenu = (path: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    const IconComponent = item.icon;
    const isActiveItem = isActive(item.path);
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenus[item.path];

    return (
      <div key={index} className="mb-1">
        <Link
          to={item.path}
          className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group font-inter ${
            isActiveItem
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-700 dark:text-gray-300 hover:bg-primary-light dark:hover:bg-primary-dark/20 hover:text-primary dark:hover:text-primary'
          }`}
          onClick={() => hasSubmenu && toggleSubmenu(item.path)}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md transition-colors flex items-center justify-center ${
              isActiveItem 
                ? 'bg-white/20' 
                : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-primary/10'
            }`} style={{ width: '36px', height: '36px' }}>
              <IconComponent className={`w-5 h-5 ${
                isActiveItem ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <span className="font-medium text-sm">{item.label}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                typeof item.badge === 'number'
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
            
            {hasSubmenu && (
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSubmenuOpen ? 'rotate-90' : ''
                } ${isActiveItem ? 'text-white' : 'text-gray-400'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </Link>

        {/* Sous-menu */}
        {hasSubmenu && isSubmenuOpen && (
          <div className="ml-8 mt-2 space-y-1">
            {item.submenu?.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                to={subItem.path}
                className={`block px-4 py-2 text-sm rounded-lg transition-colors font-inter ${
                  isActive(subItem.path)
                    ? 'text-primary bg-primary-light dark:bg-primary-dark/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 banco-sidebar flex flex-col transition-all duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: 'var(--sidebar-width)' }}
      >
        {/* Header */}
        <div  style={{ height: 'var(--header-height)' }} className="px-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
          <div >
            <div className="text-lg font-black tracking-wider uppercase text-primary font-inter">
              ADMIN ISGR
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-widest mt-1 font-inter">
              Système de Gestion
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-center">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-inter">
              Version 1.0.0
            </div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-inter">
              © 2026 ISGR - Tous droits réservés
            </div>
          </div>
        </div>
      </aside>

      {/* Bouton menu mobile */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};