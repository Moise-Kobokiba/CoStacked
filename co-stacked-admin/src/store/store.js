// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import adminAuthReducer from '../features/auth/adminAuthSlice';
import userManagementReducer from '../features/users/userManagementSlice';
import projectManagementReducer from '../features/projects/projectManagementSlice';
import reportsReducer from '../features/reports/reportsSlice';
import transactionReducer from '../features/transactions/transactionSlice';
// 1. Import the new admin notifications reducer
import adminNotificationsReducer from '../features/notifications/adminNotificationsSlice';
import adminSettingsReducer from '../features/settings/adminSettingsSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    auth: adminAuthReducer,
    userManagement: userManagementReducer,
    projectManagement: projectManagementReducer,
    reports: reportsReducer,
    transactions: transactionReducer,
    // 2. Add the new slice to the store
    adminNotifications: adminNotificationsReducer,
    settings: adminSettingsReducer,
  },
});