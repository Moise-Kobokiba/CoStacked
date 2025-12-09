// src/components/auth/ChangePasswordModal.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, clearAuthMessages } from '../../features/auth/authSlice';

import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { PasswordInput } from '../shared/PasswordInput';
import { Input } from '../shared/Input';
import { Label } from '../shared/Label';
import { Loader2 } from 'lucide-react';
import styles from './ChangePasswordModal.module.css';
import PropTypes from 'prop-types';

export const ChangePasswordModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { status, error, successMessage } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  // Local state for client-side validation errors (e.g., passwords don't match)
  const [localError, setLocalError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const { currentPassword, newPassword, confirmPassword } = formData;

  // This effect ensures that old success/error messages are cleared when the modal is opened or closed.
  useEffect(() => {
    if (open) {
      dispatch(clearAuthMessages());
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLocalError('');
    }
  }, [open, dispatch]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStrengthChange = (strength) => {
    setIsPasswordValid(strength.isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearAuthMessages());

    // Client-side validation before hitting the API
    if (newPassword !== confirmPassword) {
      setLocalError("New passwords do not match.");
      return;
    }
    
    if (!isPasswordValid) {
        setLocalError("New password must be strong/valid (6-8 chars, mixed types).");
        return;
    }

    const resultAction = await dispatch(changePassword({ currentPassword, newPassword }));
    
    // If the API call was successful, close the modal after a short delay
    if (changePassword.fulfilled.match(resultAction)) {
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <header className={styles.header}>
        <h1 className={styles.title}>Change Your Password</h1>
      </header>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput id="currentPassword" name="currentPassword" value={currentPassword} onChange={handleChange} required autoComplete="current-password" />
        </div>
        <div className={styles.formGroup}>
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput 
            id="newPassword" 
            name="newPassword" 
            value={newPassword} 
            onChange={handleChange} 
            required 
            autoComplete="new-password"
            showStrengthMeter={true}
            onStrengthChange={handleStrengthChange}
            placeholder="6-8 characters"
         />
        </div>
        <div className={styles.formGroup}>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={handleChange} required autoComplete="new-password" placeholder="Re-enter new password" />
        </div>
        
        {/* Display feedback messages from local state and Redux */}
        {localError && <p className={styles.error}>{localError}</p>}
        {status === 'failed' && error && <p className={styles.error}>{error}</p>}
        {status === 'succeeded' && successMessage && <p className={styles.success}>{successMessage}</p>}

        <footer className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'loading'}>Cancel</Button>
          <Button type="submit" disabled={status === 'loading' || !!successMessage}>
            {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Update Password'}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
};

ChangePasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};