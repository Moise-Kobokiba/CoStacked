// src/components/shared/ThemeToggle.jsx

import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={styles.toggleButton} 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Sun className={styles.icon} />
      ) : (
        <Moon className={styles.icon} />
      )}
      <span className={styles.text}>
        {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};