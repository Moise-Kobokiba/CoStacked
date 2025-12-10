// src/pages/OAuthCallback.jsx

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import styles from './LoginPage.module.css';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      console.log('OAuth callback already processed, skipping...');
      return;
    }

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    console.log('OAuth Callback - Token:', token ? 'Present' : 'Missing');
    console.log('OAuth Callback - Error:', error);

    if (error) {
      console.error('OAuth Error:', error);
      hasProcessed.current = true;
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }

    if (token) {
      hasProcessed.current = true;
      console.log('Storing token in localStorage...');
      localStorage.setItem('userToken', token);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Fetching user profile from:', `${apiUrl}/api/users/profile`);
      
      // Fetch user profile with the token
      fetch(`${apiUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          console.log('Profile fetch response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(user => {
          console.log('User profile fetched successfully:', user.email);
          
          // Store user profile
          localStorage.setItem('userProfile', JSON.stringify(user));
          
          // Update Redux state
          dispatch({
            type: 'auth/loginUser/fulfilled',
            payload: { user, token }
          });

          console.log('Redirecting to dashboard...');
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
          navigate('/login?error=profile_fetch_failed', { replace: true });
        });
    } else {
      console.warn('No token found in URL, redirecting to login');
      hasProcessed.current = true;
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
