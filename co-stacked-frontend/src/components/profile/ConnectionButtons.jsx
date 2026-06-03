// src/components/profile/ConnectionButtons.jsx

import { Button } from '../shared/Button';
import styles from './ConnectionButtons.module.css'; 
import PropTypes from 'prop-types';
import { UserPlus, Check, Clock, MessageCircle } from 'lucide-react'; // Import icons for better UI

export const ConnectionButtons = ({ status, onConnect, onCancel, onRemove, onAccept, onDecline, isLoading, onMessage }) => {
  switch (status) {
    case 'loading':
      return <Button variant="secondary" disabled>Loading...</Button>;

    case 'connected':
      return (
        <div className={styles.container}>
          <Button disabled variant="secondary"><Check size={16} /> Connected</Button>
          <Button onClick={onMessage} variant="primary"><MessageCircle size={16} /> Message</Button>
          <Button onClick={onRemove} variant="outline" disabled={isLoading}>Remove</Button>
        </div>
      );
    
    case 'pending_sent':
      return (
        <div className={styles.container}>
          <Button disabled variant="secondary"><Clock size={16} /> Request Sent</Button>
          <Button onClick={onCancel} variant="outline" disabled={isLoading}>Cancel</Button>
        </div>
      );
    
    case 'pending_received':
      return (
        <div className={styles.container}>
          <Button onClick={onAccept} variant="primary" disabled={isLoading}>Accept</Button>
          <Button onClick={onDecline} variant="outline" disabled={isLoading}>Decline</Button>
        </div>
      );
    
    default: // not_connected
      return (
        // The container class is not needed for a single button, but we wrap it for consistency.
        <div className={styles.container}>
            <Button onClick={onConnect} variant="primary" disabled={isLoading}>
              <UserPlus size={16} /> {isLoading ? 'Sending...' : 'Connect'}
            </Button>
        </div>
      );
  }
};

ConnectionButtons.propTypes = {
  status: PropTypes.string.isRequired,
  onConnect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onMessage: PropTypes.func, // Optional prop, but should be passed if we want the button to appear/work
};