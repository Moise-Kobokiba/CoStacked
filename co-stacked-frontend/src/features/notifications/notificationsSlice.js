// src/features/notifications/notificationsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

/**
 * Fetches the logged-in user's unread notifications.
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/notifications');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load notifications.');
    }
// src/features/notifications/notificationsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

/**
 * Fetches the logged-in user's unread notifications.
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/notifications');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load notifications.');
    }
  }
);

/**
 * Marks all unread notifications as read on the backend.
 */
export const markNotificationsAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.put('/notifications/mark-read');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to update notifications.');
    }
  }
);

/**
 * Fetches all notifications (read and unread) for the dedicated page.
 */
export const fetchAllNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/notifications/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load notification history.');
    }
  }
);



// ===================================================================
// THE NOTIFICATIONS SLICE
// ===================================================================

const initialState = {
  items: [],      // Unread notifications for dropdown
  allItems: [],   // Full notification history for dedicated page
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // A synchronous reducer to clear notifications from state immediately on logout
    clearNotifications: (state) => {
      state.items = [];
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Cases for fetching notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        console.log('🔔 Notifications fetched successfully:', action.payload.length, 'items');
        if (action.payload.length > 0) {
          console.log('📋 Notification details:', action.payload.map(n => ({ type: n.type, sender: n.sender?.name })));
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Cases for marking notifications as read
      .addCase(markNotificationsAsRead.pending, (state) => {
        // We can optimistically update the UI right away
        state.items.forEach(item => {
          item.isRead = true;
        });
      })
      .addCase(markNotificationsAsRead.fulfilled, (state) => {
        // On success, we can clear the items array since they are all "read"
        state.items = [];
      })
      .addCase(markNotificationsAsRead.rejected, (state) => {
        // If the API call fails, we should revert the optimistic update
        state.items.forEach(item => {
          item.isRead = false;
        });
        // We could also add an error message here for the user
      })
      
      // Cases for fetching all notifications (history)
      .addCase(fetchAllNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allItems = action.payload;
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;