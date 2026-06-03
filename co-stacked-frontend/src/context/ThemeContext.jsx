// src/context/ThemeContext.jsx

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// Create the context with a default value
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// Create a custom hook for easy consumption of the context
export const useTheme = () => useContext(ThemeContext);

// Create the provider component
export const ThemeProvider = ({ children }) => {
  // State to hold the current theme.
  const [theme, setTheme] = useState(() => {
    // --- THIS IS THE UPDATE ---
    // 1. Check localStorage first. If a user has previously chosen a theme, respect it.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // 2. If no theme is saved in localStorage, ALWAYS default to 'light'.
    // The check for the user's system preference has been removed.
    return 'light';
  });

  // Effect to apply the theme to the <html> element and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // The function to toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // useMemo to prevent the context value from being recreated on every render
  const value = useMemo(() => ({
    theme,
    toggleTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};