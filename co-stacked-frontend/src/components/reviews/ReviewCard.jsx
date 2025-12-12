// src/components/reviews/ReviewCard.jsx

import { Card } from '../shared/Card';
import { Avatar } from '../shared/Avatar';
import { StarRating } from '../shared/StarRating';
import styles from './ReviewCard.module.css';
import PropTypes from 'prop-types';

export const ReviewCard = ({ review }) => {
  // Guard clause to prevent rendering if review data is incomplete
  if (!review || !review.founderId || !review.projectId) {
    return null;
  }

  const { rating, comment, founderId, projectId, createdAt } = review;
  const reviewDate = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Avatar 
          src={founderId.avatarUrl} 
          fallback={(founderId.name || '?').charAt(0)}
          size="small"
        />
        <div className={styles.headerInfo}>
          <span className={styles.founderName}>{founderId.name}</span>
          <span className={styles.projectName}>
            For project: <strong>{projectId.title}</strong>
          </span>
        </div>
        <div className={styles.headerRight}>
          <StarRating rating={rating} size={16} />
          <span className={styles.date}>{reviewDate}</span>
        </div>
      </div>
      <p className={styles.comment}>"{comment}"</p>
    </Card>
  );
};

ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    founderId: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string,
    }).isRequired,
    projectId: PropTypes.shape({
      title: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};