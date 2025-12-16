// src/pages/AdminLoginPage.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin, clearAuthState } from '../features/auth/adminAuthSlice';
import styles from './AdminLoginPage.module.css';
import { Loader2 } from 'lucide-react';

/**
 * The login page for the administrative dashboard.
 * Handles form input, dispatches the login action to Redux,
 * and displays loading/error states from the global auth state.
 */
export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear any previous error messages when the component loads
  useEffect(() => {
    dispatch(clearAuthState());
  }, [dispatch]);

  // Handler for form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const credentials = { email, password };
    
    const resultAction = await dispatch(loginAdmin(credentials));
    
    // --- THIS IS THE SIMPLIFIED LOGIC ---
    // If the login is successful, navigate to the dashboard.
    // If it fails for any reason, the component will automatically
    // display the error message from the Redux state. No special logic is needed.
    if (loginAdmin.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>CoStacked Admin Panel</h1>
          <p className={styles.subtitle}>Please sign in to continue</p>
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
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              id="password" 
              type="password" 
              className={styles.input} 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              autoComplete="current-password" 
              required
            />
          </div>

          {status === 'failed' && error && <p className={styles.error}>{error}</p>}
          
          <button type="submit" className={styles.button} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 className={styles.loader} /> : "Sign In"}
          </button>
        </form>

        <div className={styles.footer} style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <div style={{marginBottom: '0.5rem'}}>
            <Link to="/forgot-password" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: '500'}}>
              Forgot your password?
            </Link>
          </div>
          <Link to="/register" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: '500'}}>
              Register a new admin account
          </Link>
        </div>
      </div>
    </div>
  );
};