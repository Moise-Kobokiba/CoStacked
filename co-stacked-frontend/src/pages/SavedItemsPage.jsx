import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { Bookmark, Share2, MessageSquare, ArrowBigUp, Loader2, Trash2, ExternalLink, Calendar, GitBranch } from 'lucide-react';
import { getSavedItems } from '../api/stackSuiteApi';
import { toggleBookmark } from '../features/auth/authSlice';
import styles from './SavedItemsPage.module.css';

export const SavedItemsPage = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['savedItems'],
    queryFn: getSavedItems,
    enabled: !!user,
  });

  const handleUnsave = async (itemId, itemType) => {
    if (window.confirm('Remove this item from your saved list?')) {
      await dispatch(toggleBookmark({ itemId, itemType }));
      queryClient.invalidateQueries(['savedItems']);
    }
  };

  const handleShare = async (item) => {
    const url = `${window.location.origin}/stack-suite`; // Simplified for now
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title || item.name || item.milestone,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)', opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Saved Items</h1>
        <p className={styles.subtitle}>Your curated collection of projects, ideas, and collaborations.</p>
      </header>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <Bookmark size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Your collection is empty</h2>
          <p className={styles.emptyText}>Bookmark interesting projects or discussions in the StackSuite to see them here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => {
            const isPost = item.bookmarkType === 'post';
            const isShowcase = item.bookmarkType === 'showcase';
            const isCollab = item.bookmarkType === 'collabThread';

            const title = item.title || item.name || item.milestone;
            const desc = item.body || item.description;

            return (
              <div key={item._id} className={styles.savedCard} style={{ background: 'var(--card-background)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className={`${styles.typeBadge} ${isPost ? styles.badgePost : isShowcase ? styles.badgeShowcase : styles.badgeCollab}`}>
                      {item.bookmarkType}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>{title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleShare(item)} className="btn-icon" style={{ padding: '8px', borderRadius: '8px', color: 'var(--muted-foreground)' }} title="Share">
                      <Share2 size={18} />
                    </button>
                    <button onClick={() => handleUnsave(item._id, item.bookmarkType)} className="btn-icon" style={{ padding: '8px', borderRadius: '8px', color: 'var(--destructive)' }} title="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0 0 20px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={14} /> {item.commentCount || 0}
                      </span>
                      {item.upvotes && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowBigUp size={16} /> {item.upvoteCount}
                        </span>
                      )}
                      {isCollab && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <GitBranch size={14} /> {item.progress}
                        </span>
                      )}
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                        {(item.author || item.founder)?.avatarUrl ? (
                          <img src={(item.author || item.founder).avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (item.author || item.founder)?.name?.slice(0, 2).toUpperCase() || '??'
                        )}
                     </div>
                     <span style={{ fontSize: '13px', fontWeight: '500' }}>{(item.author || item.founder)?.name}</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
