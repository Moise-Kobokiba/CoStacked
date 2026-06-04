// src/pages/DashboardPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../features/projects/projectsSlice';
import { fetchAllNotifications } from '../features/notifications/notificationsSlice';
import { fetchConnections, fetchPendingRequests, acceptConnectionRequest, removeOrCancelConnection } from '../features/connections/connectionsSlice';
import { Avatar } from '../components/shared/Avatar';
import {
  LayoutDashboard, Briefcase, UserPlus, MessageSquare, CheckSquare,
  Bell, Settings, Search, ChevronRight, Clock, TrendingUp,
  Check, X, ArrowRight, Star, Eye, FileText, Users, Loader2
} from 'lucide-react';
import styles from './DashboardPage.module.css';

// ---- Skeleton Loader ----
const SkeletonBlock = ({ height = '1rem', width = '100%', borderRadius = '0.5rem' }) => (
  <div className={styles.skeleton} style={{ height, width, borderRadius }} />
);

const MetricCard = ({ icon: Icon, label, value, trend, color = '#4f46e5', to, loading }) => {
  const content = (
    <div className={styles.metricCard}>
      <div className={styles.metricTop}>
        <div className={styles.metricIcon} style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`${styles.metricTrend} ${trend > 0 ? styles.trendUp : styles.trendDown}`}>
            <TrendingUp size={12} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <>
          <SkeletonBlock height="1.75rem" width="60%" />
          <SkeletonBlock height="0.875rem" width="80%" />
        </>
      ) : (
        <>
          <p className={styles.metricValue}>{value}</p>
          <p className={styles.metricLabel}>{label}</p>
        </>
      )}
    </div>
  );

  if (to) return <Link to={to} className={styles.metricLink}>{content}</Link>;
  return content;
};

