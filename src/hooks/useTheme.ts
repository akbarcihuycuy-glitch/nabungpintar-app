import { useState, useEffect } from 'react';
import { ThemeMode } from '../types/database';
import { storageService } from '../services/storage';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('np_theme_mode') as ThemeMode;
    return saved || 'dark';
  });

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      const root = document.documentElement;
      let isDark = false;
      if (mode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = mode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme(theme);
    localStorage.setItem('np_theme_mode', theme);
    storageService.updateSettings({ theme }).catch(() => {});

    // Listen to system theme changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme, isDark: document.documentElement.classList.contains('dark') };
}

