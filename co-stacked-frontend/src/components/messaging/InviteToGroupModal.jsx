// src/components/messaging/InviteToGroupModal.jsx

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '../shared/Avatar';
import { Search, X, Check, Send, Loader2 } from 'lucide-react';
import styles from './InviteToGroupModal.module.css';

const SUGGESTED_CANDIDATES = [
  { _id: 'c1', name: 'Sofia Rodriguez', avatarUrl: null, discipline: 'Machine Learning Engineer' },
  { _id: 'c2', name: 'James Mitchell', avatarUrl: null, discipline: 'DevOps & Security Lead' },
  { _id: 'c3', name: 'Emily Parker', avatarUrl: null, discipline: 'UX Researcher' },
  { _id: 'c4', name: 'David Kim', avatarUrl: null, discipline: 'Backend Architect' },
  { _id: 'c5', name: 'Aisha Johnson', avatarUrl: null, discipline: 'Frontend Developer' },
  { _id: 'c6', name: 'Robert Fischer', avatarUrl: null, discipline: 'Data Engineer' },
];

export const InviteToGroupModal = ({ onClose, groupName, onSendInvitations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return SUGGESTED_CANDIDATES;
    const q = searchQuery.toLowerCase();
    return SUGGESTED_CANDIDATES.filter(
      c => c.name.toLowerCase().includes(q) || c.discipline.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) return;
    setIsSending(true);
    try {
      await onSendInvitations?.(selectedUsers);
      onClose();
    } catch (e) {
      console.error('Failed to send invitations:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Invite to Group</h2>
          <p className={styles.subtitle}>Add collaborators to "{groupName}"</p>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.candidateList}>
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map(candidate => {
              const isSelected = selectedUsers.includes(candidate._id);
              return (
                <div
                  key={candidate._id}
                  className={`${styles.candidateItem} ${isSelected ? styles.selectedItem : ''}`}
                  onClick={() => toggleUser(candidate._id)}
                >
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUser(candidate._id)}
                      className={styles.checkbox}
                    />
                    <span className={`${styles.customCheckbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <Check size={14} />}
                    </span>
                  </label>
                  <Avatar
                    src={candidate.avatarUrl}
                    fallback={candidate.name.charAt(0)}
                    size="medium"
                  />
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateName}>{candidate.name}</span>
                    <span className={styles.candidateDiscipline}>{candidate.discipline}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>
              <p>No team members found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.selectedCount}>
            Selected: <span className={styles.countNumber}>{selectedUsers.length}</span>
          </div>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.sendBtn}
              onClick={handleSendInvitations}
              disabled={selectedUsers.length === 0 || isSending}
            >
              {isSending ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <Send size={18} />
              )}
              Send Invitations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

InviteToGroupModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  groupName: PropTypes.string,
  onSendInvitations: PropTypes.func,
};