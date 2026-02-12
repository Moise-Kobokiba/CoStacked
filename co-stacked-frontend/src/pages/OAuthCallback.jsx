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
        const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

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
        if (!userRes.ok) throw new Error(`Could not fetch users: ${userRes.status}`);
        const user = await userRes.json();

        // Fetch projects
        const projectsRes = await fetch(`${API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!projectsRes.ok) throw new Error(`Could not fetch projects: ${projectsRes.status}`);
        const projects = await projectsRes.json();

        // Send email verification if user not verified
        if (!user.isVerified) {
          const verificationRes = await fetch(`${API_URL}/api/users/${user._id}/verify`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isVerified: true }),
          });
          if (!verificationRes.ok) console.warn('Failed to mark user verified');

          // Trigger backend to send verification email
          await fetch(`${API_URL}/api/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: user._id }),
          });
        }

        // Store data locally
        localStorage.setItem('userProfile', JSON.stringify(user));
        localStorage.setItem('userProjects', JSON.stringify(projects));

        // Update Redux
        dispatch({
          type: 'auth/loginUser/fulfilled',
          payload: { user, token, projects },
        });

        hasProcessed.current = true;
        
        // Redirect based on profile completion status
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
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem' }} />
      <p>Completing sign in...</p>
    </div>
  );
};