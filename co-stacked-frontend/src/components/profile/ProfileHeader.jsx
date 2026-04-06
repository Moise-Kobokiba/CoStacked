// src/components/profile/ProfileHeader.jsx

import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { ConnectionButton } from './ConnectionButton';
import { VerificationBadge } from '../shared/VerificationBadge';
import styles from '../../pages/ProfilePage.module.css';
import PropTypes from 'prop-types';
import { 
  Edit, Share2, MapPin, Briefcase, Clock, 
  MessageSquare 
} from 'lucide-react';

export const ProfileHeader = ({ 
  user, 
  isOwnProfile, 
  onEdit, 
  onBoost, 
  onReview,
  canLeaveReview,
  onAvatarClick,
  onAvatarView,
  onShare,
  copySuccess,
  connectionStatus,
  connectionHandlers,
  isConnectionLoading,
  onMessage,
}) => (
  <div className={styles.profileHeaderCard}>
    <div className={styles.headerCover}></div>
    <div className={styles.headerContent}>
      <div className={styles.headerTopArea}>
        <div className={styles.avatarWrapper}>
          <div className={styles.profileAvatar}>
            <Avatar 
              src={user.avatarUrl} 
              fallback={(user.name || '?').charAt(0)}
              size="xlarge"
              onClick={isOwnProfile ? onAvatarClick : onAvatarView}
            />
          </div>
          <div className={styles.onlineBadge} title="Online now"></div>
          {isOwnProfile && (
            <button className={styles.avatarEditButton} onClick={onAvatarClick} aria-label="Change profile picture">
              <Edit size={16} />
            </button>
          )}
        </div>

        <div className={styles.mainInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{user.name}</h1>
            {user.isVerified && (
              <span className={styles.verifiedBadge}>
                <VerificationBadge size={16} />
                Verified
              </span>
            )}
          </div>
          <p className={styles.role}>
            {user.headline || (user.role === 'developer' ? 'Full-Stack Developer & Tech Architect' : 'Founder & Product Strategist')}
          </p>
          
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <MapPin size={16} />
              <span>{user.location || "Bulacan, Philippines"}</span>
            </div>
            <div className={styles.metaItem}>
              <Briefcase size={16} />
              <span>{user.availability || "Open to Co-founding"}</span>
            </div>
            <div className={styles.metaItem}>
              <Clock size={16} />
              <span>Usually responds in 2 hours</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {!isOwnProfile ? (
            <>
              <div className={styles.connectBtnWrapper}>
                <ConnectionButton
                  status={connectionStatus}
                  targetUserId={user._id}
                  onConnect={connectionHandlers.send}
                  onCancel={connectionHandlers.cancel}
                  onRemove={connectionHandlers.remove}
                  onAccept={connectionHandlers.accept}
                  onDecline={connectionHandlers.decline}
                  isLoading={isConnectionLoading}
                />
              </div>
              <Button onClick={onMessage} className={styles.messageBtn}>
                <MessageSquare size={18} />
                Message
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onBoost} variant="secondary">Boost Profile</Button>
              <Button onClick={onEdit}>Edit Profile</Button>
            </>
          )}
          
          <Button onClick={onShare} variant="secondary" title="Share Profile">
            <Share2 size={16} />
            {copySuccess && <span>Copied!</span>}
          </Button>

          {canLeaveReview && (
            <Button onClick={onReview} variant="secondary">Leave a Review</Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

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
  onAvatarView: PropTypes.func,
  onShare: PropTypes.func.isRequired,
  copySuccess: PropTypes.string.isRequired,
  connectionStatus: PropTypes.string,
  connectionHandlers: PropTypes.object,
  isConnectionLoading: PropTypes.bool,
  onMessage: PropTypes.func,
  connectionCount: PropTypes.number,
};