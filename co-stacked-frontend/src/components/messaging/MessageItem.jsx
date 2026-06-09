// src/components/messaging/MessageItem.jsx
import { Avatar } from '../shared/Avatar';
import styles from './ChatWindow.module.css';
import PropTypes from 'prop-types';

export const MessageItem = ({ msg, isMyMessage, sender }) => {
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
          <a
            href={msg.content}
            target="_blank"
            rel="noopener noreferrer"
            download={msg.metadata?.name || ''}
            className={styles.fileContent}
          >
            {msg.metadata?.name || 'Download File'}
          </a>
        );
      default:
        return <p className={styles.messageText}>{msg.content}</p>;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    if (!isMyMessage) return null;

    switch (msg.status) {
      case 'sent':
        return '✓'; // Single checkmark for sent
      case 'delivered':
        return '✓✓'; // Double checkmark for delivered
      case 'read':
        return '✓✓'; // Blue double checkmark for read (you can style this differently)
      default:
        return '⏳'; // Clock for sending/unknown
    }
  };

  const getStatusText = () => {
    if (!isMyMessage) return null;

    switch (msg.status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      default:
        return 'Sending...';
    }
  };

  return (
    <div className={`${styles.messageGroup} ${isMyMessage ? styles.myMessageGroup : styles.theirMessageGroup}`}>
      {!isMyMessage && (
        <Avatar
          src={sender?.avatarUrl}
          fallback={(sender?.name || '?').charAt(0)}
          size="small"
        />
      )}
      <div className={styles.messageWrapper}>
        <div className={`${styles.messageBubble} ${isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble}`}>
          {renderContent()}
        </div>
        <div className={`${styles.timestamp} ${isMyMessage ? styles.myTimestamp : styles.theirTimestamp}`}>
          {formatTimestamp(msg.createdAt)}
        </div>
        {isMyMessage && (
          <div className={styles.messageStatus}>
            <span className={`${styles.statusIndicator} ${msg.status === 'read' ? styles.readStatus : ''}`}>
              <span className={styles.statusIcon}>{getStatusIcon()}</span>
              <span className={styles.statusText}>{getStatusText()}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

MessageItem.propTypes = { msg: PropTypes.object.isRequired, isMyMessage: PropTypes.bool.isRequired };