// src/pages/AdminVerifyEmailPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { verifyAdminEmail, clearAuthState } from '../features/auth/adminAuthSlice';
import styles from './AdminLoginPage.module.css'; // Reuse styles for consistency
import { Loader2 } from 'lucide-react';

export const AdminVerifyEmailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get the necessary state from the Redux auth slice
  const { status, error, successMessage, unverifiedEmail: reduxUnverifiedEmail } = useSelector(state => state.auth);

  // Use Redux state or fallback to localStorage for persistence across page refreshes
  const unverifiedEmail = reduxUnverifiedEmail || localStorage.getItem('admin-unverified-email');

  const [token, setToken] = useState('');

  // This effect protects the route. If a user lands here without having just
  // registered, it redirects them to the registration page.
  useEffect(() => {
    if (!unverifiedEmail) {
      navigate('/register');
    }
    // Clear any previous messages when the component loads
    return () => {
        dispatch(clearAuthState());
    }
  }, [unverifiedEmail, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !unverifiedEmail) return;

    const resultAction = await dispatch(verifyAdminEmail({ email: unverifiedEmail, token }));

    if (verifyAdminEmail.fulfilled.match(resultAction)) {
      // Clear the unverified email from localStorage on successful verification
      localStorage.removeItem('admin-unverified-email');
      // On success, wait a moment for the user to read the message, then redirect to login.
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Verify Your Admin Account</h1>
          <p className={styles.subtitle}>
            A 6-digit verification code has been sent to <strong>{unverifiedEmail}</strong>.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="token" className={styles.label}>Verification Code</label>
            <input 
              id="token" 
              type="text"
              className={styles.input}
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              maxLength="6"
              required 
            />
          </div>

          {status === 'failed' && error && <p className={styles.error}>{error}</p>}
          {status === 'succeeded' && successMessage && <p className={styles.success}>{successMessage}</p>}
          
          <button type="submit" className={styles.button} disabled={status === 'loading' || !!successMessage}>
            {status === 'loading' ? <Loader2 className={styles.loader} /> : "Verify Account"}
          </button>
        </form>

         <div className={styles.footer} style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <Link to="/register" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: '500'}}>
              Go back to Register
          </Link>
        </div>
      </div>
    </div>
  );
};