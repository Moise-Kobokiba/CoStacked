// src/components/shared/ConfirmationModal.jsx

import { Dialog } from './Dialog';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import styles from './ConfirmationModal.module.css';
import PropTypes from 'prop-types';

export const ConfirmationModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  isDestructive = false, // <-- 1. ADD a new prop to control the button style
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={32} className={styles.icon} />
        </div>
        <div className={styles.textWrapper}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
        </div>
      </div>
      <footer className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {/* --- 2. THIS IS THE FIX --- */}
        {/* 
          - Remove the custom className.
          - Conditionally set the 'variant' prop. If isDestructive is true,
            the button will be red. Otherwise, it will be the primary color.
        */}
        <Button variant={isDestructive ? "destructive" : "primary"} onClick={onConfirm}>
          {confirmText}
        </Button>
      </footer>
    </Dialog>
  );
};

// --- 3. ADD PropTypes for validation ---
ConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  isDestructive: PropTypes.bool,
};