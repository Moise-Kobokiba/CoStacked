// src/pages/AdminDashboardPage.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import { fetchDashboardStats } from '../features/dashboard/dashboardSlice';

// Import UI Components
import { AdminStatCard } from '../components/dashboard/AdminStatCard';
import { Users, Briefcase, DollarSign, AlertTriangle } from 'lucide-react';
import styles from './AdminDashboardPage.module.css';

const LoadingSpinner = () => <p>Loading dashboard statistics...</p>;
const ErrorDisplay = ({ error }) => <p className={styles.error}>Failed to load stats: {error}</p>;

export const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { setTitle } = usePageTitle();

  const { stats, status, error } = useSelector((state) => state.dashboard);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    setTitle('Dashboard Overview');
    if (isAuthenticated) {
      dispatch(fetchDashboardStats());
    }
  }, [isAuthenticated, dispatch, setTitle]);

  return (
    <div>
      {status === 'loading' ? (
        <LoadingSpinner />
      ) : status === 'failed' ? (
        <ErrorDisplay error={error} />
      ) : status === 'succeeded' ? (
        <>
          <div className={styles.grid}>
            <Link to="/transactions" className={styles.statLink}>
              <AdminStatCard 
                  title="Total Revenue" 
                  value={`R ${stats.revenue?.allTime || 0}`} // Change to 'allTime' 
                  change="+0%" 
                  Icon={DollarSign}
                  changeType="increase"
              />
            </Link>

            <Link to="/users" className={styles.statLink}>
              <AdminStatCard 
                  title="Total Users" 
                  value={stats.totalUsers ?? 0} 
                  change={`+${stats.newUsersLast7Days ?? 0} this week`} 
                  Icon={Users}
                  changeType="increase"
              />
            </Link>

            <Link to="/projects" className={styles.statLink}>
              <AdminStatCard 
                  title="Total Projects" 
                  value={stats.totalProjects ?? 0} 
                  change="+0 this week" // Placeholder
                  Icon={Briefcase}
                  changeType="increase"
              />
            </Link>
            
            <Link to="/reports" className={styles.statLink}>
              <AdminStatCard 
                  title="Open Reports"
                  // --- THIS IS THE FIX ---
                  // Use the live data from the stats object, with a fallback to 0
                  value={stats.openReportsCount ?? 0}
                  Icon={AlertTriangle}
                  changeType="decrease"
              />
            </Link>
          </div>
          
          <div className={styles.mainContent}>
            <h2>Recent Activity & Charts (Coming Soon)</h2>
            {/* Charts and activity feed components will go here */}
          </div>
        </>
      ) : null}
    </div>
  );
};