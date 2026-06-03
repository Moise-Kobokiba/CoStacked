// src/context/ThemeContext.js

import { createContext, useContext } from 'react';

// Create the context with a default value.
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => console.warn('toggleTheme function not yet initialized'),
});

// Create and export a custom hook for easy consumption.
export const useTheme = () => useContext(ThemeContext);