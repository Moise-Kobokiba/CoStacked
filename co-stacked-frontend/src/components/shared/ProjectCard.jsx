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
import { MessageSquare, XCircle, Rocket, ArrowRight } from 'lucide-react';
import { VerificationBadge } from './VerificationBadge';

export const ProjectCard = ({ project, connection }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteClick = () => setIsModalOpen(true);
  const confirmDelete = () => {
    if (connection) dispatch(deleteInterest(connection._id));
    setIsModalOpen(false);
  };

  if (!project) return null;

  const isBoostedActive = project.isBoosted && new Date(project.boostExpiresAt) > new Date();
  const skills = Array.isArray(project.skillsNeeded) ? project.skillsNeeded : [];

  return (
    <>
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Cut Connection"
        message={`Are you sure you want to end your collaboration on "${project.title}"?`}
        confirmText="Yes, Cut Connection"
      />

      <Card isInteractive={true} className={`${styles.card} ${isBoostedActive ? styles.boostedCard : ''}`}>
        {/* Image header with stage badge */}
        <div className={styles.imageHeader}>
          <img
            src={project.imageUrl || '/api/placeholder/400/200'}
            alt={project.title}
            className={styles.projectImage}
          />
          <div className={styles.imageOverlay} />
          <span className={styles.stageBadge}>{project.stage || 'IDEATION'}</span>

          {isBoostedActive && (
            <div className={styles.boostBadge}>
              <Rocket size={12} />
              <span>FEATURED</span>
            </div>
          )}
        </div>

        <div className={styles.contentWrapper}>
          {/* Founder row */}
          <div className={styles.founderRow}>
            <div className={styles.avatarPlaceholder}>
              {project.founder?.charAt(0) || 'F'}
            </div>
            <div className={styles.founderText}>
              <span className={styles.metaLabel}>FOUNDER</span>
              <p className={styles.founderName}>
                {project.founder || 'Anonymous'}
                {project.founderId?.isVerified && <VerificationBadge size={12} />}
              </p>
            </div>
          </div>

          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.description}>{project.description}</p>

          {/* Skills tags (max 3) */}
          <div className={styles.tagsContainer}>
            {skills.slice(0, 3).map((skill) => (
              <Tag key={skill} className={styles.customTag}>{skill}</Tag>
            ))}
          </div>

          {/* Footer with compensation and action */}
          <div className={styles.footer}>
            <div className={styles.compensationBlock}>
              <span className={styles.metaLabel}>COMPENSATION</span>
              <p className={styles.compValue}>{project.compensation || 'Equity'}</p>
            </div>

            {connection ? (
              <div className={styles.actionGroup}>
                <Button variant="secondary" to="/messages" className={styles.iconBtn}>
                  <MessageSquare size={18} />
                </Button>
                <Button onClick={handleDeleteClick} className={styles.iconBtnDanger}>
                  <XCircle size={18} />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" to={`/projects/${project._id}`} className={styles.viewDetailsLink}>
                View Details <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

ProjectCard.propTypes = {
  project: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    skillsNeeded: PropTypes.arrayOf(PropTypes.string),
    compensation: PropTypes.string,
    stage: PropTypes.string,
    founder: PropTypes.string,
    founderId: PropTypes.shape({ isVerified: PropTypes.bool }),
    isBoosted: PropTypes.bool,
    boostExpiresAt: PropTypes.string,
    imageUrl: PropTypes.string,
  }).isRequired,
  connection: PropTypes.object,
};