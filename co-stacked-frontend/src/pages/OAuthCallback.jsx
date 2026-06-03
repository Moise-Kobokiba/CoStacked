// src/pages/OAuthCallback.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';

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
        const API_URL = import.meta.env.VITE_API_URL;

        if (error) {
          hasProcessed.current = true;
          return navigate(`/login?error=${error}`, { replace: true });
        }

        if (!token) {
          hasProcessed.current = true;
          return navigate('/login', { replace: true });
        }

        // Store token in localStorage
        localStorage.setItem('userToken', token);

        // Fetch user profile
        const userRes = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error(`Could not fetch user: ${userRes.status}`);
        const user = await userRes.json();

        // Store user data
        localStorage.setItem('userProfile', JSON.stringify(user));

        // Update Redux store
        dispatch({
          type: 'auth/loginUser/fulfilled',
          payload: { user, token },
        });

        hasProcessed.current = true;
        
        // Redirect based on profile completion status
        // OAuth users (especially GitHub/LinkedIn) may need role selection
        if (!user.profileCompleted) {
          // New OAuth user - redirect to onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // Existing user with completed profile
          navigate('/dashboard', { replace: true });
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
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      minHeight: '100vh',
      justifyContent: 'center'
    }}>
      <Loader2 className="animate-spin" size={48} style={{ color: '#3b82f6' }} />
      <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback;
