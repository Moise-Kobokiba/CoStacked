// src/components/ui/Badge.jsx
import styles from './Badge.module.css';
import PropTypes from 'prop-types';

/**
 * A simple, styled badge component for displaying roles or statuses.
 * @param {string} text - The text to display inside the badge.
 * @param {string} variant - The color variant ('primary', 'secondary', 'success', 'danger', 'verified').
 */
export const Badge = ({ text, variant = 'secondary' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {text}
    </span>
  );
};

Badge.propTypes = {
  text: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'verified']),
};