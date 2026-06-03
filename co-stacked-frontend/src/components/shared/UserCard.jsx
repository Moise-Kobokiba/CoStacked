// src/components/shared/UserCard.jsx

import { Card } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';
import { Avatar } from './Avatar';
import styles from './UserCard.module.css';
import PropTypes from 'prop-types';
import verificationBadge from '../../assets/verification-badge.png';
import { Rocket } from 'lucide-react'; // --- 1. IMPORT the Rocket icon ---

export const UserCard = ({ user }) => {
  if (!user) {
    return null;
  }

  // --- 2. DETERMINE if the boost is currently active ---
  const isBoostedActive = user.isBoosted && new Date(user.boostExpiresAt) > new Date();

  const skills = Array.isArray(user.skills) ? user.skills : [];

  return (
    // --- 3. CONDITIONALLY apply the .boostedCard style ---
    <Card isInteractive={true} className={`${styles.card} ${isBoostedActive ? styles.boostedCard : ''}`}>
      
      {/* --- 4. CONDITIONALLY render the "Featured" badge --- */}
      {isBoostedActive && (
        <div className={styles.boostBadge}>
          <Rocket size={14} />
          <span>Featured</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.avatarContainer}>
          <Avatar 
            src={user.avatarUrl} 
            fallback={(user.name || '?').charAt(0)} 
            alt={`${user.name || 'User'}'s avatar`} 
          />
          <div className={user.isOnline ? styles.onlineIndicator : styles.offlineIndicator}></div>
        </div>
        <div>
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
        </div>
      </div>
      
      <p className={styles.bio}>
        {user.bio || 'This user has not added a bio yet.'}
      </p>
      
      <div className={styles.skillsSection}>
        <h4 className={styles.skillsTitle}>Top Skills</h4>
        <div className={styles.skillsContainer}>
          {skills.length > 0 ? (
            <>
              {skills.slice(0, 3).map(skill => <Tag key={skill}>{skill}</Tag>)}
              {skills.length > 3 && <Tag>+{skills.length - 3} more</Tag>}
            </>
          ) : (
            <p className={styles.noSkills}>No skills listed.</p>
          )}
        </div>
      </div>
      
      <div className={styles.footer}>
        <span className={styles.availability}>
          {user.availability || 'Availability not set'}
        </span>
        <Button to={`/users/${user._id}`} variant="secondary">View Profile</Button>
      </div>
    </Card>
  );
};

// --- 5. UPDATE PropTypes to include the new boosting fields ---
UserCard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    role: PropTypes.string,
    bio: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.string,
    avatarUrl: PropTypes.string,
    isVerified: PropTypes.bool,
    isBoosted: PropTypes.bool,       // Add this
    boostExpiresAt: PropTypes.string, // Add this
  }).isRequired
};