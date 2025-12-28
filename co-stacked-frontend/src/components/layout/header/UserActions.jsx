// src/components/layout/header/UserActions.jsx

import { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../../shared/Button';
import { User, Bell, Menu, X, CheckCircle } from 'lucide-react'; // 1. Import the X icon and CheckCircle
import styles from '../Header.module.css';
import { VerificationBadge } from '../../shared/VerificationBadge'; // Import Badge
import PropTypes from 'prop-types';

const NotificationDropdown = lazy(() => import('../../notifications/NotificationDropdown'));
const DropdownMenu = lazy(() => import('../../shared/DropdownMenu'));

export const UserActions = ({
  isAuthenticated, user, notifications, isNotifOpen, setNotifOpen,
  isDropdownOpen, setDropdownOpen, notifRef, dropdownRef,
  handleLogout, handleMarkAsRead, handleCloseNotifications,
  setMobileMenuOpen, isMobileMenuOpen // <-- 2. Accept the mobile menu's current state
}) => (
  <div className={styles.userActions}>
    {isAuthenticated && user?.role === 'founder' && (
      <div className={styles.postProjectButton}>
        <Button variant="primary" to="/post-project">Post Project</Button>
      </div>
    )}
    
    {isAuthenticated ? (
      <>
        <div ref={notifRef} className={styles.notificationWrapper}>
          <button className={styles.notificationButton} onClick={() => setNotifOpen(prev => !prev)} aria-label="Toggle notifications">
            <Bell size={24} />
            {notifications.length > 0 && <span className={styles.notificationCount}>{notifications.length}</span>}
          </button>
          <AnimatePresence>
            {isNotifOpen && (
              <Suspense fallback={<div className={styles.dropdownLoading}>Loading...</div>}>
                <NotificationDropdown 
                  notifications={notifications} 
                  onMarkAsRead={handleMarkAsRead}
                  onClose={handleCloseNotifications}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </div>
        
        <div ref={dropdownRef}>
          <button className={styles.profileLink} onClick={() => setDropdownOpen(prev => !prev)} aria-label="Toggle user menu">
            <span className={styles.userName}>
              {user?.name}
              {user?.isVerified && <VerificationBadge size={14} />}
            </span>
            <User size={24} />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <Suspense fallback={<div className={styles.dropdownLoading}>Loading...</div>}>
                <DropdownMenu 
                  onLogout={handleLogout}
                  userHeader={
                    <div className={styles.userMenuHeader}>
                      <span className={styles.userName}>
                        {user?.name}
                        {user?.isVerified && <VerificationBadge size={14} />}
                      </span>
                      <span className={styles.userEmail}>{user?.email}</span>
                      {user?.isVerified && (
                        <span className={styles.verifiedTag}>
                          <CheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                  }
                />
              </Suspense>
            )}
          </AnimatePresence>
        </div>
      </>
    ) : (
      <div className={styles.authButtons}>
        <Button variant="secondary" to="/login">Login</Button>
        <Button variant="primary" to="/signup">Sign Up</Button>
      </div>
    )}

    {/* --- 3. THIS IS THE FIX --- */}
    <button 
      className={styles.hamburgerButton} 
      onClick={() => setMobileMenuOpen(prev => !prev)} // Change to a toggle function
      aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
    >
      {/* Conditionally render the correct icon based on the menu's state */}
      {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
    </button>
  </div>
);

// --- 4. UPDATE PropTypes ---
UserActions.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  user: PropTypes.object,
  notifications: PropTypes.array.isRequired,
  isNotifOpen: PropTypes.bool.isRequired,
  setNotifOpen: PropTypes.func.isRequired,
  isDropdownOpen: PropTypes.bool.isRequired,
  setDropdownOpen: PropTypes.func.isRequired,
  notifRef: PropTypes.object.isRequired,
  dropdownRef: PropTypes.object.isRequired,
  handleLogout: PropTypes.func.isRequired,
  handleMarkAsRead: PropTypes.func.isRequired,
  handleCloseNotifications: PropTypes.func.isRequired,
  setMobileMenuOpen: PropTypes.func.isRequired,
  isMobileMenuOpen: PropTypes.bool.isRequired, // Add the new prop
};