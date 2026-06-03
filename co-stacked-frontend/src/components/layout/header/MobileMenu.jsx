// src/components/layout/header/MobileMenu.jsx

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../shared/Button';
import { X } from 'lucide-react'; // Make sure X is imported
import styles from '../Header.module.css';
import PropTypes from 'prop-types';

export const MobileMenu = ({ onClose, links, isAuthenticated, onLogout }) => (
  <motion.div 
    className={styles.mobileMenuOverlay}
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'tween', duration: 0.3 }}
  >
    <div className={styles.mobileMenuHeader}>
      <span className={styles.mobileMenuTitle}>Menu</span>
      {/* --- THIS IS THE FIX --- */}
      {/* Ensure the button is present and uses the correct class name */}
      <button onClick={onClose} aria-label="Close menu" className={styles.closeButton}>
        <X size={28} />
      </button>
    </div>
    <nav className={styles.mobileNavLinks}>
      {links.map(link => (
        <NavLink 
          key={link.path} 
          to={link.path} 
          className={({isActive}) => isActive ? `${styles.mobileNavLink} ${styles.activeMobileLink}` : styles.mobileNavLink}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
    <div className={styles.mobileMenuFooter}>
      {isAuthenticated ? (
        <Button variant="secondary" onClick={onLogout} fullWidth>Logout</Button>
      ) : (
        <div className={styles.mobileAuthButtons}>
          <Button variant="secondary" to="/login" fullWidth>Login</Button>
          <Button variant="primary" to="/signup" fullWidth>Sign Up</Button>
        </div>
      )}
    </div>
  </motion.div>
);

MobileMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  links: PropTypes.array.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};