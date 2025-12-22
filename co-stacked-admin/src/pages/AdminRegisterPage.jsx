// src/pages/AdminRegisterPage.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin, clearAuthState } from '../features/auth/adminAuthSlice';
import { PasswordInput } from '../components/shared/PasswordInput';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Label } from '../components/shared/Label';
import { Button } from '../components/shared/Button';
import { Loader2 } from 'lucide-react';
import styles from './AdminLoginPage.module.css';

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
      <Card className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Create Admin Account</h1>
          <p className={styles.description}>Use the secret key to register a new admin account.</p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                required
                showStrengthMeter={false}
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                name="secretKey"
                type="password"
                value={secretKey}
                onChange={handleChange}
                required
              />
            </div>

            {status === 'failed' && error && <p className={styles.error}>{error}</p>}

            <Button type="submit" variant="primary" disabled={status === 'loading'}>
              {status === 'loading' ? (<><Loader2 className="animate-spin mr-2" /> Registering...</>) : ( "Register Account" )}
            </Button>
          </form>

          <div className={styles.footer}>
            <p>Already have an account?{' '}<Link to="/login" className={styles.link}>Sign In</Link></p>
          </div>
        </div>
      </Card>
    </div>
  );
};