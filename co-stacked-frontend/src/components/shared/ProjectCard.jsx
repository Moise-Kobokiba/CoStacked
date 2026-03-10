import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { deleteInterest } from '../../features/interests/interestsSlice'
import PropTypes from 'prop-types'
import { Card } from './Card'
import { Tag } from './Tag'
import { Button } from './Button'
import { ConfirmationModal } from './ConfirmationModal'
import styles from './ProjectCard.module.css'

import { MessageSquare, XCircle, Rocket } from 'lucide-react'
import { VerificationBadge } from './VerificationBadge'

export const ProjectCard = ({ project, connection }) => {
  const dispatch = useDispatch()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDeleteClick = () => {
    setIsModalOpen(true)
  }

  const confirmDelete = () => {
    if (connection) {
      dispatch(deleteInterest(connection._id))
    }
    setIsModalOpen(false)
  }

  if (!project) return null

  const isBoostedActive =
    project.isBoosted && new Date(project.boostExpiresAt) > new Date()

  const skills = Array.isArray(project.skillsNeeded)
    ? project.skillsNeeded
    : []

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

      <Card
        isInteractive={true}
        className={`${styles.card} ${
          isBoostedActive ? styles.boostedCard : ''
        }`}
      >
        {/* CARD IMAGE HEADER */}

        <div className={styles.imageHeader}>
          <img
            src={
              project.coverImage ||
              'https://images.unsplash.com/photo-1551288049-bebda4e38f71'
            }
            alt={project.title}
          />

          {project.stage && (
            <span className={styles.stageBadge}>
              {project.stage}
            </span>
          )}

          {isBoostedActive && (
            <div className={styles.boostBadge}>
              <Rocket size={14} />
              <span>Featured</span>
            </div>
          )}
        </div>

        <div className={styles.contentWrapper}>
          <h3 className={styles.title}>
            {project.title || 'Untitled Project'}
          </h3>

          <p className={styles.description}>
            {project.description || 'No description provided.'}
          </p>

          {/* SKILLS */}

          <div className={styles.tagsContainer}>
            {skills.length > 0 ? (
              skills.slice(0, 4).map((skill) => (
                <Tag key={skill}>{skill}</Tag>
              ))
            ) : (
              <p className={styles.noSkills}>No skills listed</p>
            )}
          </div>

          {/* DETAILS */}

          <div className={styles.detailsList}>
            <p className={styles.detailItem}>
              <span className={styles.detailLabel}>
                Compensation
              </span>

              <span className={styles.compensation}>
                {project.compensation || 'N/A'}
              </span>
            </p>

            <div className={styles.founderRow}>
              <div className={styles.founderAvatar}>
                {project.founder?.charAt(0) || 'F'}
              </div>

              <div className={styles.founderInfo}>
                <span className={styles.founderName}>
                  {project.founder || 'Founder'}
                </span>

                {project.founderId?.isVerified && (
                  <VerificationBadge size={14} />
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className={styles.footer}>
            {connection ? (
              <>
                <Button
                  variant="secondary"
                  to="/messages"
                  className={styles.actionButton}
                >
                  <MessageSquare size={16} />
                  <span>Message</span>
                </Button>

                <Button
                  onClick={handleDeleteClick}
                  className={`${styles.actionButton} ${styles.disconnectButton}`}
                >
                  <XCircle size={16} />
                  <span>Disconnect</span>
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                to={`/projects/${project._id}`}
                className={styles.viewDetailsButton}
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}

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
    coverImage: PropTypes.string
  }).isRequired,
  connection: PropTypes.object
}