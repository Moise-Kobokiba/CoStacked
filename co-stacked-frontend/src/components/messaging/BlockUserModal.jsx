// src/components/messaging/BlockUserModal.jsx

import { useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import styles from './BlockUserModal.module.css';

export const BlockUserModal = ({ userName, isGroup, onClose, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  const handleInitialBlock = () => {
    if (isGroup) {
      // For groups, just confirm directly
      handleConfirm();
    } else {
      setShowConfirmInput(true);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm?.();
    } catch (e) {
      console.error('Block action failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const canConfirm = isGroup || confirmText.trim().toLowerCase() === 'block';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const title = isGroup ? 'Leave Group' : 'Block User';
  const description = isGroup
    ? `Are you sure you want to leave this group? You'll need a new invitation to rejoin.`
    : `This will prevent ${userName} from sending you messages, connection requests, or viewing your full profile. You can unblock them later from Settings.`;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <ShieldAlert size={24} />
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={isProcessing} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>

          {!isGroup && showConfirmInput && (
            <div className={styles.confirmSection}>
              <p className={styles.confirmLabel}>
                Type <strong>"block"</strong> to confirm
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type "block" here...'
                className={styles.confirmInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirm && !isProcessing) {
                    handleConfirm();
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleInitialBlock}
            disabled={isProcessing || (!isGroup && showConfirmInput && !canConfirm)}
          >
            {isProcessing ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : isGroup ? (
              'Leave Group'
            ) : (
              `Block ${userName.split(' ')[0]}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

BlockUserModal.propTypes = {
  userName: PropTypes.string,
  isGroup: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};