import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'lab' | 'sketchbook' | 'blueprint' | 'sidewalk';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('4ms-theme');
    if (stored && ['lab', 'sketchbook', 'blueprint', 'sidewalk'].includes(stored)) {
      return stored as Theme;
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'lab';
    if (hour >= 12 && hour < 17) return 'sketchbook';
    if (hour >= 17 && hour < 21) return 'blueprint';
    return 'sidewalk';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('4ms-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTheme((current) => {
          const themes: Theme[] = ['lab', 'sketchbook', 'blueprint', 'sidewalk'];
          const currentIndex = themes.indexOf(current);
          return themes[(currentIndex + 1) % themes.length];
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
