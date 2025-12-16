import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import crypto from 'crypto-browserify'; // for browser-safe crypto
import { sendVerificationEmail } from '../mailer'; // adjust path
import styles from './LoginPage.module.css';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const handleOAuth = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';

        console.log('OAuth Callback - Token:', token ? 'Present' : 'Missing');
        console.log('OAuth Callback - Error:', error);

        if (error) {
          hasProcessed.current = true;
          return navigate(`/login?error=${error}`, { replace: true });
        }

        if (token) {
          // Store token
          localStorage.setItem('userToken', token);

          // Fetch user profile from backend
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const user = await res.json();

          // Send verification email if user is not verified
          if (!user.isVerified) {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
            user.isVerified = true;

            // Call your backend endpoint to save user updates
            await fetch(`${apiUrl}/api/users/${user._id}/verify`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                emailVerificationToken: verificationToken,
                isVerified: true,
                emailVerificationExpires: user.emailVerificationExpires,
              }),
            });

            const verificationLink = `${FRONTEND_URL}/verify?token=${verificationToken}`;
            await fetch(`${apiUrl}/api/email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ userId: user._id, verificationToken }),
});

          // Store user profile in localStorage & Redux
          localStorage.setItem('userProfile', JSON.stringify(user));
          dispatch({
            type: 'auth/loginUser/fulfilled',
            payload: { user, token },
          });

          hasProcessed.current = true;
          navigate('/dashboard', { replace: true });
        } else {
          hasProcessed.current = true;
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        hasProcessed.current = true;
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    handleOAuth();
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