// src/components/shared/Button.jsx
import styles from './Button.module.css';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => {
  const variantClass = styles[variant] || styles.primary;

  return (
    <button
      className={`${styles.button} ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};