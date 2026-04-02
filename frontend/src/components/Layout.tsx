import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckSquare, 
  CreditCard, 
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { Topbar } from './Topbar';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { translations } from '../lib/translations';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { language } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useTranslation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/' },
    { icon: Users, label: t.teachers, path: '/teachers' },
    { icon: GraduationCap, label: t.students, path: '/students' },
    { icon: Calendar, label: t.timetable, path: '/timetable' },
    { icon: CheckSquare, label: t.attendance, path: '/attendance' },
    { icon: CreditCard, label: t.payments, path: '/payments' },
    { icon: Settings, label: 'Règles paiement', path: '/payment-rules' },
    { icon: BarChart3, label: t.reports, path: '/reports' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden transition-all duration-300 bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar avec style BanCo */}
      <aside 
        style={{ width: 'var(--sidebar-width)' }}
        className={`fixed lg:static inset-y-0 left-0 z-50 banco-sidebar text-gray-900 dark:text-white flex flex-col shadow-xl transition-all duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
          <div>
            <div className="text-base font-black tracking-wider uppercase text-primary font-inter">ADMIN ISGR</div>
            <div className="text-[8px] text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-widest mt-0.5 font-inter">Système de Gestion</div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 mt-2 px-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-all duration-200 text-xs font-medium group ${
                location.pathname === item.path 
                  ? 'bg-primary text-white shadow-md font-inter' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-primary-light dark:hover:bg-primary-dark/20 hover:text-primary dark:hover:text-primary font-inter'
              }`}
            >
              <item.icon className="w-[16px] h-[16px] mr-2" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center font-inter">
            Version 1.0.0
          </div>
        </div>
      </aside>

      {/* Main Content Area avec style BanCo */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main 
          style={{ padding: 'var(--container-padding)' }}
          className="flex-1 overflow-auto transition-all duration-300 bg-background"
        >
          <div className="banco-card rounded-2xl p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
