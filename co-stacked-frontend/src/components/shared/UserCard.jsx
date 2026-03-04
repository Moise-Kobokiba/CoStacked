// src/components/shared/UserCard.jsx
import { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';
import { Avatar } from './Avatar';
import styles from './UserCard.module.css';
import PropTypes from 'prop-types';
import verificationBadge from '../../assets/verification-badge.png';
import { Rocket } from 'lucide-react';

export const UserCard = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const bioRef = useRef(null);

  if (!user) {
    return null;
  }

  // Check if the boost is currently active
  const isBoostedActive = user.isBoosted && new Date(user.boostExpiresAt) > new Date();

  const skills = Array.isArray(user.skills) ? user.skills : [];

  // Check if bio overflows its container
  useEffect(() => {
    const checkOverflow = () => {
      if (bioRef.current) {
        const isOverflowing = bioRef.current.scrollHeight > bioRef.current.clientHeight;
        setShowSeeMore(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [user.bio]);

  // Toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const bioText = user.bio || 'This user has not added a bio yet.';
  const isPlaceholder = !user.bio;

  return (
    <Card isInteractive={true} className={`${styles.card} ${isBoostedActive ? styles.boostedCard : ''}`}>
      
      {/* Featured badge for boosted users */}
      {isBoostedActive && (
        <div className={styles.boostBadge}>
          <Rocket size={14} />
          <span>Featured</span>
        </div>
      )}

      <div className={styles.header}>
        <Avatar 
          src={user.avatarUrl} 
          fallback={(user.name || '?').charAt(0)} 
          alt={`${user.name || 'User'}'s avatar`} 
        />
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
      
      {/* Bio section with expand/collapse functionality */}
      <div className={styles.bioContainer}>
        <p 
          ref={bioRef}
          className={`${styles.bio} ${isExpanded ? styles.expanded : ''}`}
        >
          {bioText}
        </p>
        
        {/* Show "See more" button only if text overflows and it's not the placeholder */}
        {showSeeMore && !isPlaceholder && (
          <button 
            onClick={toggleExpand}
            className={styles.seeMoreBtn}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>
      
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
    isBoosted: PropTypes.bool,
    boostExpiresAt: PropTypes.string,
  }).isRequired
};