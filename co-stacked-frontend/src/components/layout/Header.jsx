// src/components/layout/Header.jsx

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence } from 'framer-motion';

// Import Hooks, Actions, and Logos
import { useTheme } from '../../context/ThemeContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { logout } from '../../features/auth/authSlice';
import { fetchNotifications, markNotificationsAsRead } from '../../features/notifications/notificationsSlice';
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';

// Import the Sub-Components
import { HeaderLogo } from './header/HeaderLogo';
import { DesktopNav } from './header/DesktopNav';
import { UserActions } from './header/UserActions';
import { MobileMenu } from './header/MobileMenu';
// --- THIS IS THE FIX ---
// The path should be './Header.module.css' to look in the current directory.
import styles from './Header.module.css';

// Dynamically import dropdowns
const NotificationDropdown = lazy(() => import('../notifications/NotificationDropdown'));
const DropdownMenu = lazy(() => import('../shared/DropdownMenu'));

export const Header = () => {
  // ... (The rest of your component logic is correct)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: notifications } = useSelector(state => state.notifications);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Header: User authenticated, fetching notifications...');
      console.log('Header: Current user:', user);
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch, user]);
  useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false); setNotifOpen(false); }, [location.pathname]);
  useEffect(() => { document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto'; return () => { document.body.style.overflow = 'auto'; }; }, [isMobileMenuOpen]);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };
  const handleCloseNotifications = () => setNotifOpen(false);
  const handleMarkAsRead = () => {
    console.log('Marking notifications as read, current count:', notifications.length);
    if (notifications.length > 0) dispatch(markNotificationsAsRead());
    setNotifOpen(false);
  };
  const navigationLinks = [
    { label: 'Discover', path: '/projects' },
    { label: 'Validation Board', path: '/validation-board' },
    { label: 'Find Talent', path: '/users' },
    ...(isAuthenticated ? [{ label: 'Messages', path: '/messages' }] : [])
  ];

  const logoSrc = theme === 'light' ? logoLight : logoDark;

  return (
    <>
      <header className={styles.header}>
        <HeaderLogo logoSrc={logoSrc} />
        <DesktopNav links={navigationLinks} />
        <UserActions
          isAuthenticated={isAuthenticated}
          user={user}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          setNotifOpen={setNotifOpen}
          isDropdownOpen={isDropdownOpen}
          setDropdownOpen={setDropdownOpen}
          notifRef={notifRef}
          dropdownRef={dropdownRef}
          handleLogout={handleLogout}
          handleMarkAsRead={handleMarkAsRead}
          handleCloseNotifications={handleCloseNotifications}
          setMobileMenuOpen={setMobileMenuOpen}
          isMobileMenuOpen={isMobileMenuOpen}
        />
      </header >

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            onClose={() => setMobileMenuOpen(false)}
            links={navigationLinks}
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </>
  );
};