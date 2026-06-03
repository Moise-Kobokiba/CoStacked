// src/components/layout/AdminSidebar.jsx

import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutAdmin } from '../../features/auth/adminAuthSlice';
import styles from './AdminSidebar.module.css';
import PropTypes from 'prop-types';

// Import all necessary icons
import { LayoutDashboard, Users, Briefcase, Flag, Settings, LogOut, BookOpen, Lightbulb } from 'lucide-react';
import logoSrc from '../../assets/logo.png';

const adminNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "User Management", href: "/users", icon: Users },
  { title: "Project Management", href: "/projects", icon: Briefcase },
  { title: "Articles", href: "/articles", icon: BookOpen },
  { title: "Validation Board", href: "/validation", icon: Lightbulb },
  { title: "Content Moderation", href: "/reports", icon: Flag },
  { title: "Settings", href: "/settings", icon: Settings },
];

// --- MODIFIED: Accept `isOpen` and `onClose` props for mobile behavior ---
export const AdminSidebar = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  // Dynamically apply the 'isOpen' class for mobile view
  const sidebarClasses = `${styles.sidebar} ${isOpen ? styles.isOpen : ''}`;

  return (
    <>
      {/* --- NEW: Render a backdrop overlay when the sidebar is open on mobile --- */}
      {isOpen && <div className={styles.sidebarBackdrop} onClick={onClose} />}

      <aside className={sidebarClasses}>
        <Link to="/" className={styles.header}>
          <img src={logoSrc} alt="CoStacked Admin Logo" className={styles.logoImage} />
          <span className={styles.logoText}>CoStacked Admin</span>
        </Link>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {adminNavItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
                  }
                  onClick={onClose} // Close sidebar on mobile when a link is clicked
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <button className={styles.navLink} onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

// --- NEW: Add prop validation for the new props ---
AdminSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};