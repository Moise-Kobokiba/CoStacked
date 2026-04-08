// src/pages/NotificationsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchAllNotifications, 
  markNotificationsAsRead 
} from '../features/notifications/notificationsSlice';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { Bell, Check, ChevronDown } from 'lucide-react';
import styles from './NotificationsPage.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'connections', label: 'Connections' },
  { id: 'projects', label: 'Projects' },
  { id: 'comments', label: 'Comments' },
  { id: 'account', label: 'Account' }
];

export const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { allItems: notifications, status } = useSelector(state => state.notifications);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchAllNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markNotificationsAsRead());
    // Refresh history to reflect read status
    setTimeout(() => dispatch(fetchAllNotifications()), 500);
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    
    return notifications.filter(notif => {
      switch (activeTab) {
        case 'connections':
          return ['NEW_CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'].includes(notif.type);
        case 'projects':
          return ['NEW_INTEREST', 'INTEREST_APPROVED', 'INTEREST_REJECTED', 'BOOST_SUCCESS'].includes(notif.type);
        case 'comments':
          return ['IDEA_COMMENT', 'NEW_REVIEW'].includes(notif.type);
        case 'account':
          return ['SUBSCRIPTION_SUCCESS'].includes(notif.type);
        default:
          return true;
      }
    });
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Notifications</h1>
          <p>Manage your alerts and workspace activity.</p>
        </div>
        <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
          <Check size={18} />
          Mark all as read
        </button>
      </header>

      <div className={styles.tabsContainer}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'all' && unreadCount > 0 && (
              <span className={styles.tabCount}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.notificationsList}>
        {status === 'loading' && notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <NotificationCard key={notif._id} notification={notif} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p>No {activeTab !== 'all' ? activeTab : ''} notifications to show.</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className={styles.footerActions}>
          <button className={styles.seeOlderBtn}>
            See older notifications
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
