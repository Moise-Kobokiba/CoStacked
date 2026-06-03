// src/components/connections/ConnectionRequestCard.jsx

import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import styles from './ConnectionRequestCard.module.css';
import PropTypes from 'prop-types';

export const ConnectionRequestCard = ({ request, onAccept, onDecline }) => {
  const requester = request.requester;

  if (!requester) return null;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Avatar 
          src={requester.avatarUrl} 
          fallback={(requester.name || '?').charAt(0)}
        />
        <div className={styles.userInfo}>
          <p className={styles.name}>{requester.name}</p>
          <p className={styles.role}>{requester.role}</p>
        </div>
      </div>

      <p className={styles.bio}>
        {requester.bio || 'This user has not provided a bio.'}
      </p>

      <div className={styles.footer}>
        <Button onClick={onDecline} variant="secondary">Decline</Button>
        <Button onClick={onAccept} variant="primary">Accept</Button>
      </div>
    </Card>
  );
};

ConnectionRequestCard.propTypes = {
  request: PropTypes.shape({
    requester: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      avatarUrl: PropTypes.string,
      bio: PropTypes.string,
    }).isRequired,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
};