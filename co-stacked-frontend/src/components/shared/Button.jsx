// src/components/shared/Button.jsx

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * A versatile, reusable button component that can render as a standard <button>
 * or as a React Router <Link> for navigation if a 'to' prop is provided.
 */
export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  to = null,
  disabled = false,
}) => {
  // Combine the base class, the variant class, and any custom classes
  const buttonClasses = `${styles.button} ${styles[variant] || ''} ${disabled ? styles.disabled : ''} ${className}`;

  // If the 'to' prop exists, render the button as a navigational Link
  if (to) {
    return (
      <Link to={to} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  // Otherwise, render a standard HTML button element
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// PropTypes for component validation and documentation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  
  // === THIS IS THE UPDATE ===
  // Add 'outline' to the list of allowed variants
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),

  className: PropTypes.string,
  to: PropTypes.string,
  disabled: PropTypes.bool,
};