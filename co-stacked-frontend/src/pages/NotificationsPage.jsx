// src/pages/NotificationsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchAllNotifications, 
  markNotificationsAsRead,
  clearAllNotifications
} from '../features/notifications/notificationsSlice';
import { fetchConnections, fetchPendingRequests } from '../features/connections/connectionsSlice';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';
import styles from './NotificationsPage.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'connections', label: 'Connections' },
  { id: 'projects', label: 'Projects' },
  { id: 'comments', label: 'Comments' },
  { id: 'account', label: 'Account' }
];

const TAB_TYPE_MAP = {
  connections: ['NEW_CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'],
  projects: ['NEW_INTEREST', 'INTEREST_APPROVED', 'INTEREST_REJECTED', 'BOOST_SUCCESS', 'NEW_PROJECT_POSTED'],
  comments: ['IDEA_COMMENT', 'NEW_REVIEW', 'NEW_MESSAGE'],
  account: ['SUBSCRIPTION_SUCCESS', 'PAYMENT_SUCCESS']
};

export const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { allItems: notifications, status } = useSelector(state => state.notifications);
  const [activeTab, setActiveTab] = useState('all');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    dispatch(fetchAllNotifications());
    dispatch(fetchConnections());
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    await dispatch(markNotificationsAsRead());
    // Refresh to reflect read status
    setTimeout(() => dispatch(fetchAllNotifications()), 500);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await dispatch(clearAllNotifications());
      // Refresh the list
      setTimeout(() => dispatch(fetchAllNotifications()), 500);
    } finally {
      setIsClearing(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    
    const allowedTypes = TAB_TYPE_MAP[activeTab] || [];
    return notifications.filter(notif => allowedTypes.includes(notif.type));
  }, [notifications, activeTab]);

  const getTabCount = (tabId) => {
    if (tabId === 'all') {
      return notifications.filter(n => !n.isRead).length;
    }
    const allowedTypes = TAB_TYPE_MAP[tabId] || [];
    return notifications.filter(n => !n.isRead && allowedTypes.includes(n.type)).length;
  };

  const totalUnreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Notifications</h1>
          <p>Manage your alerts and workspace activity.</p>
        </div>
        <div className={styles.headerActions}>
          {totalUnreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
              <Check size={18} />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className={`${styles.markAllBtn} ${styles.clearBtn}`} 
              onClick={handleClearAll}
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <Trash2 size={18} />
              )}
              Clear all
            </button>
          )}
        </div>
      </header>

      <div className={styles.tabsContainer}>
        {TABS.map(tab => {
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {count > 0 && (
                <span className={styles.tabCount}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.notificationsList}>
        {status === 'loading' && notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Loader2 size={36} className={styles.spinner} />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <NotificationCard key={notif._id} notification={notif} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>You have no notifications right now</h3>
            <p className={styles.emptySubtitle}>
              {activeTab !== 'all' 
                ? `No ${activeTab} notifications to show.` 
                : 'When you receive notifications, they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};