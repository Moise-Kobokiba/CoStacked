// src/pages/OAuthCallback.jsx

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import styles from './LoginPage.module.css';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // OAuth failed, redirect to login with error message
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }

    if (token) {
      // Store token and user data
      localStorage.setItem('userToken', token);
      
      // Fetch user profile with the token
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(user => {
          // Store user profile
          localStorage.setItem('userProfile', JSON.stringify(user));
          
          // Update Redux state
          dispatch({
            type: 'auth/loginUser/fulfilled',
            payload: { user, token }
          });

          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
          navigate('/login?error=profile_fetch_failed', { replace: true });
        });
    } else {
      // No token or error, redirect to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className={styles.pageContainer}>
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem' }} />
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};
