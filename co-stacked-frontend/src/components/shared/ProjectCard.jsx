// src/components/shared/ProjectCard.jsx

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteInterest } from '../../features/interests/interestsSlice';
import PropTypes from 'prop-types';
import { Card } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';
import styles from './ProjectCard.module.css';
// --- 1. IMPORT ICONS ---
import { MessageSquare, XCircle, Rocket } from 'lucide-react';
import { VerificationBadge } from './VerificationBadge';

export const ProjectCard = ({ project, connection }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };
  const confirmDelete = () => {
    if (connection) {
      dispatch(deleteInterest(connection._id));
    }
    setIsModalOpen(false);
  };
  
  if (!project) return null;

  // --- 2. DETERMINE if the boost is currently active ---
  const isBoostedActive = project.isBoosted && new Date(project.boostExpiresAt) > new Date();

  const skills = Array.isArray(project.skillsNeeded) ? project.skillsNeeded : [];

  return (
    <>
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Cut Connection"
        message={`Are you sure you want to end your collaboration on "${project.title}"? This cannot be undone.`}
        confirmText="Yes, Cut Connection"
      />
      {/* --- 3. CONDITIONALLY apply the .boostedCard style --- */}
      <Card isInteractive={true} className={`${styles.card} ${isBoostedActive ? styles.boostedCard : ''}`}>
        {/* --- 4. CONDITIONALLY render the "Featured" badge --- */}
        {isBoostedActive && (
          <div className={styles.boostBadge}>
            <Rocket size={14} />
            <span>Featured</span>
          </div>
        )}

        <div className={styles.contentWrapper}>
            <h3 className={styles.title}>{project.title || 'Untitled Project'}</h3>
            <p className={styles.description}>{project.description || 'No description provided.'}</p>
            <div>
              <h4 className={styles.skillsTitle}>Skills Needed</h4>
              <div className={styles.tagsContainer}>
                {skills.length > 0 ? (
                    skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
                ) : (
                    <p className={styles.noSkills}>No specific skills listed.</p>
                )}
              </div>
            </div>
            <div className={styles.detailsList}>
              <p className={styles.detailItem}><span className={styles.detailLabel}>Compensation:</span> {project.compensation || 'N/A'}</p>
              <p className={styles.detailItem}><span className={styles.detailLabel}>Stage:</span> {project.stage || 'N/A'}</p>
              <p className={styles.detailItem}>
                <span className={styles.detailLabel}>Founder:</span> 
                {project.founder || 'N/A'}
                {project.founderId?.isVerified && <VerificationBadge size={14} />}
              </p>
            </div>
        
            {/* --- REFACTORED FOOTER LOGIC --- */}
            <div className={styles.footer}>
              {connection ? (
                // If there's a connection object, show developer actions
                <>
                  <Button variant="secondary" to="/messages" className={styles.actionButton}>
                      <MessageSquare size={16} />
                      <span>Message</span>
                  </Button>
                  <Button onClick={handleDeleteClick} className={`${styles.actionButton} ${styles.disconnectButton}`}>
                      <XCircle size={16} />
                      <span>Disconnect</span>
                  </Button>
                </>
              ) : (
                // Otherwise (on Discover page), show a single, clear call-to-action
                <Button variant="primary" to={`/projects/${project._id}`} className={styles.viewDetailsButton}>
                  View Details & Connect
                </Button>
              )}
            </div>
            {/* --- END REFACTORED FOOTER --- */}
        </div>
      </Card>
    </>
  );
};

// --- 5. UPDATE PropTypes to include the new boosting fields ---
ProjectCard.propTypes = {
  project: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    skillsNeeded: PropTypes.arrayOf(PropTypes.string),
    compensation: PropTypes.string,
    stage: PropTypes.string,
    founder: PropTypes.string,
    isBoosted: PropTypes.bool,
    boostExpiresAt: PropTypes.string,
  }).isRequired,
  connection: PropTypes.object,
};