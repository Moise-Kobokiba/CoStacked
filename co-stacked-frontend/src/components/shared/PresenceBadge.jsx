// src/components/shared/PresenceBadge.jsx

import PropTypes from 'prop-types';
import { getPresenceStatus } from '../../utils/presenceUtils';
import styles from './PresenceBadge.module.css';

/**
 * Reusable presence indicator badge.
 *
 * Used in: UserCard, ProfileHeader, MyNetwork, Browse Talent, Messages, Connections.
 *
 * Props:
 *   user – a user object containing at least { isOnline?, lastActiveAt?, lastSeen? }
 *   compact – (optional) when true renders a smaller pill without a dot (default: false)
 */
export const PresenceBadge = ({ user, compact = false }) => {
  const presence = getPresenceStatus(user);

  const pillClass = [
    styles.pill,
    compact ? styles.compact : '',
    presence.type === 'online' ? styles.online :
    presence.type === 'today' ? styles.today :
    presence.type === 'yesterday' ? styles.yesterday :
    styles.offline,
  ].filter(Boolean).join(' ');

  return (
    <span className={pillClass} title={presence.label}>
      <span className={styles.dot}></span>
      {!compact && <span className={styles.label}>{presence.label}</span>}
    </span>
  );
};

PresenceBadge.propTypes = {
  user: PropTypes.object.isRequired,
  compact: PropTypes.bool,
};