// src/components/shared/FeatureCard.jsx

import PropTypes from 'prop-types';
import styles from './FeatureCard.module.css';

// --- THIS IS THE FIX ---
// The component now expects a prop named 'icon' and immediately renames it
// to 'Icon' (with a capital letter) so that JSX can render it as a component.
export const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className={styles.card}>
      {/* A safety check to ensure an icon was passed before trying to render it */}
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon className={styles.icon} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

// Update PropTypes to match the new prop name 'icon'.
FeatureCard.propTypes = {
  // 'elementType' validates that the prop is a renderable React component.
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};