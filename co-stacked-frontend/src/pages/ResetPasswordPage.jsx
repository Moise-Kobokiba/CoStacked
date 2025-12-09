// src/pages/ResetPasswordPage.jsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../features/auth/authSlice'; // We will create this

import { PasswordInput } from '../components/shared/PasswordInput';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Label } from '../components/shared/Label';
import { Button } from '../components/shared/Button';
import { Loader2 } from 'lucide-react';
import styles from './LoginPage.module.css';

export const ResetPasswordPage = () => {
  const { token } = useParams(); // Get the token from the URL
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error, successMessage } = useSelector(state => state.auth);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const handleStrengthChange = (strength) => {
    setIsPasswordValid(strength.isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(""); // Clear previous errors

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (!isPasswordValid) {
        setLocalError("Password must be weak/invalid. Please follow the security tips.");
        return;
    }

    const resultAction = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(resultAction)) {
      setTimeout(() => navigate('/login'), 2500);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Reset Your Password</h1>
          <p className={styles.description}>Enter your new password below.</p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="password">New Password</Label>
              <PasswordInput 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                showStrengthMeter={true}
                showSecurityTip={true}
                onStrengthChange={handleStrengthChange}
                placeholder="6-8 characters"
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Re-enter new password"
              />
            </div>
            
            {localError && <p className={styles.error}>{localError}</p>}
            {status === 'failed' && error && <p className={styles.error}>{error}</p>}
            {status === 'succeeded' && successMessage && <p className={styles.success}>{successMessage}</p>}
            
            <Button type="submit" variant="primary" disabled={status === 'loading' || !!successMessage}>
              {status === 'loading' ? (<><Loader2 className="animate-spin mr-2" /> Saving...</>) : ( "Reset Password" )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};