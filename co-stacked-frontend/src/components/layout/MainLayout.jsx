// src/components/layout/MainLayout.jsx

import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom'; // <-- 1. IMPORT Outlet
import { Header } from './Header';
import { Footer } from './Footer';
import ScrollToTop from '../../utils/ScrollToTop';
import styles from './MainLayout.module.css';

// --- 2. REMOVE the 'children' prop from the function signature ---
export const MainLayout = () => {
  return (
    <div className={styles.layoutWrapper}>
      <ScrollToTop />
      <Header />
      <main className={styles.mainContent}>
        {/* --- 3. REPLACE '{children}' with the <Outlet /> component --- */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// --- 4. REMOVE the PropType for 'children' ---
MainLayout.propTypes = {
  // children: PropTypes.node.isRequired, // This is no longer needed
};