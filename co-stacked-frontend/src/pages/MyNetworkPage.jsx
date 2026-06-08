// src/pages/MyNetworkPage.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchConnections } from '../features/connections/connectionsSlice';
import { useQuery } from '@tanstack/react-query';
import { getCommunityStats } from '../api/statsApi';
import { UserCard } from '../components/shared/UserCard';
import { Loader2, Users, Activity, MessageSquare, FileText, Lightbulb, ArrowRight } from 'lucide-react';
import styles from './MyNetworkPage.module.css';

const LoadingSpinner = () => (
  <div className={styles.loadingState}>
    <Loader2 size={36} className="animate-spin" />
    <p>Loading your network...</p>
  </div>
);

const EmptyState = () => (
  <div className={styles.emptyState}>
    <Users size={48} className={styles.emptyIcon} />
    <h3 className={styles.emptyTitle}>Your network is empty</h3>
    <p className={styles.emptySubtitle}>Connect with other founders, developers, and creators to grow your network.</p>
    <Link to="/users" className={styles.browseBtn}>Browse Users</Link>
  </div>
);

export const MyNetworkPage = () => {
  const dispatch = useDispatch();
  const { connections, status, error } = useSelector(state => state.connections || {});
  const [activeTab, setActiveTab] = useState('connections');

  useEffect(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  // Fetch activity (stats) to show recent platform activity
  const { data: stats } = useQuery({
    queryKey: ['communityStats'],
    queryFn: () => getCommunityStats(),
  });

  const activityItems = [
    { icon: Lightbulb, label: 'New Validation Submissions', count: stats?.totalIdeas || 0, link: '/validation-board' },
    { icon: FileText, label: 'New Projects', count: stats?.totalProjects || 0, link: '/projects' },
    { icon: MessageSquare, label: 'New Posts', count: stats?.totalPosts || 0, link: '/stack-suite' },
  ];

  let content;

  if (status === 'loading' || status === 'idle') {
    content = <LoadingSpinner />;
  } else if (status === 'failed') {
    content = <div className={styles.error}>Error: {error}</div>;
  } else if (status === 'succeeded') {
    const connectedUsers = connections.filter((user) => user.status === 'accepted' || user.status === 'connected');
    const pendingRequests = connections.filter((user) => user.status === 'pending');

    content = (
      <>
        {/* Tabs */}
        <div className={styles.tabsRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'connections' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections ({connectedUsers.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Recent Activity
          </button>
        </div>

        {activeTab === 'connections' ? (
          connectedUsers.length > 0 ? (
            <div className={styles.grid}>
              {connectedUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className={styles.activitySection}>
            <h3 className={styles.sectionTitle}>
              <Activity size={18} />
              Network Activity
            </h3>
            <div className={styles.activityList}>
              {activityItems.map((item, idx) => (
                <Link to={item.link} key={idx} className={styles.activityCard}>
                  <div className={styles.activityIcon}>
                    <item.icon size={20} />
                  </div>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityLabel}>{item.label}</span>
                    <span className={styles.activityCount}>{item.count} total</span>
                  </div>
                  <ArrowRight size={16} className={styles.activityArrow} />
                </Link>
              ))}
            </div>

            {/* Show connected users recent activity */}
            {connectedUsers.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 className={styles.sectionSubtitle}>Your Connections</h4>
                <div className={styles.connectedList}>
                  {connectedUsers.slice(0, 6).map((user) => (
                    <Link to={`/users/${user._id}`} key={user._id} className={styles.connectedItem}>
                      <div className={styles.miniAvatar}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" />
                        ) : (
                          (user.name || '?').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className={styles.connectedName}>{user.name || 'Unknown'}</span>
                        <span className={styles.connectedRole}>{user.headline || 'Platform User'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Network</h1>
        {status === 'succeeded' && (
          <p className={styles.subtitle}>
            You have {connections.filter((u) => u.status === 'accepted' || u.status === 'connected').length} connections.
          </p>
        )}
      </header>

      <main>{content}</main>
    </div>
  );
};