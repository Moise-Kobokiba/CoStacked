// src/components/messaging/ConversationList.jsx

import styles from './ConversationList.module.css';
import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';

export const ConversationList = ({ conversations, selectedConversationId, onSelectConversation, currentUserId }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Conversations</h2>
      <div className={styles.list}>
        {conversations.length > 0 ? (
          conversations.map((convo) => {
            const otherUser = convo.participants.find(p => p._id !== currentUserId);
            const projectTitle = convo.projectId?.title || 'General Conversation';
            const isSelected = convo._id === selectedConversationId;

            if (!otherUser) return null;

            return (
              <button
                key={convo._id}
                className={`${styles.convoItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelectConversation(convo._id)}
              >
                <Avatar 
                  src={otherUser.avatarUrl} 
                  fallback={otherUser.name.charAt(0)}
                />
                <div className={styles.convoDetails}>
                  {/* --- THIS IS THE UPDATE --- */}
                  <h4 className={styles.convoTitle}>
                    <span className={styles.userName}>{otherUser.name}</span>
                    <span className={styles.projectName}> - "{projectTitle}"</span>
                  </h4>
                  <p className={styles.convoSubtitle}>
                    Click to view conversation
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <p className={styles.emptyMessage}>You have no conversations yet.</p>
        )}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.array.isRequired,
  selectedConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
};