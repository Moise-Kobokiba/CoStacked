// src/components/shared/UserCard.jsx

import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Avatar } from './Avatar';
import styles from './UserCard.module.css';
import PropTypes from 'prop-types';
import verificationBadge from '../../assets/verification-badge.png';
import { Rocket, MapPin, Eye, MessageCircle } from 'lucide-react';
import { PresenceBadge } from './PresenceBadge';

export const UserCard = ({ user, variant = 'default' }) => {
  if (!user) return null;

  const isBoostedActive = user.isBoosted && new Date(user.boostExpiresAt) > new Date();
  const skills = Array.isArray(user.skills) ? user.skills : [];
  const isNetwork = variant === 'network';

  return (
    <div className={`${styles.card} ${isBoostedActive ? styles.boostedCard : ''} ${isNetwork ? styles.networkCard : ''}`}>
      
      {isBoostedActive && (
        <div className={styles.boostBadge}>
          <Rocket size={14} />
          <span>Featured</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.avatarContainer}>
          <Link to={`/users/${user._id}`}>
            <Avatar 
              src={user.avatarUrl} 
              fallback={(user.name || '?').charAt(0)} 
              alt={`${user.name || 'User'}'s avatar`} 
            />
          </Link>
          <div className={user.isOnline ? styles.onlineIndicator : styles.offlineIndicator}></div>
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.nameWrapper}>
            <h3 className={styles.name}>{user.name || 'Unnamed User'}</h3>
            {user.isVerified && (
              <img 
                src={verificationBadge} 
                alt="Verified Badge" 
                title="Verified User" 
                className={styles.verifiedIcon} 
              />
            )}
          </div>
          <p className={styles.role}>{user.role || 'No role specified'}</p>
          {/* ── Live Presence Badge ── */}
          <PresenceBadge user={user} />
          {user.location && (
            <p className={styles.location}>
              <MapPin size={11} /> {user.location}
            </p>
          )}
        </div>
      </div>
      
      {/* Founder-centric: Building / Seeking / Stage */}
      {isNetwork && (
        <div className={styles.networkMeta}>
          {user.headline && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Building</span>
              <span className={styles.metaValue}>{user.headline}</span>
            </div>
          )}
          {user.lookingFor && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Seeking</span>
              <span className={styles.metaValue}>{user.lookingFor}</span>
            </div>
          )}
        </div>
      )}

      <p className={styles.bio}>
        {user.bio || 'This user has not added a bio yet.'}
      </p>
      
      <div className={styles.skillsSection}>
        <div className={styles.skillsContainer}>
          {skills.length > 0 ? (
            <>
              {skills.slice(0, 4).map(skill => (
                <span key={skill} className={styles.skillTag}>{skill}</span>
              ))}
              {skills.length > 4 && <span className={styles.moreTag}>+{skills.length - 4}</span>}
            </>
          ) : (
            <p className={styles.noSkills}>No skills listed.</p>
          )}
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <Button to={`/users/${user._id}`} variant="secondary" className={styles.viewProfileBtn}>
            <Eye size={14} /> View Profile
          </Button>
          <Link to="/messages" className={styles.messageBtn}>
            <MessageCircle size={14} /> Message
          </Link>
        </div>
      </div>
    </div>
  );
};

UserCard.propTypes = {
  variant: PropTypes.oneOf(['default', 'network']),
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    role: PropTypes.string,
    bio: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.string,
    avatarUrl: PropTypes.string,
    isVerified: PropTypes.bool,
    isBoosted: PropTypes.bool,
    boostExpiresAt: PropTypes.string,
    isOnline: PropTypes.bool,
    location: PropTypes.string,
    headline: PropTypes.string,
    lookingFor: PropTypes.string,
  }).isRequired
};
