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

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const handleLinkedInLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/linkedin`;
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
            <span>Or</span>
          </div>

          <div className={styles.socialButtons}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGitHubLogin}
              className={styles.githubButton}
            >
              <Github size={20} />
              Continue with GitHub
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className={styles.googleButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            {/* LinkedIn OAuth temporarily disabled - requires LinkedIn approval */}
            {/* <Button
              type="button"
              variant="outline"
              onClick={handleLinkedInLogin}
              className={styles.linkedinButton}
            >
              <Linkedin size={20} />
              Continue with LinkedIn
            </Button> */}
          </div>

          <div className={styles.footer}>
            <p>Don't have an account?{' '}<Link to="/signup" className={styles.link}>Sign Up</Link></p>
          </div>
        </div>
      </Card>
    </div>
  );
};