// ---- Notification Snapshot Item ----
const NotificationSnapshot = ({ notification, onAccept, onDecline }) => {
  const [actionState, setActionState] = useState(null);

  const senderName = notification.sender?.name || 'Someone';
  const isConnection = notification.type === 'NEW_CONNECTION_REQUEST';

  const handleAccept = async (e) => {
    e.stopPropagation();
    setActionState('loading');
    try {
      await onAccept(notification.sender?._id);
      setActionState('accepted');
    } catch {
      setActionState(null);
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation();
    setActionState('loading');
    try {
      await onDecline(notification.sender?._id);
      setActionState('declined');
    } catch {
      setActionState(null);
    }
  };

  if (actionState === 'accepted' || actionState === 'declined') {
    return (
      <div className={`${styles.notificationItem} ${actionState === 'accepted' ? styles.acceptedSnap : styles.declinedSnap}`}>
        <Check size={16} />
        <span>{actionState === 'accepted' ? 'Connection Accepted!' : 'Request Declined'}</span>
      </div>
    );
  }

  return (
    <div className={styles.notificationItem}>
      <div className={styles.notifAvatar}>
        <Avatar
          src={notification.sender?.avatarUrl}
          fallback={senderName.charAt(0)}
          size="small"
        />
      </div>
      <div className={styles.notifContent}>
        <span className={styles.notifText}>
          <strong>{senderName}</strong> {isConnection ? 'sent a connection request' : notification.message || 'New activity'}
        </span>
        <span className={styles.notifTime}>
          {new Date(notification.createdAt).toLocaleDateString()}
        </span>
      </div>
      {isConnection && (
        <div className={styles.notifActions}>
          <button className={styles.acceptMiniBtn} onClick={handleAccept} disabled={actionState === 'loading'}>
            {actionState === 'loading' ? <Loader2 size={14} className={styles.spinIcon} /> : <Check size={14} />}
          </button>
          <button className={styles.declineMiniBtn} onClick={handleDecline} disabled={actionState === 'loading'}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ---- Main Dashboard Page ----
export const DashboardPage = () => {
  const dispatch = useDispatch();

  const { user: currentUser } = useSelector(state => state.auth);
  const { items: projects = [], status: projectStatus } = useSelector(state => state.projects || {});
  const { allItems: notifications } = useSelector(state => state.notifications);
  const { connections, pendingRequests, status: connStatus } = useSelector(state => state.connections);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all data on mount
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchAllNotifications());
    dispatch(fetchConnections());
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  // Derived metrics
  const activeProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects.filter(p => p.status === 'active' || p.status === 'in_progress').slice(0, 4);
  }, [projects]);

  const recentProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return [...projects].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 5);
  }, [projects]);

  const unreadNotifs = useMemo(() => notifications.filter(n => !n.isRead).slice(0, 4), [notifications]);
  const totalUnread = notifications.filter(n => !n.isRead).length;

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return recentProjects;
    const q = searchQuery.toLowerCase();
    return recentProjects.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [recentProjects, searchQuery]);

  const connectionRequests = useMemo(() => {
    if (!Array.isArray(pendingRequests)) return [];
    return pendingRequests.slice(0, 3);
  }, [pendingRequests]);

  // Handlers
  const handleAcceptConnection = async (requesterId) => {
    await dispatch(acceptConnectionRequest(requesterId));
    dispatch(fetchPendingRequests());
    dispatch(fetchAllNotifications());
  };

  const handleDeclineConnection = async (requesterId) => {
    await dispatch(removeOrCancelConnection(requesterId));
    dispatch(fetchPendingRequests());
    dispatch(fetchAllNotifications());
  };

  const isLoading = projectStatus === 'loading' || projectStatus === 'idle';

  // Get user's first name
  const firstName = currentUser?.name?.split(' ')[0] || 'User';
  const userRole = currentUser?.role || 'Developer';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ========== HERO WELCOME & METRICS ========== */}
        <section className={styles.heroSection}>
          <div className={styles.welcomeRow}>
            <div>
              <h1 className={styles.greeting}>Welcome back, {firstName} 👋</h1>
              <p className={styles.subtitle}>
                Here's what's happening with your {userRole.toLowerCase()} workspace today.
              </p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search projects, tasks, or activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <Link to="/notifications" className={styles.iconBtn}>
                <Bell size={20} />
                {totalUnread > 0 && <span className={styles.badge}>{totalUnread}</span>}
              </Link>
              <Link to="/settings" className={styles.iconBtn}>
                <Settings size={20} />
              </Link>
              <Link to="/profile" className={styles.avatarLink}>
                <Avatar
                  src={currentUser?.avatarUrl}
                  fallback={(currentUser?.name || '?').charAt(0)}
                  size="small"
                />
              </Link>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            <MetricCard
              icon={Briefcase}
              label="Active Projects"
              value={activeProjects.length}
              trend={8}
              color="#4f46e5"
              to="/my-projects"
              loading={isLoading}
            />
            <MetricCard
              icon={UserPlus}
              label="New Connection Requests"
              value={connectionRequests.length}
              trend={connectionRequests.length > 0 ? 12 : 0}
              color="#10b981"
              to="/my-network"
              loading={connStatus === 'loading'}
            />
            <MetricCard
              icon={MessageSquare}
              label="Unread Messages"
              value={totalUnread}
              color="#f59e0b"
              to="/messages"
              loading={false}
            />
            <MetricCard
              icon={CheckSquare}
              label="Validation Board Score"
              value="92%"
              trend={5}
              color="#8b5cf6"
              to="/validation-board"
              loading={isLoading}
            />
          </div>
        </section>

        {/* ========== MAIN CONTENT GRID ========== */}
        <div className={styles.mainGrid}>
          {/* Left/Center Column */}
          <div className={styles.primaryColumn}>
            {/* Active Projects */}
            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Briefcase size={18} />
                  Active Projects
                </h2>
                <Link to="/my-projects" className={styles.seeAllLink}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.projectList}>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.projectCardSkeleton}>
                      <SkeletonBlock height="1rem" width="60%" />
                      <SkeletonBlock height="0.75rem" width="90%" />
                      <SkeletonBlock height="0.5rem" width="40%" />
                    </div>
                  ))
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map(project => (
                    <Link
                      key={project._id || project.title}
                      to={`/projects/${project._id}`}
                      className={styles.projectCard}
                    >
                      <div className={styles.projectCardTop}>
                        <h3 className={styles.projectCardTitle}>{project.title || 'Untitled Project'}</h3>
                        <span className={`${styles.projectStatus} ${project.status === 'active' ? styles.statusActive : styles.statusDraft}`}>
                          {project.stage || project.status || 'Active'}
                        </span>
                      </div>
                      <p className={styles.projectCardDesc}>
                        {project.description?.slice(0, 120) || 'No description available.'}{project.description?.length > 120 ? '...' : ''}
                      </p>
                      <div className={styles.projectCardMeta}>
                        <span className={styles.metaItem}>
                          <Users size={12} />
                          {project.skillsNeeded?.length || 0} roles needed
                        </span>
                        <span className={styles.metaItem}>
                          <Clock size={12} />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyBlock}>
                    <FileText size={32} className={styles.emptyIcon} />
                    <p>{searchQuery ? 'No projects match your search.' : 'No active projects yet.'}</p>
                    {!searchQuery && (
                      <Link to="/post-project" className={styles.emptyAction}>Post a Project</Link>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Validation Board */}
            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Star size={18} />
                  Recent Validation Board Submissions
                </h2>
                <Link to="/validation-board" className={styles.seeAllLink}>
                  View Board <ArrowRight size={14} />
                </Link>
              </div>
              <div className={styles.validationPreview}>
                <div className={styles.validationCard}>
                  <div className={styles.validationScore}>
                    <svg viewBox="0 0 36 36" className={styles.gaugeSvg}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="var(--border)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                        fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray="85, 100" strokeLinecap="round" />
                    </svg>
                    <span className={styles.gaugeValue}>85%</span>
                  </div>
                  <div className={styles.validationInfo}>
                    <h4>AI-Powered Marketplace</h4>
                    <p>8 upvotes · 3 expert validations</p>
                    <Link to="/validation-board" className={styles.validationLink}>View Details →</Link>
                  </div>
                </div>
                <div className={styles.validationList}>
                  {['Design System v2', 'Smart Contract Audit Tool', 'API Gateway'].map((name, i) => (
                    <div key={i} className={styles.validationItem}>
                      <span className={styles.validationName}>{name}</span>
                      <div className={styles.miniGauge}>
                        <div className={styles.miniGaugeFill} style={{ width: `${75 - i * 10}%` }} />
                      </div>
                      <span className={styles.miniScore}>{75 - i * 10}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar Column */}
          <aside className={styles.sidebarColumn}>
            {/* Live Notification Snapshot */}
            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Bell size={16} />
                  Recent Activity
                </h2>
                <Link to="/notifications" className={styles.seeAllLink}>
                  See All
                </Link>
              </div>

              <div className={styles.notifSnapList}>
                {unreadNotifs.length > 0 ? (
                  unreadNotifs.map(notif => (
                    <NotificationSnapshot
                      key={notif._id}
                      notification={notif}
                      onAccept={handleAcceptConnection}
                      onDecline={handleDeclineConnection}
                    />
                  ))
                ) : (
                  <div className={styles.emptyBlock}>
                    <Bell size={24} className={styles.emptyIcon} />
                    <p>No new notifications</p>
                  </div>
                )}
              </div>

              {/* Quick connection requests */}
              {connectionRequests.length > 0 && (
                <div className={styles.connRequestsSection}>
                  <h4 className={styles.subSectionTitle}>
                    <UserPlus size={14} />
                    Connection Requests ({connectionRequests.length})
                  </h4>
                  {connectionRequests.map(req => (
                    <div key={req._id} className={styles.connRequestCard}>
                      <Avatar
                        src={req.requester?.avatarUrl}
                        fallback={(req.requester?.name || '?').charAt(0)}
                        size="small"
                      />
                      <div className={styles.connReqInfo}>
                        <span className={styles.connReqName}>{req.requester?.name || 'Unknown'}</span>
                        <span className={styles.connReqRole}>{req.requester?.headline || 'Professional'}</span>
                      </div>
                      <div className={styles.connReqActions}>
                        <button
                          className={styles.acceptMiniBtn}
                          onClick={() => handleAcceptConnection(req.requester?._id)}
                          title="Accept"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className={styles.declineMiniBtn}
                          onClick={() => handleDeclineConnection(req.requester?._id)}
                          title="Decline"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Workspace Interactions */}
            <section className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Clock size={16} />
                  Recent Interactions
                </h2>
              </div>
              <div className={styles.timelineList}>
                {[
                  { actor: 'Sarah Chen', action: 'updated the design specs in', target: 'AI Marketplace', time: '2 hours ago' },
                  { actor: 'Marcus Williams', action: 'commented on', target: 'API Gateway', time: '5 hours ago' },
                  { actor: 'Alex Johnson', action: 'joined the project', target: 'Smart Contract Audit', time: '1 day ago' },
                ].map((item, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <p>
                        <strong>{item.actor}</strong> {item.action}{' '}
                        <span className={styles.timelineTarget}>{item.target}</span>
                      </p>
                      <span className={styles.timelineTime}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.quickLinksGrid}>
                <Link to="/post-project" className={styles.quickLink}>
                  <Briefcase size={16} />
                  Post a Project
                </Link>
                <Link to="/messages" className={styles.quickLink}>
                  <MessageSquare size={16} />
                  Open Messages
                </Link>
                <Link to="/validation-board/create" className={styles.quickLink}>
                  <Star size={16} />
                  Submit an Idea
                </Link>
                <Link to="/users" className={styles.quickLink}>
                  <Users size={16} />
                  Browse Network
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};