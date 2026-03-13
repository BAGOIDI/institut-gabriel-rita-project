import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BancoSidebar } from './BancoSidebar';
import { BancoTopbar } from './BancoTopbar';

export const BancoLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMenuClick = () => {
    setIsMobileMenuOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden transition-all duration-300 bg-background">
      {/* Sidebar */}
      <BancoSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <BancoTopbar onMenuClick={handleMenuClick} />
        
        {/* Contenu */}
        <main 
          style={{ padding: 'var(--container-padding)' }}
          className="flex-1 overflow-auto transition-all duration-300 bg-background"
        >
          <div className="relative min-h-full">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_450px_at_20%_0%,rgba(37,99,235,0.10),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_20%_0%,rgba(59,130,246,0.10),transparent_60%)]" />
            <div className="banco-card rounded-2xl p-6 min-h-full border border-gray-100/70 dark:border-slate-700/60">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};