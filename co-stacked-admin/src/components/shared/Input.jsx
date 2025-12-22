// src/components/shared/Input.jsx
import styles from './Input.module.css';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`${styles.input} ${className}`}
      {...props}
    />
  );
};