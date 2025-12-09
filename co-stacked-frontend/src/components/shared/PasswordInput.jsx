import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Input } from './Input';
import styles from './PasswordInput.module.css';

export const PasswordInput = ({ 
  value, 
  onChange, 
  name, 
  id, 
  placeholder = "Enter password", 
  required = false, 
  showStrengthMeter = false,
  showVisibilityToggle = true,
  showSecurityTip = false,
  onStrengthChange,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: '', color: '', isValid: false });

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '', isValid: false };

    // Strict length check per user request (6-8 characters)
    if (pwd.length < 6) {
      return { score: 1, label: 'Weak (min 6 chars)', color: 'weak', isValid: false };
    }
    if (pwd.length > 8) {
      return { score: 1, label: 'Weak (max 8 chars)', color: 'weak', isValid: false };
    }

    let complexity = 0;
    if (/[A-Z]/.test(pwd)) complexity++;
    if (/[a-z]/.test(pwd)) complexity++;
    if (/[0-9]/.test(pwd)) complexity++;
    if (/[^A-Za-z0-9]/.test(pwd)) complexity++; // Symbols

    if (complexity < 3) {
      return { score: 2, label: 'Medium', color: 'medium', isValid: true };
    }
    return { score: 3, label: 'Strong', color: 'strong', isValid: true };
  };

  useEffect(() => {
    const newStrength = calculateStrength(value);
    setStrength(newStrength);
    if (onStrengthChange) {
      onStrengthChange(newStrength);
    }
  }, [value, onStrengthChange]);

  // Calculate width percentage based on score (0-3)
  const getWidth = () => {
    if (strength.score === 0) return '0%';
    if (strength.score === 1) return '33%';
    if (strength.score === 2) return '66%';
    return '100%';
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.inputWrapper}>
        <Input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          name={name}
          id={id}
          placeholder={placeholder}
          required={required}
          className={showVisibilityToggle ? styles.inputWithToggle : ''}
        />
        
        {showVisibilityToggle && (
          <button
            type="button"
            className={styles.toggleButton}
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {showStrengthMeter && value && (
        <div className={styles.strengthMeter}>
          <div className={styles.strengthBarBg}>
            <div 
              className={`${styles.strengthBarFill} ${styles[strength.color]}`}
              style={{ width: getWidth() }}
            />
          </div>
          <span className={`${styles.strengthText} ${styles['text' + strength.color.charAt(0).toUpperCase() + strength.color.slice(1)]}`}>
            {strength.label}
          </span>
        </div>
      )}

      {showSecurityTip && (
        <div className={styles.securityTip}>
          <Info size={14} className={styles.tipIcon} />
          <span className={styles.tipText}>
            Use 6-8 characters with a mix of letters, numbers & symbols.
          </span>
        </div>
      )}
    </div>
  );
};

PasswordInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  showStrengthMeter: PropTypes.bool,
  showVisibilityToggle: PropTypes.bool,
  showSecurityTip: PropTypes.bool,
  onStrengthChange: PropTypes.func,
  className: PropTypes.string,
};
