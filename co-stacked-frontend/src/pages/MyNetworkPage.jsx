// src/pages/MyNetworkPage.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchConnections } from '../features/connections/connectionsSlice';
import { useQuery } from '@tanstack/react-query';
import { getCommunityStats } from '../api/statsApi';
import { UserCard } from '../components/shared/UserCard';
import {
  Loader2, Users, Activity, MessageSquare, FileText, Lightbulb, ArrowRight,
  UserPlus, Search, Filter, TrendingUp, Briefcase, MapPin, Star, ChevronDown, X
} from 'lucide-react';
import styles from './MyNetworkPage.module.css';

const LoadingSpinner = () => (
  <div className={styles.loadingState}>
    <Loader2 size={36} className={styles.spinner} />
    <p>Loading your network...</p>
  </div>
);

const EmptyState = ({ tab }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIconWrap}>
      <Users size={32} />
    </div>
    <h3 className={styles.emptyTitle}>
      {tab === 'connections' ? 'No connections yet' : 'Nothing here yet'}
    </h3>
    <p className={styles.emptySubtitle}>
      {tab === 'connections'
        ? 'Connect with founders, developers, and creators to grow your network.'
        : 'Check back later for new suggestions.'}
    </p>
    <Link to="/users" className={styles.browseBtn}>Browse Users</Link>
  </div>
);

// ── Discover Filter Badges ──
const FILTER_OPTIONS = [
  { key: 'industry', label: 'Industry', icon: Briefcase, options: ['SaaS', 'AI/ML', 'FinTech', 'HealthTech', 'E-Commerce', 'EdTech', 'GreenTech', 'Web3'] },
  { key: 'role', label: 'Role', icon: Users, options: ['Founder', 'Developer', 'Designer', 'Marketer', 'Product Manager', 'Mentor'] },
  { key: 'location', label: 'Location', icon: MapPin, options: ['Remote', 'Cape Town', 'Johannesburg', 'San Francisco', 'New York', 'London'] },
  { key: 'stage', label: 'Stage', icon: TrendingUp, options: ['Idea', 'MVP', 'Growth', 'Funded', 'Profitable'] },
  { key: 'availability', label: 'Availability', icon: Star, options: ['Full-time', 'Part-time', 'Weekends', 'Flexible'] },
];

