// src/components/messaging/ChatWindow.jsx

import styles from './ChatWindow.module.css';
import { Avatar } from '../shared/Avatar';
import { ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';

// Import our new sub-components
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow = ({ conversation, messages = [], currentUserId, onBack, socket }) => {

  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft size={22} />
        </button>
        {otherParticipant && (
          <>
            <Avatar src={otherParticipant.avatarUrl} fallback={(otherParticipant.name || '?').charAt(0)} size="small" />
            <div className={styles.headerInfo}>
              <p className={styles.userName}>{otherParticipant.name}</p>
              <p className={styles.userRole}>{otherParticipant.role}</p>
            </div>
          </>
        )}
      </header>

      <MessageList messages={messages} currentUserId={currentUserId} />
      
      <MessageInput 
        socket={socket} 
        conversationId={conversation._id} 
        currentUserId={currentUserId} 
      />
    </div>
  );
};

ChatWindow.propTypes = {
  conversation: PropTypes.object.isRequired,
  messages: PropTypes.array,
  currentUserId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  socket: PropTypes.object, // Socket can be null initially
};