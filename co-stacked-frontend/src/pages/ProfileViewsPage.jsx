/* src/pages/ProfileViewsPage.jsx */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Eye, 
  Lock, 
  ArrowLeft, 
  Crown,
  Loader2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { fetchProfileViews } from '../features/auth/authSlice';
import styles from './ProfileViewsPage.module.css';
import { formatDistanceToNow } from 'date-fns';

export function ProfileViewsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profileViews, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProfileViews());
  }, [dispatch]);

  const isLoading = profileViews.status === 'loading';
  const hasHistory = profileViews.history && profileViews.history.length > 0;

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Account Views</h1>
        <p className={styles.subtitle}>See who's checking out your profile and professional history.</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Views</div>
          <div className={styles.statValue}>{profileViews.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Unique Visitors</div>
          <div className={styles.statValue}>{profileViews.history.length}</div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.spinner}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : !hasHistory ? (
        <div className={styles.emptyState}>
          <div style={{ background: 'var(--input-background)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Eye size={32} style={{ color: var('--muted-foreground') }} />
          </div>
          <h3>No views yet</h3>
          <p className={styles.subtitle}>Try boosting your profile or sharing your link to get more traction!</p>
          <Link to="/profile" className={styles.upgradeBtn} style={{ marginTop: '1rem', display: 'inline-block' }}>Complete Your Profile</Link>
        </div>
      ) : (
        <div className={styles.viewsList}>
          {profileViews.history.map((view, index) => {
            const viewer = view.viewerId;
            if (!viewer) return null;

            return (
              <Link key={view._id || index} to={`/users/${viewer._id}`} className={styles.viewerCard}>
                <div className={styles.viewerAvatar}>
                  {viewer.avatarUrl ? (
                    <img src={viewer.avatarUrl} alt={viewer.name} />
                  ) : (
                    viewer.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className={styles.viewerInfo}>
                  <div className={styles.viewerName}>{viewer.name}</div>
                  <div className={styles.viewerHeadline}>
                    {viewer.headline || viewer.role}
                  </div>
                </div>
                <div className={styles.viewDate}>
                  <div style={{ opacity: 0.7 }}>Viewed</div>
                  <div style={{ fontWeight: 600 }}>{formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}</div>
                </div>
              </Link>
            );
          })}

          {/* Paywall / Restriction UI */}
          {profileViews.isRestricted && (
            <div className={styles.restrictedBanner}>
              <div style={{ background: 'rgba(36, 99, 235, 0.1)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={24} style={{ color: '#2463eb' }} />
              </div>
              <h3 className={styles.restrictedTitle}>See More Viewers</h3>
              <p className={styles.restrictedText}>
                You've reached the limit for free accounts. Subscribe to our monthly plan to see exactly who's viewing your profile beyond your latest 6 visitors.
              </p>
              <Link to="/payment" className={styles.upgradeBtn}>
                Unlock All Views
              </Link>
            </div>
          )}

          {/* Placeholder for blurred items if restricted */}
          {profileViews.isRestricted && [1, 2].map((i) => (
            <div key={`blur-${i}`} className={`${styles.viewerCard} ${styles.blurredCard}`}>
              <div className={styles.viewerAvatar}>?</div>
              <div className={styles.viewerInfo}>
                <div className={styles.viewerName}>•••••••• ••••••••</div>
                <div className={styles.viewerHeadline}>Professional Viewer</div>
              </div>
              <div className={styles.viewDate}>
                <div>Recently</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
