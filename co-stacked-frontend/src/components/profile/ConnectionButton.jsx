// src/components/profile/ConnectionButton.jsx

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import styles from './ConnectionButton.module.css';
import PropTypes from 'prop-types';
import { UserPlus, Check, Clock, MessageCircle } from 'lucide-react';
import { accessConversation } from '../../features/messages/messagesSlice';

export const ConnectionButton = ({
  status,
  targetUserId,
  onConnect,
  onCancel,
  onRemove,
  onAccept,
  onDecline,
  isLoading
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMessage = async () => {
    if (!targetUserId) return;

    try {
      const result = await dispatch(accessConversation(targetUserId)).unwrap();
      // Navigate to messages page with the conversation
      navigate('/messages', { state: { conversationId: result._id } });
    } catch (error) {
      console.error('Failed to access conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  switch (status) {
    case 'loading':
      return <Button variant="secondary" disabled>Loading...</Button>;

    case 'connected':
      return (
        <div className={styles.container}>
          <Button disabled variant="secondary"><Check size={16} /> Connected</Button>
          <Button onClick={handleMessage} variant="primary" disabled={isLoading}>
            <MessageCircle size={16} /> Message
          </Button>
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
        <div className={styles.container}>
          <Button onClick={onConnect} variant="primary" disabled={isLoading}>
            <UserPlus size={16} /> {isLoading ? 'Sending...' : 'Connect'}
          </Button>
        </div>
      );
  }
};

ConnectionButton.propTypes = {
  status: PropTypes.string.isRequired,
  targetUserId: PropTypes.string.isRequired,
  onConnect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};