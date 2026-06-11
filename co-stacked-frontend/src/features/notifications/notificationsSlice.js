import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

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

export const fetchAllNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20 } = params;
      const response = await API.get(`/notifications/all?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load notification history.');
    }
  }
);

/**
 * Clears all notifications for the current user.
 */
export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await API.delete('/notifications');
      return true;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to clear notifications.');
    }
  }
);

/**
 * Deletes a single notification by ID.
 */
export const deleteOneNotification = createAsyncThunk(
  'notifications/deleteOne',
  async (notificationId, { rejectWithValue }) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to delete notification.');
    }
  }
);

/**
 * Toggles a single notification read/unread status.
 */
export const toggleNotificationRead = createAsyncThunk(
  'notifications/toggleRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await API.put(`/notifications/${notificationId}/toggle-read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to toggle notification.');
    }
  }
);

/**
 * Fetches unread notification count.
 */
export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to fetch count.');
    }
  }
);

// ===================================================================
// THE NOTIFICATIONS SLICE
// ===================================================================

const initialState = {
  items: [],
  allItems: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  unreadCount: 0,
  status: 'idle',
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
      state.allItems = [];
      state.unreadCount = 0;
      state.status = 'idle';
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch unread notifications
      .addCase(fetchNotifications.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Mark all as read
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.items.forEach(item => { item.isRead = true; });
      })
      .addCase(markNotificationsAsRead.fulfilled, (state) => {
        state.items = [];
        state.unreadCount = 0;
      })
      .addCase(markNotificationsAsRead.rejected, (state) => {
        state.items.forEach(item => { item.isRead = false; });
      })

      // Fetch all notifications (with pagination)
      .addCase(fetchAllNotifications.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.notifications) {
          state.allItems = action.payload.notifications;
          state.pagination = action.payload.pagination;
        } else {
          state.allItems = action.payload;
        }
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Clear all
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.items = [];
        state.allItems = [];
        state.unreadCount = 0;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete one
      .addCase(deleteOneNotification.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.items = state.items.filter(n => n._id !== deletedId);
        state.allItems = state.allItems.filter(n => n._id !== deletedId);
      })
      .addCase(deleteOneNotification.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Toggle read/unread
      .addCase(toggleNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const updateItem = (arr) => {
          const idx = arr.findIndex(n => n._id === updated._id);
          if (idx !== -1) arr[idx] = { ...arr[idx], isRead: updated.isRead };
        };
        updateItem(state.items);
        updateItem(state.allItems);
      })

      // Unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { clearNotifications, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;