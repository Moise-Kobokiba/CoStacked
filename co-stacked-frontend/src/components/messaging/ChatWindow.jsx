// src/components/messaging/ChatWindow.jsx

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChatWindow.module.css';
import { Avatar } from '../shared/Avatar';
import { 
  ChevronLeft, Phone, Video, MoreVertical, 
  Users, Circle, X, MessageCircle, Trash2, FileText,
  Settings, PhoneOff, VideoOff, User, UserPlus
} from 'lucide-react';
import PropTypes from 'prop-types';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export const ChatWindow = ({ conversation, messages = [], currentUserId, onBack, socket }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null); // 'audio' | 'video' | null
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const typingTimeoutRef = useRef(null);
  const contextMenuRef = useRef(null);

  const otherParticipant = conversation?.participants?.find(p => p._id !== currentUserId);
  const projectTitle = conversation?.projectId?.title || 'General Conversation';
  const isGroup = conversation?.projectId || conversation?.participants?.length > 2;
  const memberCount = conversation?.participants?.length || 0;
  const participants = conversation?.participants || [];

  const displayName = isGroup 
    ? `Project: ${projectTitle}` 
    : otherParticipant?.name || 'Unknown';

  const onlineStatus = otherParticipant?.isOnline || false;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (socket && conversation?._id && currentUserId) {
      socket.emit('joinConversation', conversation._id);
      socket.emit('mark_messages_read', {
        conversationId: conversation._id,
        userId: currentUserId
      });

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
  }, [socket, conversation?._id, currentUserId]);

  // Context menu options
  const contextMenuOptions = [
    { icon: Trash2, label: 'Clear Chat', action: () => { console.log('Clear chat'); setShowContextMenu(false); } },
    { icon: FileText, label: 'View Files', action: () => { console.log('View files'); setShowContextMenu(false); } },
    { icon: Settings, label: 'Conversation Settings', action: () => { console.log('Settings'); setShowContextMenu(false); } },
    { icon: User, label: 'View Profile', action: () => { setShowContextMenu(false); }, link: otherParticipant?._id ? `/users/${otherParticipant._id}` : '#' },
  ];

  // Call modal component
  const CallModal = ({ type }) => (
    <div className={styles.callOverlay} onClick={() => setShowCallModal(null)}>
      <div className={styles.callModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.callCloseBtn} onClick={() => setShowCallModal(null)}>
          <X size={24} />
        </button>
        <div className={styles.callAvatar}>
          <Avatar
            src={otherParticipant?.avatarUrl}
            fallback={(otherParticipant?.name || '?').charAt(0)}
            size="xlarge"
          />
        </div>
        <h3 className={styles.callTitle}>
          {type === 'audio' ? 'Audio Call' : 'Video Call'} with {otherParticipant?.name || 'User'}
        </h3>
        <p className={styles.callStatus}>Calling...</p>
        <div className={styles.callActions}>
          <button className={styles.callEndBtn} onClick={() => setShowCallModal(null)}>
            {type === 'video' ? <VideoOff size={24} /> : <PhoneOff size={24} />}
          </button>
        </div>
      </div>
    </div>
  );

  if (!conversation) return null;

  return (
    <div className={styles.container}>
      {/* Call Modal */}
      {showCallModal && <CallModal type={showCallModal} />}

      {/* Group Details Modal */}
      {showGroupDetails && (
        <div className={styles.callOverlay} onClick={() => setShowGroupDetails(false)}>
          <div className={styles.groupDetailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.groupDetailsHeader}>
              <h3>Group Members ({memberCount})</h3>
              <button className={styles.callCloseBtn} onClick={() => setShowGroupDetails(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.groupMembersList}>
              {participants.map((p) => (
                <Link key={p._id} to={`/users/${p._id}`} className={styles.groupMemberItem} onClick={() => setShowGroupDetails(false)}>
                  <Avatar
                    src={p.avatarUrl}
                    fallback={(p.name || '?').charAt(0)}
                    size="medium"
                  />
                  <div className={styles.groupMemberInfo}>
                    <span className={styles.groupMemberName}>{p.name || 'Unknown'}</span>
                    <span className={styles.groupMemberRole}>{p.headline || p.role || 'Member'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className={styles.callOverlay} onClick={() => setShowNewChatModal(false)}>
          <div className={styles.newChatModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.groupDetailsHeader}>
              <h3>New Conversation</h3>
              <button className={styles.callCloseBtn} onClick={() => setShowNewChatModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.newChatSearch}>
              <input
                type="text"
                placeholder="Search users to message..."
                className={styles.newChatInput}
                autoFocus
              />
            </div>
            <p className={styles.newChatHint}>Type a name to search for users in your network.</p>
          </div>
        </div>
      )}

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
            <Link to={`/users/${otherParticipant._id}`} className={styles.avatarWrapper}>
              <Avatar
                src={otherParticipant.avatarUrl}
                fallback={(otherParticipant.name || '?').charAt(0)}
                size="medium"
              />
              {onlineStatus && <span className={styles.onlineDot} />}
            </Link>
            <Link to={`/users/${otherParticipant._id}`} className={styles.headerInfo}>
              <p className={styles.userName}>{otherParticipant.name}</p>
              <p className={styles.userRole}>
                {onlineStatus ? 'Active now' : 'Offline'}
              </p>
            </Link>
          </>
        )}

        {isGroup && (
          <>
            <button className={styles.avatarWrapper} onClick={() => setShowGroupDetails(true)} title="View group details">
              <div className={styles.groupAvatar}>
                <Users size={20} />
              </div>
            </button>
            <button className={styles.headerInfo} onClick={() => setShowGroupDetails(true)}>
              <p className={styles.userName}>{projectTitle}</p>
              <p className={styles.userRole}>
                {memberCount} member{memberCount !== 1 ? 's' : ''} &bull; Group Chat
              </p>
            </button>
          </>
        )}

        <div className={styles.headerActions}>
          <button
            className={styles.headerBtn}
            title="Audio Call"
            aria-label="Audio Call"
            onClick={() => setShowCallModal('audio')}
          >
            <Phone size={18} />
          </button>
          <button
            className={styles.headerBtn}
            title="Video Call"
            aria-label="Video Call"
            onClick={() => setShowCallModal('video')}
          >
            <Video size={18} />
          </button>
          <div className={styles.contextMenuWrapper} ref={contextMenuRef}>
            <button
              className={styles.headerBtn}
              title="More Options"
              aria-label="More Options"
              onClick={() => setShowContextMenu(!showContextMenu)}
            >
              <MoreVertical size={18} />
            </button>
            {showContextMenu && (
              <div className={styles.contextMenu}>
                {contextMenuOptions.map((opt, i) => (
                  opt.link ? (
                    <Link key={i} to={opt.link} className={styles.contextMenuItem} onClick={opt.action}>
                      <opt.icon size={16} />
                      <span>{opt.label}</span>
                    </Link>
                  ) : (
                    <button key={i} className={styles.contextMenuItem} onClick={opt.action}>
                      <opt.icon size={16} />
                      <span>{opt.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
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