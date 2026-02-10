// src/App.jsx

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { router } from './router'; // 1. Import the router configuration object
import { getUserProfile } from './features/auth/authSlice';

/**
 * The root component of the application.
 * It handles app-wide logic like session verification and renders the router.
 */
function App() {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);

  // This effect runs on initial app load to handle persistent login sessions.
  useEffect(() => {
    // If a token was loaded from localStorage into our Redux state...
    if (token) {
      // ...dispatch the action to verify the token and fetch the user's profile.
      dispatch(getUserProfile());
    }
  }, [token, dispatch]);

  // 2. Render the RouterProvider directly, passing it the router object.
  return <RouterProvider router={router} />;
}

export default App;