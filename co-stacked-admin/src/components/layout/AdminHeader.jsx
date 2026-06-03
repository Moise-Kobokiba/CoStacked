// src/components/layout/AdminHeader.jsx

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePageTitle } from '../../context/PageTitleContext';
import { AdminNotificationDropdown } from '../notifications/AdminNotificationDropdown';
import { fetchAdminNotifications, markAdminNotificationsAsRead } from '../../features/notifications/adminNotificationsSlice';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Badge } from '../ui/Badge';
import styles from './AdminHeader.module.css';
// --- NEW: Import Menu icon for the sidebar toggle ---
import { Bell, ChevronDown, Menu } from 'lucide-react';
import PropTypes from 'prop-types';

// --- NEW: Accept 'onToggleSidebar' function as a prop ---
export const AdminHeader = ({ onToggleSidebar }) => {
  const { title } = usePageTitle();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { items: notifications } = useSelector(state => state.adminNotifications);

  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useClickOutside(notifRef, () => {
    if (isNotifOpen) {
      setNotifOpen(false);
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAdminNotifications());
    }
  }, [isAuthenticated, dispatch]);

  const handleMarkAsRead = () => {
    if (notifications.length > 0) {
      dispatch(markAdminNotificationsAsRead());
    }
    setNotifOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftContent}>
        {/* --- NEW: Sidebar Toggle Button (visible on mobile) --- */}
        <button onClick={onToggleSidebar} className={styles.sidebarToggleButton} aria-label="Toggle sidebar">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title || 'Dashboard'}</h1>
      </div>

      <div className={styles.userMenu}>
        <div ref={notifRef} className={styles.notificationWrapper}>
          <button className={styles.notificationButton} onClick={() => setNotifOpen(prev => !prev)}>
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className={styles.notificationCount}>{notifications.length}</span>
            )}
          </button>
          {isNotifOpen && (
            <AdminNotificationDropdown 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <span>{(user?.name || '?').charAt(0)}</span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <div className={styles.userRole}>
              <span>Administrator</span>
              <Badge text="Verified" variant="verified" iconOnly />
            </div>
          </div>
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>
      </div>
    </header>
  );
};

// --- NEW: Add prop validation ---
AdminHeader.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
};