// src/pages/AdminForgotPasswordPage.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotAdminPassword } from '../features/auth/adminAuthSlice';
import styles from './AdminLoginPage.module.css';
import { Loader2 } from 'lucide-react';

export const AdminForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { status, error, successMessage } = useSelector(state => state.auth);

  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(forgotAdminPassword(email));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Forgot Admin Password?</h1>
          <p className={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your admin password.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {status === 'failed' && error && <p className={styles.error}>{error}</p>}
          {status === 'succeeded' && successMessage && <p className={styles.success}>{successMessage}</p>}

          <button type="submit" className={styles.button} disabled={status === 'loading' || !!successMessage}>
            {status === 'loading' ? <Loader2 className={styles.loader} /> : "Send Reset Link"}
          </button>
        </form>

        <div className={styles.footer} style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <Link to="/" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: '500'}}>
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};