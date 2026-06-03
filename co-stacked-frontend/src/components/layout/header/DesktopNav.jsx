// src/components/layout/header/DesktopNav.jsx
import { NavLink } from 'react-router-dom';
import styles from '../Header.module.css';
import PropTypes from 'prop-types';

export const DesktopNav = ({ links }) => (
  <nav className={styles.navLinks}>
    {links.map((link) => (
      <NavLink
        key={link.path}
        to={link.path}
        className={({ isActive }) => 
          isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
        }
      >
        {link.label}
      </NavLink>
    ))}
  </nav>
);

DesktopNav.propTypes = {
  links: PropTypes.array.isRequired,
};