export const MyNetworkPage = () => {
  const dispatch = useDispatch();
  const { connections, status, error } = useSelector(state => state.connections || {});
  const [activeTab, setActiveTab] = useState('connections');
  const [filterOpen, setFilterOpen] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  const { data: stats } = useQuery({
    queryKey: ['communityStats'],
    queryFn: () => getCommunityStats(),
  });

  const connectedUsers = useMemo(() =>
    (connections || []).filter(u => u.status === 'accepted' || u.status === 'connected'),
    [connections]
  );

  const pendingRequests = useMemo(() =>
    (connections || []).filter(u => u.status === 'pending'),
    [connections]
  );

  // ── Role breakdown stats ──
  const statsBreakdown = useMemo(() => {
    const founders = connectedUsers.filter(u => u.role?.toLowerCase().includes('founder') || u.role?.toLowerCase().includes('ceo')).length;
    const developers = connectedUsers.filter(u => u.role?.toLowerCase().includes('developer') || u.role?.toLowerCase().includes('engineer') || u.role?.toLowerCase().includes('dev')).length;
    const designers = connectedUsers.filter(u => u.role?.toLowerCase().includes('design')).length;
    const creators = connectedUsers.filter(u => !founders && !developers && !designers).length;
    return { founders, developers, designers, creators };
  }, [connectedUsers]);

  // ── Filter toggle ──
  const toggleFilter = (key, value) => {
    setActiveFilters(prev => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: next.length ? next : undefined };
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(activeFilters).some(k => activeFilters[k]?.length) || searchQuery;

  // ── Filter connected users ──
  const filteredUsers = useMemo(() => {
    let filtered = [...connectedUsers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.headline || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q)
      );
    }

    Object.entries(activeFilters).forEach(([key, values]) => {
      if (!values?.length) return;
      filtered = filtered.filter(user => {
        if (key === 'role') return values.some(v => (user.role || '').toLowerCase().includes(v.toLowerCase()));
        if (key === 'location') return values.some(v => (user.location || '').toLowerCase().includes(v.toLowerCase()));
        if (key === 'availability') return values.some(v => (user.availability || '').toLowerCase().includes(v.toLowerCase()));
        return true;
      });
    });

    return filtered;
  }, [connectedUsers, searchQuery, activeFilters]);

  // ── Tabs ──
  const tabs = [
    { id: 'connections', label: 'Connections', count: connectedUsers.length },
    { id: 'suggestions', label: 'Suggestions', count: 0 },
    { id: 'invitations', label: 'Invitations', count: pendingRequests.length },
    { id: 'following', label: 'Following', count: 0 },
  ];

  const handleTabChange = (tabId) => {
    if (tabId === 'invitations') {
      setActiveTab('connections');
      // If they click invitations, show pending at top
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Hero Header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>My Network</h1>
            <p className={styles.subtitle}>
              Manage your professional connections and foster high-velocity partnerships.
            </p>
          </div>
          {status === 'succeeded' && (
            <div className={styles.statsHero}>
              <div className={styles.statsHeroIcon}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className={styles.statsHeroValue}>{connectedUsers.length}</span>
                <span className={styles.statsHeroLabel}>ACTIVE CONNECTIONS</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* ── Quick Stats ── */}
        {status === 'succeeded' && connectedUsers.length > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{connectedUsers.length}</span>
              <span className={styles.statLabel}>Connections</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{statsBreakdown.founders}</span>
              <span className={styles.statLabel}>Founders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{statsBreakdown.developers}</span>
              <span className={styles.statLabel}>Developers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{statsBreakdown.designers + statsBreakdown.creators}</span>
              <span className={styles.statLabel}>Creators</span>
            </div>
          </div>
        )}

        {/* ── Pending Invitations Section ── */}
        {status === 'succeeded' && pendingRequests.length > 0 && (
          <section className={styles.pendingSection}>
            <div className={styles.pendingHeader}>
              <h2 className={styles.sectionTitle}>
                Pending Invitations
                <span className={styles.badge}>{pendingRequests.length}</span>
              </h2>
              <Link to="/requests" className={styles.viewAllLink}>View All</Link>
            </div>
            <div className={styles.pendingGrid}>
              {pendingRequests.slice(0, 3).map((user) => (
                <PendingCard key={user._id} user={user} />
              ))}
            </div>
          </section>
        )}

        {/* ── Main Tabs ── */}
        <div className={styles.tabsRow}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id || (tab.id === 'invitations' && activeTab === 'connections') ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        {activeTab === 'connections' && (
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search connections"
              />
              {searchQuery && (
                <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterGroup}>
              {FILTER_OPTIONS.map(f => (
                <div key={f.key} className={styles.filterWrap}>
                  <button
                    className={`${styles.filterBtn} ${(activeFilters[f.key] || []).length ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterOpen(filterOpen === f.key ? null : f.key)}
                  >
                    <f.icon size={14} />
                    <span>{f.label}</span>
                    {(activeFilters[f.key] || []).length > 0 && (
                      <span className={styles.filterCount}>{(activeFilters[f.key] || []).length}</span>
                    )}
                    <ChevronDown size={14} />
                  </button>
                  {filterOpen === f.key && (
                    <div className={styles.filterDropdown}>
                      {f.options.map(opt => (
                        <button
                          key={opt}
                          className={`${styles.filterOption} ${(activeFilters[f.key] || []).includes(opt) ? styles.filterOptionActive : ''}`}
                          onClick={() => toggleFilter(f.key, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasActiveFilters && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {status === 'loading' || status === 'idle' ? (
          <LoadingSpinner />
        ) : status === 'failed' ? (
          <div className={styles.errorState}>Error: {error}</div>
        ) : activeTab === 'connections' || activeTab === 'invitations' ? (
          filteredUsers.length > 0 ? (
            <div className={styles.grid}>
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} variant="network" />
              ))}
            </div>
          ) : (
            <EmptyState tab="connections" />
          )
        ) : activeTab === 'suggestions' ? (
          <EmptyState tab="suggestions" />
        ) : (
          <EmptyState tab="following" />
        )}
      </main>
    </div>
  );
};

// ── Pending Card ──
function PendingCard({ user }) {
  return (
    <div className={styles.pendingCard}>
      <div className={styles.pendingCardTop}>
        <div className={styles.pendingAvatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} />
          ) : (
            <span>{(user.name || '?').slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.pendingInfo}>
          <h3 className={styles.pendingName}>{user.name || 'Unknown User'}</h3>
          <p className={styles.pendingRole}>{user.role || 'Founder'}</p>
        </div>
      </div>
      <p className={styles.pendingMessage}>
        Wants to connect with you. Check out their profile first.
      </p>
      <div className={styles.pendingActions}>
        <Link to={`/users/${user._id}`} className={styles.viewProfileBtn}>View Profile</Link>
        <button className={styles.acceptBtn}>Accept</button>
        <button className={styles.ignoreBtn}>Ignore</button>
      </div>
    </div>
  );
};
