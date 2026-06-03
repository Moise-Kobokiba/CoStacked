// src/components/layout/header/HeaderLogo.jsx
import { Link } from 'react-router-dom';
import styles from '../Header.module.css';
import PropTypes from 'prop-types';

export const HeaderLogo = ({ logoSrc }) => (
  <div className={styles.leftSection}>
    <Link to="/" className={styles.logoContainer}>
      <img src={logoSrc} alt="CoStacked Logo" className={styles.logoImage} />
      <span className={styles.logoText}>CoStacked</span>
    </Link>
  </div>
);

HeaderLogo.propTypes = {
  logoSrc: PropTypes.string.isRequired,
};