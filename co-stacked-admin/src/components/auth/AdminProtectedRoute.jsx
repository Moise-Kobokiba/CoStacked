// src/components/auth/AdminProtectedRoute.jsx

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * A private route wrapper that reads the LIVE auth state from Redux.
 * It acts as a gatekeeper for protected pages.
 */
export const AdminProtectedRoute = () => {
  // Get the real isAuthenticated flag and status from our adminAuthSlice
  const { isAuthenticated, status } = useSelector(state => state.auth);
  const [authTimeout, setAuthTimeout] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => {
        console.warn('Authentication check timed out - redirecting to login');
        setAuthTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else {
      setAuthTimeout(false);
    }
  }, [status]);

  // Show loading state when actively verifying token
  if (status === 'loading' && !authTimeout) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.1rem',
        color: '#666'
      }}>
        <div>Authenticating...</div>
        <div style={{ fontSize: '0.9rem', marginTop: '1rem', color: '#999' }}>
          If this takes too long, please refresh the page or contact support.
        </div>
      </div>
    );
  }

  // If authentication timed out or failed, redirect to login
  if (authTimeout || status === 'failed') {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the nested content
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Good practice to define that this component doesn't expect any props.
AdminProtectedRoute.propTypes = {};