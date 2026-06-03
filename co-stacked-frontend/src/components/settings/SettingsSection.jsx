// src/components/settings/SettingsSection.jsx

import styles from './SettingsSection.module.css';
import PropTypes from 'prop-types';

export const SettingsSection = ({ title, description, children, isDangerZone = false }) => {
  // Conditionally add the 'dangerZone' class if the prop is true
  const sectionClasses = `${styles.section} ${isDangerZone ? styles.dangerZone : ''}`;

  return (
    <div className={sectionClasses}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

// Add PropTypes for validation, including the new optional boolean
SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isDangerZone: PropTypes.bool,
};