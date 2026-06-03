// src/components/shared/DropdownMenu.jsx

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, User, Settings, LogOut, MessageSquare, LifeBuoy, Users, Bookmark } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import styles from './DropdownMenu.module.css';
import PropTypes from 'prop-types';

const menuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -5, transition: { duration: 0.1 } },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } }
};

const DropdownMenu = ({ onLogout }) => {
  return (
    <motion.div
      className={styles.dropdown}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* --- Main Navigation Group --- */}
      <div className={styles.menuGroup}>
        <Link to="/dashboard" className={styles.menuItem}>
          <LayoutDashboard className={styles.icon} />
          <span>Dashboard</span>
        </Link>
        <Link to="/profile" className={styles.menuItem}>
          <User className={styles.icon} />
          <span>Profile</span>
        </Link>
        {/* --- ADDED "My Network" LINK --- */}
        <Link to="/my-network" className={styles.menuItem}>
          <Users className={styles.icon} />
          <span>My Network</span>
        </Link>
        <Link to="/messages" className={styles.menuItem}>
          <MessageSquare className={styles.icon} />
          <span>Messages</span>
        </Link>
        <Link to="/saved-items" className={styles.menuItem}>
          <Bookmark className={styles.icon} />
          <span>Saved Items</span>
        </Link>
      </div>

      <div className={styles.separator} />

      {/* --- Settings and Support Group --- */}
      <div className={styles.menuGroup}>
        <Link to="/settings" className={styles.menuItem}>
          <Settings className={styles.icon} />
          <span>Settings</span>
        </Link>
        <Link to="/support" className={styles.menuItem}>
          <LifeBuoy className={styles.icon} />
          <span>Support</span>
        </Link>
      </div>
      
      <div className={styles.separator} />

      {/* --- Theme Toggle Group --- */}
      <div className={styles.menuGroup}>
        <ThemeToggle />
      </div>

      <div className={styles.separator} />

      {/* --- Logout Group --- */}
      <div className={styles.menuGroup}>
        <button onClick={onLogout} className={styles.menuItem}>
          <LogOut className={styles.icon} />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

DropdownMenu.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default DropdownMenu;