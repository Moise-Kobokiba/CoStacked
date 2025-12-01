// src/pages/AdminRegisterPage.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin, clearAuthState } from '../features/auth/adminAuthSlice'; 
import styles from './AdminLoginPage.module.css';
import { Loader2 } from 'lucide-react';

export const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, error, successMessage } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    secretKey: '',
  });
  
  const { name, email, password, secretKey } = formData;

  useEffect(() => {
    dispatch(clearAuthState());
    return () => { dispatch(clearAuthState()); }
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const adminData = {
        name,
        email,
        password,
        secretKey,
        role: 'admin'
    };
    
    const resultAction = await dispatch(registerAdmin(adminData));
    
    // --- THIS IS THE FIX ---
    // On successful registration, redirect to the new email verification page.
    if (registerAdmin.fulfilled.match(resultAction)) {
      navigate('/verify-email');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Register New Admin</h1>
          <p className={styles.subtitle}>Use the secret key to create an account</p>
        </header>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Full Name</label>
            <input id="name" name="name" type="text" className={styles.input} value={name} onChange={handleChange} required autoComplete="name" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input id="email" name="email" type="email" className={styles.input} value={email} onChange={handleChange} required autoComplete="email" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input id="password" name="password" type="password" className={styles.input} value={password} onChange={handleChange} required minLength="6" autoComplete="new-password" />
          </div>
           <div className={styles.formGroup}>
            <label htmlFor="secretKey" className={styles.label}>Secret Key</label>
            <input id="secretKey" name="secretKey" type="password" className={styles.input} value={secretKey} onChange={handleChange} required />
          </div>

          {status === 'failed' && error && <p className={styles.error}>{error}</p>}
          {/* A success message is not needed here as the user is immediately redirected */}
          
          <button type="submit" className={styles.button} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 className={styles.loader} /> : "Register Account"}
          </button>
        </form>

        <div className={styles.footer} style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <Link to="/login" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: '500'}}>
              Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};