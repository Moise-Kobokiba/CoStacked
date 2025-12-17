// src/components/messaging/ChatWindow.jsx

import { useState, useEffect } from 'react';
import styles from './ChatWindow.module.css';
import { Avatar } from '../shared/Avatar';
import { ChevronLeft } from 'lucide-react';
import PropTypes from 'prop-types';

// Import our new sub-components
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow = ({ conversation, messages = [], currentUserId, onBack, socket }) => {
  const [isMobile, setIsMobile] = useState(false);
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  const projectTitle = conversation.projectId?.title || 'General Conversation';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={styles.container}>
      {/* Chat Header */}
      <header className={styles.header}>
        {isMobile && (
          <button
            className={styles.backButton}
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {otherParticipant && (
          <>
            <Avatar
              src={otherParticipant.avatarUrl}
              fallback={(otherParticipant.name || '?').charAt(0)}
              size="small"
            />
            <div className={styles.headerInfo}>
              <p className={styles.userName}>{otherParticipant.name}</p>
              <p className={styles.userRole}>Re: {projectTitle}</p>
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