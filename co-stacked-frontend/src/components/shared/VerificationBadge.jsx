// src/components/shared/VerificationBadge.jsx
import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import styles from './VerificationBadge.module.css';

/**
 * Renders a verification badge (usually a blue checkmark or similar).
 * @param {object} props
 * @param {string} props.size - Size of the icon (default: 16)
 * @param {string} props.className - Extra classes
 */
export const VerificationBadge = ({ size = 16, className = '' }) => {
  return (
    <span 
        className={`${styles.badgeWrapper} ${className}`} 
        title="Verified User"
        aria-label="Verified User"
    >
      <CheckCircle size={size} className={styles.icon} fill="#2196f3" color="white" />
    </span>
  );
};
