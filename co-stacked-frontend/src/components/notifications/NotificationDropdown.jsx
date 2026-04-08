import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationDropdown.module.css';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const NotificationDropdown = ({ notifications, onClose, onMarkAsRead }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.dropdown}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.header}>
          <h3>Notifications</h3>
          {notifications.length > 0 && (
            <button onClick={onMarkAsRead} className={styles.markReadButton}>
              Mark all as read
            </button>
          )}
        </div>
        <div className={styles.list}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <NotificationItem key={notif._id} notification={notif} onClose={onClose} />
            ))
          ) : (
            <p className={styles.emptyMessage}>You have no unread notifications.</p>
          )}
        </div>
        <div className={styles.footer}>
          <Link to="/notifications" className={styles.viewAllBtn} onClick={onClose}>
            View all notifications
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

NotificationDropdown.propTypes = {
  notifications: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
};

// CRITICAL FIX: This component is lazy-loaded, so it MUST be a default export.
export default NotificationDropdown;