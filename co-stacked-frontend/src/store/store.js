// src/store/store.js

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import projectsReducer from '../features/projects/projectsSlice';
import usersReducer from '../features/users/usersSlice';
import interestsReducer from '../features/interests/interestsSlice';
import messagesReducer from '../features/messages/messagesSlice';
import reportsReducer from '../features/reports/reportsSlice';
import paymentReducer from '../features/payments/paymentSlice'; // <-- 1. IMPORT the new reducer
import reviewsReducer from '../features/reviews/reviewsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import connectionsReducer from '../features/connections/connectionsSlice';

/**
 * The central Redux store for the main user-facing application.
 *
 * It combines all the different feature slices into a single state tree.
 * The keys in the `reducer` object define the names of the state slices.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    users: usersReducer,
    interests: interestsReducer,
    messages: messagesReducer,
    reports: reportsReducer,
    payment: paymentReducer, // <-- 2. ADD the new payment slice
    reviews: reviewsReducer,
    notifications: notificationsReducer, 
     connections: connectionsReducer,
  },
  // Recommended: Disable serializableCheck middleware if using non-serializable values (like functions),
  // but for our current setup, the default is fine.
});