// src/pages/LoginPage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthMessages } from '../features/auth/authSlice';

import { PasswordInput } from '../components/shared/PasswordInput';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Label } from '../components/shared/Label';
import { Button } from '../components/shared/Button';
import { Loader2, Github } from 'lucide-react';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); // 1. Get the current location

  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Determine the redirect path. If a user was sent here from a protected
  //    route, 'location.state.from' will exist. Otherwise, default to '/dashboard'.
  const from = location.state?.from?.pathname || '/dashboard';

  // Clear any old error messages when the component first loads
  useEffect(() => {
    dispatch(clearAuthMessages());
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const credentials = { email, password };

    const resultAction = await dispatch(loginUser(credentials));
    
    if (loginUser.fulfilled.match(resultAction)) {
      // 3. On successful login, navigate to the 'from' path.
      navigate(from, { replace: true });
    } else if (loginUser.rejected.match(resultAction) && resultAction.payload?.emailNotVerified) {
      // If the email isn't verified, redirect to the verify page
      navigate('/verify-email');
    }
  };

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/github`;
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Welcome Back!</h1>
          <p className={styles.description}>Enter your credentials to access your account.</p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <div className={styles.passwordHeader}>
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <PasswordInput 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                showStrengthMeter={false}
              />
            </div>

            {status === 'failed' && error && <p className={styles.error}>{error}</p>}
            
            <Button type="submit" variant="primary" disabled={status === 'loading'}>
              {status === 'loading' ? (<><Loader2 className="animate-spin mr-2" /> Logging in...</>) : ( "Login" )}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGitHubLogin}
            className={styles.githubButton}
          >
            <Github size={20} style={{ marginRight: '8px' }} />
            Continue with GitHub
          </Button>

          <div className={styles.footer}>
            <p>Don't have an account?{' '}<Link to="/signup" className={styles.link}>Sign Up</Link></p>
          </div>
        </div>
      </Card>
    </div>
  );
};