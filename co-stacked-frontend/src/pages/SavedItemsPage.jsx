import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Bookmark, Share2, MessageSquare, Loader2, Trash2, ExternalLink, Search, X, Filter } from 'lucide-react';
import { getSavedItems, unsaveItem } from '../api/savedItemsApi';
import styles from './SavedItemsPage.module.css';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'project', label: 'Projects' },
  { id: 'idea', label: 'Validation Ideas' },
  { id: 'stackpost', label: 'StackSuite Posts' },
  { id: 'showcase', label: 'Showcases' },
  { id: 'collab', label: 'Collaborations' },
  { id: 'talent', label: 'Talent Profiles' },
  { id: 'article', label: 'Info Hub' },
];

const getDeepLink = (item) => {
  switch (item.itemType) {
    case 'project': return `/projects/${item.itemId}`;
    case 'talent': return `/users/${item.itemId}`;
    case 'idea': return `/validation-board/${item.itemId}`;
    case 'stackpost': return `/stack-suite`;
    case 'showcase': return `/stack-suite`;
    case 'collab': return `/stack-suite`;
    case 'article': return `/info-hub`;
    default: return '#';
  }
};

const getTitle = (item) => {
  const data = item.itemData;
  if (!data) return 'Untitled';
  return data.title || data.name || data.bio?.slice(0, 40) || 'Untitled';
};

const getDescription = (item) => {
  const data = item.itemData;
  if (!data) return '';
  return data.description || data.body || data.problemStatement || data.bio || '';
};

const getAuthor = (item) => {
  const data = item.itemData;
  if (!data) return null;
  const author = data.founder || data.author || data.creator || data.founderId;
  if (!author) return null;
  return {
    name: author.name || 'Unknown',
    avatarUrl: author.avatarUrl,
    _id: author._id,
  };
};

export const SavedItemsPage = () => {
  const queryClient = useQueryClient();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth || {});
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['savedItems', { type: activeCategory, search: searchQuery }],
    queryFn: () => getSavedItems(token, { type: activeCategory, search: searchQuery }),
    enabled: !!token && !!isAuthenticated,
  });

  const unsaveMutation = useMutation({
    mutationFn: (savedItemId) => unsaveItem(token, savedItemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedItems']);
    },
  });

  const handleUnsave = (savedItemId) => {
    if (window.confirm('Remove this item from your saved list?')) {
      unsaveMutation.mutate(savedItemId);
    }
  };

  const handleShare = async (item) => {
    const url = `${window.location.origin}${getDeepLink(item)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: getTitle(item), url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyState}>
          <Bookmark size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Login Required</h2>
          <p className={styles.emptyText}>Please log in to view your saved items.</p>
          <Link to="/login" className={styles.loginBtn}>Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Saved Items</h1>
          <p className={styles.subtitle}>
            {items.length > 0
              ? `You have ${items.length} saved ${items.length === 1 ? 'item' : 'items'}`
              : 'Your curated collection across the platform'}
          </p>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search saved items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className={styles.tabsRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.tabBtn} ${activeCategory === cat.id ? styles.tabActive : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <Bookmark size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'Your collection is empty'}
          </h2>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Try a different search term.'
              : 'Save projects, ideas, profiles, and posts to access them quickly here.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => {
            const title = getTitle(item);
            const desc = getDescription(item);
            const author = getAuthor(item);
            const deepLink = getDeepLink(item);

            return (
              <div key={item._id} className={styles.savedCard}>
                <div className={styles.cardTop}>
                  <div>
                    <span className={`${styles.typeBadge} ${styles[`badge${item.itemType}`] || ''}`}>
                      {item.itemType}
                    </span>
                    <Link to={deepLink} className={styles.savedTitle}>
                      <h3>{title}</h3>
                    </Link>
                  </div>
                  <div className={styles.cardActions}>
                    <button onClick={() => handleShare(item)} className={styles.iconBtn} title="Share">
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleUnsave(item._id)}
                      className={styles.iconBtn}
                      style={{ color: 'var(--destructive)' }}
                      title="Remove"
                      disabled={unsaveMutation.isLoading}
                    >
                      {unsaveMutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                {desc && (
                  <p className={styles.desc}>{desc.slice(0, 150)}{desc.length > 150 ? '...' : ''}</p>
                )}

                <div className={styles.cardFooter}>
                  <Link to={deepLink} className={styles.viewLink}>
                    <ExternalLink size={14} /> View
                  </Link>
                  {author && (
                    <Link to={`/users/${author._id}`} className={styles.authorLink}>
                      <div className={styles.miniAvatar}>
                        {author.avatarUrl ? (
                          <img src={author.avatarUrl} alt="" />
                        ) : (
                          author.name?.slice(0, 2).toUpperCase() || '??'
                        )}
                      </div>
                      <span>{author.name}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};