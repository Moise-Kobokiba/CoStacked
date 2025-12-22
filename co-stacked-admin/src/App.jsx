// src/App.jsx
import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Import our custom Protected Route component and the necessary action
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { getAdminProfile } from './features/auth/adminAuthSlice';

// Import Layouts and Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminRegisterPage } from './pages/AdminRegisterPage'; // <-- 1. IMPORT
import { AdminForgotPasswordPage } from './pages/AdminForgotPasswordPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ProjectManagementPage } from './pages/ProjectManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdminVerifyEmailPage } from './pages/AdminVerifyEmailPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

// The router configuration is updated with all necessary routes.
const router = createBrowserRouter([
  { path: '/login', element: <AdminLoginPage /> },
  { path: '/register', element: <AdminRegisterPage /> },
  { path: '/forgot-password', element: <AdminForgotPasswordPage /> },
  { path: '/verify-email', element: <AdminVerifyEmailPage /> },
  {
    path: '/',
    element: <AdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout><Outlet /></AdminLayout>,
        children: [
          { index: true, element: <AdminDashboardPage /> },
           { path: 'users', element: <UserManagementPage /> },
           { path: 'projects', element: <ProjectManagementPage /> },
           { path: 'reports', element: <ReportsPage /> },
           { path: 'transactions', element: <TransactionsPage /> },
           { path: 'settings', element: <AdminSettingsPage /> },
        ]
      }
    ]
  },
]);

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    console.log("App.jsx Effect: Running initial auth check...");
    console.log("App.jsx Effect: Token from Redux state is:", token);
    
    if (token) {
      console.log("App.jsx Effect: Token found! Dispatching getAdminProfile.");
      dispatch(getAdminProfile());
    } else {
      console.log("App.jsx Effect: No token found. Skipping profile fetch.");
    }
  }, [dispatch, token]);

  return <RouterProvider router={router} />;
}

export default App;