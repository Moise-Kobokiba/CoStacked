// src/components/messaging/ChatSidebar.jsx

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';
import { 
  Bell, BellOff, ShieldAlert, UserPlus, Paperclip, 
  FileText, Image, Video, Music, Clock, MoreVertical,
  Crown, Shield, Settings
} from 'lucide-react';
import { InviteToGroupModal } from './InviteToGroupModal';
import { BlockUserModal } from './BlockUserModal';
import styles from './ChatSidebar.module.css';

const MOCK_SHARED_FILES = [
  { id: '1', name: 'Design_System_Guidelines.pdf', type: 'pdf', size: '4.2 MB', date: '2024-11-15' },
  { id: '2', name: 'Sprint_Retro_Notes.docx', type: 'doc', size: '2.8 MB', date: '2024-11-12' },
  { id: '3', name: 'Q4_Roadmap_Final.pptx', type: 'ppt', size: '8.1 MB', date: '2024-10-28' },
  { id: '4', name: 'User_Interview_Recording.mp3', type: 'audio', size: '12.5 MB', date: '2024-10-15' },
];

const MOCK_GROUP_MEMBERS = [
  { _id: 'u1', name: 'Alex Johnson', avatarUrl: null, role: 'admin', discipline: 'Product Manager' },
  { _id: 'u2', name: 'Sarah Chen', avatarUrl: null, role: 'member', discipline: 'UI/UX Designer' },
  { _id: 'u3', name: 'Marcus Williams', avatarUrl: null, role: 'member', discipline: 'Full-Stack Developer' },
  { _id: 'u4', name: 'Priya Patel', avatarUrl: null, role: 'member', discipline: 'Data Scientist' },
];

const getFileIcon = (type) => {
  switch (type) {
    case 'pdf': return <FileText size={18} />;
    case 'doc': return <FileText size={18} />;
    case 'ppt': return <FileText size={18} />;
    case 'audio': return <Music size={18} />;
    case 'image': return <Image size={18} />;
    case 'video': return <Video size={18} />;
    default: return <Paperclip size={18} />;
  }
};

const getFileColor = (type) => {
  switch (type) {
    case 'pdf': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
    case 'doc': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
    case 'ppt': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
    case 'audio': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' };
    case 'image': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
    case 'video': return { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' };
    default: return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ChatSidebar = ({ 
  conversation, 
  currentUserId,
  onMuteToggle,
  onBlockUser 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const isGroup = conversation?.projectId || conversation?.participants?.length > 2;
  const otherParticipant = conversation?.participants?.find(p => p._id !== currentUserId);
  const projectTitle = conversation?.projectId?.title || 'General Conversation';
  const memberCount = conversation?.participants?.length || 0;

  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
    onMuteToggle?.(!isMuted);
  };

  const handleBlockClick = () => {
    setShowBlockModal(true);
  };

  const handleBlockConfirm = () => {
    setShowBlockModal(false);
    onBlockUser?.();
  };

  if (!conversation) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Direct Message Profile View */}
      {!isGroup && otherParticipant && (
        <div className={styles.profileSection}>
          <div className={styles.profileCard}>
            <Avatar 
              src={otherParticipant.avatarUrl} 
              fallback={(otherParticipant.name || '?').charAt(0)}
              size="xlarge"
            />
            <div className={styles.onlineBadge} />
            <h3 className={styles.profileName}>{otherParticipant.name}</h3>
            {otherParticipant.headline && (
              <p className={styles.profileHeadline}>{otherParticipant.headline}</p>
            )}
            {otherParticipant.discipline && (
              <span className={styles.disciplineTag}>{otherParticipant.discipline}</span>
            )}
            <button className={styles.viewProfileBtn}>
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Group Members Section */}
      {isGroup && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Group Members ({memberCount})</h3>
            <button 
              className={styles.addMemberBtn}
              onClick={() => setShowInviteModal(true)}
              title="Add member"
            >
              <UserPlus size={18} />
            </button>
          </div>
          <div className={styles.memberList}>
            {MOCK_GROUP_MEMBERS.map(member => (
              <div key={member._id} className={styles.memberItem}>
                <Avatar 
                  src={member.avatarUrl} 
                  fallback={member.name.charAt(0)}
                  size="medium"
                />
                <div className={styles.memberInfo}>
                  <div className={styles.memberNameRow}>
                    <span className={styles.memberName}>{member.name}</span>
                    {member.role === 'admin' && (
                      <span className={styles.adminBadge}>
                        <Crown size={10} />
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className={styles.memberDiscipline}>{member.discipline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Files Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Shared Files</h3>
          <button className={styles.seeAllBtn}>See All</button>
        </div>
        <div className={styles.fileList}>
          {MOCK_SHARED_FILES.map(file => {
            const colorInfo = getFileColor(file.type);
            return (
              <div key={file.id} className={styles.fileItem}>
                <div 
                  className={styles.fileIcon} 
                  style={{ backgroundColor: colorInfo.bg, color: colorInfo.color }}
                >
                  {getFileIcon(file.type)}
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileMeta}>{file.size} &bull; {formatDate(file.date)}</span>
                </div>
                <button className={styles.fileMoreBtn}>
                  <MoreVertical size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Conversation Settings</h3>
        
        <div className={styles.settingItem} onClick={handleMuteToggle}>
          <div className={styles.settingIcon}>
            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
          </div>
          <span className={styles.settingLabel}>Mute Notifications</span>
          <button 
            className={`${styles.toggleSwitch} ${isMuted ? styles.toggleActive : ''}`}
            onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
            role="switch"
            aria-checked={isMuted}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div 
          className={`${styles.settingItem} ${styles.destructiveItem}`} 
          onClick={handleBlockClick}
        >
          <div className={`${styles.settingIcon} ${styles.destructiveIcon}`}>
            <ShieldAlert size={18} />
          </div>
          <span className={styles.settingLabel}>
            {isGroup ? 'Leave Group' : 'Block User'}
          </span>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteToGroupModal 
          onClose={() => setShowInviteModal(false)}
          groupName={projectTitle}
        />
      )}

      {showBlockModal && (
        <BlockUserModal 
          userName={otherParticipant?.name || 'this user'}
          isGroup={isGroup}
          onClose={() => setShowBlockModal(false)}
          onConfirm={handleBlockConfirm}
        />
      )}
    </div>
  );
};

ChatSidebar.propTypes = {
  conversation: PropTypes.object,
  currentUserId: PropTypes.string.isRequired,
  onMuteToggle: PropTypes.func,
  onBlockUser: PropTypes.func,
};