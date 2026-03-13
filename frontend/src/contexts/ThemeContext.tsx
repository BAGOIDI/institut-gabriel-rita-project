import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'fr' | 'en';
type InterfaceSize = 'medium' | 'large';
type Direction = 'ltr' | 'rtl';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  interfaceSize: InterfaceSize;
  toggleInterfaceSize: () => void;
  direction: Direction;
  toggleDirection: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved as Theme;
    }
    // Détecter le thème système par défaut
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const [interfaceSize, setInterfaceSizeState] = useState<InterfaceSize>(() => {
    const saved = localStorage.getItem('interfaceSize');
    return (saved as InterfaceSize) || 'medium';
  });

  const [direction, setDirection] = useState<Direction>(() => {
    const saved = localStorage.getItem('direction');
    return (saved as Direction) || 'ltr';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Add transition class before changing theme
    document.documentElement.classList.add('transitioning');
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, 300);
    
    return () => clearTimeout(timer);
  }, [theme]);

  // Écouter les changements de préférences système pour le thème
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Ne changer le thème que si l'utilisateur n'a pas défini de thème personnalisé
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('interfaceSize', interfaceSize);
    
    // Manage root font size based on interface size
    const root = document.documentElement;
    root.classList.remove('size-medium', 'size-large');
    root.classList.add(`size-${interfaceSize}`);
    
    const sizeMap = {
      medium: '16.5px',
      large: '20px'
    };
    root.style.fontSize = sizeMap[interfaceSize];
  }, [interfaceSize]);

  useEffect(() => {
    localStorage.setItem('direction', direction);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.classList.remove('dir-ltr', 'dir-rtl');
    document.documentElement.classList.add(`dir-${direction}`);
  }, [direction]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const toggleInterfaceSize = () => {
    setInterfaceSizeState(prev => prev === 'medium' ? 'large' : 'medium');
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      language, 
      toggleLanguage, 
      interfaceSize, 
      toggleInterfaceSize,
      direction,
      toggleDirection
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
