// src/components/profile/ProfileCompletionModal.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import styles from './ProfileCompletionModal.module.css';

export const ProfileCompletionModal = ({ user, onClose }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    const hasExperience = user?.experience?.length > 0;
    const hasEducation = user?.education?.length > 0;
    const lastShown = localStorage.getItem('profileCompletionPromptLastShown');
    const now = Date.now();
    
    // Show if missing info AND (never shown or shown > 7 days ago)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if ((!hasExperience || !hasEducation) && (!lastShown || (now - parseInt(lastShown)) > sevenDays)) {
      setIsVisible(true);
      localStorage.setItem('profileCompletionPromptLastShown', now.toString());
    }
  }, [user]);

  if (!isVisible) return null;

  const handleComplete = () => {
    setIsVisible(false);
    navigate(`/profile/${user._id}`);
    // Open editor directly if possible, but redirecting to profile is a good start
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className={styles.overlay}>
      <Card className={styles.modalCard}>
        <button className={styles.closeBtn} onClick={handleClose}>
          <X size={24} />
        </button>
        
        <div className={styles.header}>
            <div className={styles.iconCircle}>
                <CheckCircle size={32} className={styles.checkIcon} />
            </div>
          <h2 className={styles.title}>Complete Your Profile</h2>
          <p className={styles.description}>
            Add your professional and academic history to increase your visibility 
            and build trust with co-founders and developers.
          </p>
        </div>

        <div className={styles.previewGrid}>
            <div className={`${styles.previewItem} ${user?.experience?.length > 0 ? styles.completed : ''}`}>
                <Briefcase size={20} />
                <span>Professional Experience</span>
                {user?.experience?.length > 0 && <CheckCircle size={16} className={styles.miniCheck} />}
            </div>
            <div className={`${styles.previewItem} ${user?.education?.length > 0 ? styles.completed : ''}`}>
                <GraduationCap size={20} />
                <span>Academic History</span>
                {user?.education?.length > 0 && <CheckCircle size={16} className={styles.miniCheck} />}
            </div>
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={handleClose}>Later</Button>
          <Button onClick={handleComplete} className={styles.actionBtn}>
            Update Profile <ArrowRight size={18} />
          </Button>
        </div>
      </Card>
    </div>
  );
};
