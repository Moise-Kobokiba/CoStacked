// src/pages/NotificationsPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchAllNotifications, 
  markNotificationsAsRead,
  clearAllNotifications,
  deleteOneNotification
} from '../features/notifications/notificationsSlice';
import { fetchConnections, fetchPendingRequests, acceptConnectionRequest, removeOrCancelConnection } from '../features/connections/connectionsSlice';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { Bell, Check, Trash2, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './NotificationsPage.module.css';

const PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchAllNotifications());
    dispatch(fetchConnections());
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    await dispatch(markNotificationsAsRead());
    setTimeout(() => dispatch(fetchAllNotifications()), 500);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await dispatch(clearAllNotifications());
      setTimeout(() => dispatch(fetchAllNotifications()), 500);
      setSelectedIds([]);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      // Delete selected notifications individually via API
      for (const id of selectedIds) {
        try {
          await dispatch(deleteOneNotification(id));
        } catch (e) {
          console.error('Failed to delete notification:', id);
        }
      }
      setSelectedIds([]);
      setTimeout(() => dispatch(fetchAllNotifications()), 500);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectNotification = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]
    );
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    const allowedTypes = TAB_TYPE_MAP[activeTab] || [];
    return notifications.filter(notif => allowedTypes.includes(notif.type));
  }, [notifications, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotifications = filteredNotifications.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  const getTabCount = (tabId) => {
    if (tabId === 'all') {
      return notifications.filter(n => !n.isRead).length;
    }
    const allowedTypes = TAB_TYPE_MAP[tabId] || [];
    return notifications.filter(n => !n.isRead && allowedTypes.includes(n.type)).length;
  };

  const totalUnreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
          {selectedIds.length > 0 && (
            <button 
              className={`${styles.markAllBtn} ${styles.deleteBtn}`} 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <Trash2 size={18} />
              )}
              Delete ({selectedIds.length})
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

      {/* Selection bar */}
      {selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedIds.length} selected</span>
          <button onClick={() => setSelectedIds([])} className={styles.deselectBtn}>
            <X size={16} />
            Deselect all
          </button>
        </div>
      )}

      <div className={styles.notificationsList}>
        {status === 'loading' && notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Loader2 size={36} className={styles.spinner} />
            <p>Loading notifications...</p>
          </div>
        ) : paginatedNotifications.length > 0 ? (
          <>
            {paginatedNotifications.map(notif => (
              <div key={notif._id} className={styles.notificationRow}>
                <input
                  type="checkbox"
                  className={styles.selectCheckbox}
                  checked={selectedIds.includes(notif._id)}
                  onChange={() => toggleSelectNotification(notif._id)}
                />
                <NotificationCard key={notif._id} notification={notif} />
              </div>
            ))}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageInfo}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No notifications right now</h3>
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