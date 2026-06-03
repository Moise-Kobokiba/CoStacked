// src/components/profile/ProfileCompletionBadge.jsx
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import styles from './ProfileCompletionBadge.module.css';

export const ProfileCompletionBadge = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields = [
      { name: 'avatarUrl', weight: 20 },
      { name: 'bio', weight: 20 },
      { name: 'skills', weight: 15, check: (val) => val && val.length > 0 },
      { name: 'location', weight: 15 },
      { name: 'availability', weight: 15 },
      { name: 'portfolioLink', weight: 10 },
      { name: 'socials.linkedin', weight: 5 },
    ];

    let completed = 0;
    fields.forEach(field => {
      let value = user[field.name];
      if (field.name.includes('.')) {
        const [parent, child] = field.name.split('.');
        value = user[parent]?.[child];
      }
      
      if (field.check) {
        if (field.check(value)) completed += field.weight;
      } else if (value && value.toString().trim() !== '') {
        completed += field.weight;
      }
    });

    return Math.min(completed, 100);
  };

  const completionPercentage = calculateCompletion();
  const isComplete = completionPercentage === 100;

  if (isComplete) {
    return (
      <div className={`${styles.badge} ${styles.complete}`}>
        <CheckCircle size={18} />
        <span>Profile Complete</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (completionPercentage < 40) return styles.low;
    if (completionPercentage < 75) return styles.medium;
    return styles.high;
  };

  const getMissingFields = () => {
    const missing = [];
    if (!user.avatarUrl) missing.push('Profile photo');
    if (!user.bio || user.bio.length < 20) missing.push('Bio');
    if (!user.skills || user.skills.length === 0) missing.push('Skills');
    if (!user.location) missing.push('Location');
    if (!user.availability) missing.push('Availability');
    return missing;
  };

  const missingFields = getMissingFields();

  return (
    <div 
      className={`${styles.badge} ${getStatusColor()} ${styles.clickable}`}
      onClick={() => navigate('/settings')}
      title="Click to complete your profile"
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <AlertCircle size={18} />
          <span className={styles.percentage}>{completionPercentage}% Complete</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        {missingFields.length > 0 && (
          <div className={styles.missingFields}>
            <span className={styles.missingLabel}>Missing:</span>
            <span className={styles.missingList}>
              {missingFields.slice(0, 2).join(', ')}
              {missingFields.length > 2 && ` +${missingFields.length - 2} more`}
            </span>
          </div>
        )}
      </div>
      <ChevronRight size={16} className={styles.arrow} />
    </div>
  );
};

export default ProfileCompletionBadge;
