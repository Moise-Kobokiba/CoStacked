// src/components/messaging/ChatWindow.jsx

import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';
import { Avatar } from '../shared/Avatar';
import { 
  ChevronLeft, Phone, Video, MoreVertical, 
  Users, Circle 
} from 'lucide-react';
import PropTypes from 'prop-types';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow = ({ conversation, messages = [], currentUserId, onBack, socket }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  const projectTitle = conversation.projectId?.title || 'General Conversation';
  const isGroup = conversation.projectId || conversation.participants?.length > 2;
  const memberCount = conversation.participants?.length || 0;

  const displayName = isGroup 
    ? `Project: ${projectTitle}` 
    : otherParticipant?.name || 'Unknown';

  const onlineStatus = otherParticipant?.isOnline || false;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Join conversation room and mark messages as read
  useEffect(() => {
    if (socket && conversation._id && currentUserId) {
      socket.emit('joinConversation', conversation._id);
      socket.emit('mark_messages_read', {
        conversationId: conversation._id,
        userId: currentUserId
      });

      // Listen for typing events
      const handleTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId !== currentUserId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      };

      const handleStopTyping = (data) => {
        if (data.conversationId === conversation._id) {
          setIsTyping(false);
        }
      };

      socket.on('user_typing', handleTyping);
      socket.on('user_stop_typing', handleStopTyping);

      return () => {
        if (socket && conversation._id) {
          socket.emit('leaveConversation', conversation._id);
        }
        socket.off('user_typing', handleTyping);
        socket.off('user_stop_typing', handleStopTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [socket, conversation._id, currentUserId]);

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
        
        {!isGroup && otherParticipant && (
          <>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={otherParticipant.avatarUrl}
                fallback={(otherParticipant.name || '?').charAt(0)}
                size="medium"
              />
              {onlineStatus && <span className={styles.onlineDot} />}
            </div>
            <div className={styles.headerInfo}>
              <p className={styles.userName}>{otherParticipant.name}</p>
              <p className={styles.userRole}>
                {onlineStatus ? 'Active now' : 'Offline'}
              </p>
            </div>
          </>
        )}

        {isGroup && (
          <>
            <div className={styles.avatarWrapper}>
              <div className={styles.groupAvatar}>
                <Users size={20} />
              </div>
            </div>
            <div className={styles.headerInfo}>
              <p className={styles.userName}>{projectTitle}</p>
              <p className={styles.userRole}>
                {memberCount} member{memberCount !== 1 ? 's' : ''} &bull; Group Chat
              </p>
            </div>
          </>
        )}

        <div className={styles.headerActions}>
          <button className={styles.headerBtn} title="Audio Call" aria-label="Audio Call">
            <Phone size={18} />
          </button>
          <button className={styles.headerBtn} title="Video Call" aria-label="Video Call">
            <Video size={18} />
          </button>
          <button className={styles.headerBtn} title="More Options" aria-label="More Options">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Typing Indicator */}
      {isTyping && (
        <div className={styles.typingIndicator}>
          <Circle size={6} className={styles.typingDot} fill="currentColor" />
          <Circle size={6} className={styles.typingDot} fill="currentColor" />
          <Circle size={6} className={styles.typingDot} fill="currentColor" />
          <span className={styles.typingText}>
            {otherParticipant?.name?.split(' ')[0] || 'Someone'} is typing...
          </span>
        </div>
      )}

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
  socket: PropTypes.object,
};