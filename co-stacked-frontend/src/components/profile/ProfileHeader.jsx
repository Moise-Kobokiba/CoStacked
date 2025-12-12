// src/components/profile/ProfileHeader.jsx

import { Button } from '../shared/Button';
import { StarRating } from '../shared/StarRating';
import { Avatar } from '../shared/Avatar';
import { ConnectionButtons } from './ConnectionButtons'; // 1. Import the new component
import styles from '../../pages/ProfilePage.module.css';
import verificationBadge from '../../assets/verification-badge.png';
import PropTypes from 'prop-types';
import { Edit, Share2 } from 'lucide-react';

export const ProfileHeader = ({ 
  user, 
  isOwnProfile, 
  averageRating, 
  reviewCount,
  canLeaveReview, 
  onEdit, 
  onBoost, 
  onReview,
  onAvatarClick,
  onShare,
  copySuccess,
  // --- 2. Accept new connection-related props ---
  connectionStatus,
  connectionHandlers,
  isConnectionLoading,

  onMessage,
  connectionCount, // New Prop
}) => (
  <div className={styles.header}>
    {/* The main content (avatar, name, etc.) remains unchanged */}
    <div className={styles.headerMain}>
      <div className={styles.avatarWrapper}>
        <Avatar 
          src={user.avatarUrl} 
          fallback={(user.name || '?').charAt(0)}
          size="large"
        />
        {isOwnProfile && (
          <button className={styles.avatarEditButton} onClick={onAvatarClick} aria-label="Change profile picture">
            <Edit size={16} />
          </button>
        )}
      </div>
      <div className={styles.infoWrapper}>
        <div className={styles.nameWrapper}>
          <h1 className={styles.title}>{user.name}</h1>
          {user.isVerified && (
            <div className={styles.verifiedBadge} title="Verified User">
              <img src={verificationBadge} alt="Verification Badge" className={styles.badgeIcon} />
              <span>Verified</span>
            </div>
          )}
        </div>
        {user.role === 'developer' && reviewCount > 0 && (
          <div className={styles.aggregateRating}>
            <StarRating rating={averageRating} />
            <span>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
        <p className={styles.subtitle}>
          {user.role}
          {connectionCount !== undefined && (
            <span className={styles.connectionCount}> • {connectionCount} connections</span>
          )}
        </p>
      </div>
    </div>
    
    <div className={styles.headerActions}>
      <Button onClick={onShare} variant="secondary">
        <Share2 size={16} />
        <span>{copySuccess ? 'Copied!' : 'Share'}</span>
      </Button>
      
      {/* --- 3. RENDER the correct set of buttons based on context --- */}
      {!isOwnProfile ? (
        // If viewing someone else's profile, show the connection buttons
        <ConnectionButtons 
          status={connectionStatus}
          onConnect={connectionHandlers.send}
          onCancel={connectionHandlers.cancel}
          onRemove={connectionHandlers.remove}
          onAccept={connectionHandlers.accept}
          onDecline={connectionHandlers.decline}
          isLoading={isConnectionLoading}
          onMessage={onMessage} // Pass it down
        />
      ) : (
        // If viewing your own profile, show the management buttons
        <>
          <Button onClick={onBoost} variant="secondary">Boost Profile</Button>
          <Button onClick={onEdit}>Edit Profile</Button>
        </>
      )}

      {/* The "Leave a Review" button is separate as it has its own logic */}
      {canLeaveReview && <Button onClick={onReview} variant="secondary">Leave a Review</Button>}
    </div>
  </div>
);

// --- 4. UPDATE PropTypes to include all new props ---
ProfileHeader.propTypes = {
  user: PropTypes.object.isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  averageRating: PropTypes.number,
  reviewCount: PropTypes.number,
  canLeaveReview: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onBoost: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
  onAvatarClick: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  copySuccess: PropTypes.string.isRequired,
  connectionStatus: PropTypes.string,
  connectionHandlers: PropTypes.object,
  isConnectionLoading: PropTypes.bool,
  onMessage: PropTypes.func,
  connectionCount: PropTypes.number,
};