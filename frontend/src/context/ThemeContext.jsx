import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'cascadenav-theme';
const VALID_THEMES = ['dark', 'light'];

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored)) return stored;
    } catch (_) {
      // localStorage unavailable
    }
    return 'dark';
  });

  // Apply data-theme attribute and persist on every theme change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      // localStorage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

