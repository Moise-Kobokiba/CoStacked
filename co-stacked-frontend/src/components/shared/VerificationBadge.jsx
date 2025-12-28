// src/components/shared/VerificationBadge.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './VerificationBadge.module.css';
import badgeImage from '../../assets/verification-badge.png';


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
      <img 
        src={badgeImage} 
        alt="Verified" 
        className={styles.icon}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <CheckCircle 
        size={size} 
        className={styles.fallbackIcon} 
        fill="#2196f3" 
        color="white" 
        style={{ display: 'none' }}
      />
    </span>
  );
};
