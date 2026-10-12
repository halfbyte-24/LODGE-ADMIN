import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Light warm theme is the primary visual presentation
  const [theme, setTheme] = useState('day');

  // Apply data-theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Manual toggle handler: toggles between day and night
  const toggleTheme = () => {
    setTheme(prev => (prev === 'day' ? 'night' : 'day'));
  };

  const resetToAuto = () => {
    setTheme('day');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDay: theme === 'day',
        isNight: theme === 'night',
        isAuto: false,
        toggleTheme,
        resetToAuto
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
