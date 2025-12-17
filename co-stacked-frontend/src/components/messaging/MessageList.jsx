// src/components/messaging/MessageList.jsx
import { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import styles from './ChatWindow.module.css';
import PropTypes from 'prop-types';

export const MessageList = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.messageList}>
      {messages.map(msg => (
        <MessageItem
          key={msg._id}
          msg={msg}
          isMyMessage={msg.sender?._id === currentUserId}
          sender={msg.sender}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = { messages: PropTypes.array.isRequired, currentUserId: PropTypes.string.isRequired };