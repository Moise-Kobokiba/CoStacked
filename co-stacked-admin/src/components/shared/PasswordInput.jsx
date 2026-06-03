// src/components/shared/PasswordInput.jsx
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './PasswordInput.module.css';

export const PasswordInput = ({
  id,
  className = '',
  showStrengthMeter = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.passwordInput}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        className={`${styles.input} ${className}`}
        {...props}
      />
      <button
        type="button"
        className={styles.toggleButton}
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};