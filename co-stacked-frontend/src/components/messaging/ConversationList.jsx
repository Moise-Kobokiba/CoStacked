// src/components/messaging/ConversationList.jsx

import { useState } from 'react';
import styles from './ConversationList.module.css';
import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

export const ConversationList = ({ conversations, selectedConversationId, onSelectConversation, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  // Group conversations by user
  const groupedConversations = conversations.reduce((acc, convo) => {
    const otherUser = convo.participants.find(p => p._id !== currentUserId);
    if (!otherUser) return acc;

    const userId = otherUser._id;
    if (!acc[userId]) {
      acc[userId] = {
        user: otherUser,
        conversations: []
      };
    }
    acc[userId].conversations.push(convo);
    return acc;
  }, {});

  const toggleUser = (userId) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredGroups = Object.values(groupedConversations).filter((group) => {
    const user = group.user;
    const matchesUser = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProjects = group.conversations.some(convo => {
      const projectTitle = convo.projectId?.title || 'General Conversation';
      return projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return matchesUser || matchesProjects;
  });

  return (
    <div className={styles.container}>
      {/* Header with logo */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <svg className={styles.logoIcon} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>
        <h1 className={styles.appTitle}>CoStacked</h1>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Conversations Heading */}
      <div className={styles.conversationsHeading}>
        <h2 className={styles.heading}>Conversations</h2>
      </div>

      {/* Conversation List */}
      <div className={styles.list}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const user = group.user;
            const isExpanded = expandedUsers.has(user._id);

            return (
              <div key={user._id} className={styles.userGroup}>
                {/* User Header */}
                <button
                  onClick={() => toggleUser(user._id)}
                  className={styles.userHeader}
                >
                  <Avatar
                    src={user.avatarUrl}
                    fallback={user.name.charAt(0)}
                    size="small"
                  />
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{user.name}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className={styles.chevron} size={20} />
                  ) : (
                    <ChevronRight className={styles.chevron} size={20} />
                  )}
                </button>

                {/* User's Projects */}
                {isExpanded && (
                  <div className={styles.projectsContainer}>
                    {group.conversations.map((convo) => {
                      const projectTitle = convo.projectId?.title || 'General Conversation';
                      const isSelected = convo._id === selectedConversationId;

                      return (
                        <button
                          key={convo._id}
                          onClick={() => onSelectConversation(convo._id)}
                          className={`${styles.projectItem} ${isSelected ? styles.selected : ''}`}
                        >
                          <div className={styles.projectContent}>
                            <div className={styles.projectHeader}>
                              <span className={styles.projectTitle}>{projectTitle}</span>
                            </div>
                            <span className={styles.projectSubtitle}>Click to view conversation</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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