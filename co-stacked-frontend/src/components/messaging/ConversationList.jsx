// src/components/messaging/ConversationList.jsx

import { useState, useMemo } from 'react';
import styles from './ConversationList.module.css';
import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';
import { Search, PlusSquare, Users, MessageSquare, Circle } from 'lucide-react';

export const ConversationList = ({ conversations, selectedConversationId, onSelectConversation, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Group conversations into Direct Messages and Project Groups
  const { directMessages, projectGroups } = useMemo(() => {
    const dm = [];
    const pg = [];

    conversations.forEach(convo => {
      const otherUser = convo.participants.find(p => p._id !== currentUserId);
      const isGroup = convo.projectId || convo.participants?.length > 2;
      const projectTitle = convo.projectId?.title || 'General Conversation';
      const lastMessage = convo.lastMessage || null;

      const item = {
        _id: convo._id,
        otherUser,
        projectTitle,
        isGroup,
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage?.createdAt || convo.updatedAt,
        unreadCount: convo.unreadCount || 0,
        isOnline: otherUser?.isOnline || false,
      };

      if (isGroup) {
        pg.push(item);
      } else if (otherUser) {
        dm.push(item);
      }
    });

    return { directMessages: dm, projectGroups: pg };
  }, [conversations, currentUserId]);

  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.otherUser) {
        return item.otherUser.name.toLowerCase().includes(q);
      }
      return item.projectTitle.toLowerCase().includes(q);
    });
  };

  const filteredDMs = filterItems(directMessages);
  const filteredGroups = filterItems(projectGroups);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversationItem = (item) => (
    <button
      key={item._id}
      onClick={() => onSelectConversation(item._id)}
      className={`${styles.conversationItem} ${item._id === selectedConversationId ? styles.selected : ''}`}
    >
      <div className={styles.itemAvatar}>
        {item.isGroup ? (
          <div className={styles.groupIcon}>
            <Users size={20} />
          </div>
        ) : (
          <>
            <Avatar
              src={item.otherUser?.avatarUrl}
              fallback={(item.otherUser?.name || '?').charAt(0)}
              size="medium"
            />
            {item.isOnline && <span className={styles.onlineStatusDot} />}
          </>
        )}
      </div>

      <div className={styles.itemContent}>
        <div className={styles.itemTopRow}>
          <span className={styles.itemName}>
            {item.isGroup ? item.projectTitle : item.otherUser?.name || 'Unknown'}
          </span>
          <span className={styles.itemTime}>{formatTime(item.lastMessageTime)}</span>
        </div>
        <div className={styles.itemBottomRow}>
          <span className={styles.itemSnippet}>
            {item.lastMessage || 'No messages yet'}
          </span>
          {item.unreadCount > 0 && (
            <span className={styles.unreadBadge}>{item.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className={styles.container}>
      {/* Search Bar + Compose */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.composeBtn} title="Compose New Message" aria-label="Compose New Message">
          <PlusSquare size={20} />
        </button>
      </div>

      {/* Conversation List */}
      <div className={styles.list}>
        {filteredDMs.length > 0 && (
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <MessageSquare size={14} />
              <span>Direct Messages</span>
            </div>
            {filteredDMs.map(renderConversationItem)}
          </div>
        )}

        {filteredGroups.length > 0 && (
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <Users size={14} />
              <span>Project Groups</span>
            </div>
            {filteredGroups.map(renderConversationItem)}
          </div>
        )}

        {filteredDMs.length === 0 && filteredGroups.length === 0 && (
          <div className={styles.emptyMessage}>
            <MessageSquare size={32} className={styles.emptyIcon} />
            <p>{searchQuery ? 'No conversations found' : 'You have no conversations yet.'}</p>
            {!searchQuery && (
              <p className={styles.emptyHint}>Connect with team members to start messaging.</p>
            )}
          </div>
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