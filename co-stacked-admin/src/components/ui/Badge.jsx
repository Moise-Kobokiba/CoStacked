// src/components/ui/Badge.jsx
import styles from './Badge.module.css';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';

/**
 * A simple, styled badge component for displaying roles or statuses.
 * @param {string} text - The text to display inside the badge.
 * @param {string} variant - The color variant ('primary', 'secondary', 'success', 'danger', 'verified').
 * @param {boolean} iconOnly - If true, shows only the checkmark icon (like Twitter verification).
 */
export const Badge = ({ text, variant = 'secondary', iconOnly = false }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${iconOnly ? styles.iconOnly : ''}`}>
      {iconOnly ? <Check size={12} strokeWidth={3} className={styles.checkIcon} /> : text}
    </span>
  );
};

Badge.propTypes = {
  text: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'verified']),
  iconOnly: PropTypes.bool,
};