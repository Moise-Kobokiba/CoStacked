// src/components/shared/Checkbox.jsx
import PropTypes from 'prop-types';
import styles from './Checkbox.module.css';

export const Checkbox = ({ 
  id, 
  checked, 
  onChange, 
  disabled = false,
  className = '' 
}) => {
  return (
    <div className={`${styles.checkboxWrapper} ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.checkbox}
      />
      <label htmlFor={id} className={styles.checkboxLabel}>
        <span className={styles.checkmark}>
          <svg 
            viewBox="0 0 14 14" 
            fill="none" 
            className={checked ? styles.checked : ''}
          >
            <path
              d="M3 8L6 11L11 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </label>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Checkbox;
