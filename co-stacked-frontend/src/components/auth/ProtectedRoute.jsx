// src/components/auth/ProtectedRoute.jsx

import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * A robust wrapper for protecting routes, designed for nested routing.
 * It handles the initial authentication check and enforces profile completion.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, user, status } = useSelector((state) => state.auth);
  const location = useLocation();

  // 1. If we are actively checking for a token (on app load), show a loading state.
  if (status === 'loading') {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div className="animate-spin" style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%'
        }} />
        <p style={{ color: '#6b7280' }}>Authenticating...</p>
      </div>
    );
  }

  // 2. If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check if user needs to complete onboarding
  // Skip onboarding check for onboarding page itself and auth callback
  const currentPath = location.pathname;
  const skipOnboardingPaths = ['/onboarding', '/auth/callback', '/verify-email'];
  
  if (!skipOnboardingPaths.includes(currentPath) && user && !user.profileCompleted) {
    // Redirect to onboarding if profile is not complete
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // 4. User is authenticated and profile is complete (or on allowed pages)
  return <Outlet />;
};

ProtectedRoute.propTypes = {};
