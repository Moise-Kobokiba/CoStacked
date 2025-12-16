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
    if (hasProcessed.current) return;

    const handleOAuth = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        if (error) {
          hasProcessed.current = true;
          return navigate(`/login?error=${error}`, { replace: true });
        }

        if (!token) {
          hasProcessed.current = true;
          return navigate('/login', { replace: true });
        }

        // Store token
        localStorage.setItem('userToken', token);

        // Fetch user profile from backend
        const res = await fetch(`${apiUrl}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const user = await res.json();

        // If not verified, update verification in backend and send email
        if (!user.isVerified) {
          await fetch(`${apiUrl}/api/users/${user._id}/verify`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              emailVerificationToken: null, // backend should generate token
              isVerified: true,
            }),
          });

          await fetch(`${apiUrl}/api/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: user._id }),
          });
        }

        // Always store profile and update Redux
        localStorage.setItem('userProfile', JSON.stringify(user));
        dispatch({ type: 'auth/loginUser/fulfilled', payload: { user, token } });
        hasProcessed.current = true;
        navigate('/dashboard', { replace: true });

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