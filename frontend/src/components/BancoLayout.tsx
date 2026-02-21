import React, { useState, useEffect } from 'react';
import { BancoSidebar } from './BancoSidebar';
import { BancoTopbar } from './BancoTopbar';

export const BancoLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  const handleMenuClick = () => {
    setIsMobileMenuOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden transition-all duration-300 bg-background">
      {/* Sidebar */}
      <BancoSidebar />
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <BancoTopbar onMenuClick={handleMenuClick} />
        
        {/* Contenu */}
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