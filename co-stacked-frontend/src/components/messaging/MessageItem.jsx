// src/components/messaging/MessageItem.jsx
import styles from './ChatWindow.module.css';
import PropTypes from 'prop-types';

export const MessageItem = ({ msg, isMyMessage }) => {
  const renderContent = () => {
    switch (msg.type) {
      case 'text':
        return <p className={styles.messageText}>{msg.content}</p>;
      case 'image':
        return <img src={msg.content} alt="User upload" className={styles.imageContent} />;
      case 'audio':
        return <audio controls src={msg.content} className={styles.audioContent}></audio>;
      case 'file':
        return (
          <a href={msg.content} target="_blank" rel="noopener noreferrer" className={styles.fileContent}>
            {msg.metadata?.name || 'Download File'}
          </a>
        );
      default:
        return <p className={styles.messageText}>{msg.content}</p>;
    }
  };

  return (
    <div className={`${styles.messageRow} ${isMyMessage ? styles.myMessageRow : styles.theirMessageRow}`}>
      <div className={`${styles.messageBubble} ${isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble}`}>
        {renderContent()}
      </div>
    </div>
  );
};

MessageItem.propTypes = { msg: PropTypes.object.isRequired, isMyMessage: PropTypes.bool.isRequired };