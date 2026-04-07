// src/features/users/usersSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Import the action from authSlice to listen for it
import { updateUserProfile } from '../auth/authSlice';

/**
 * Async Thunk to fetch the list of all users for the 'Find Talent' page.
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users');
      return response.data; // The payload will be the array of user objects
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Could not fetch users');
    }
  }
);

/**
 * NEW: Async Thunk to record a profile view.
 */
export const recordProfileView = createAsyncThunk(
  'users/recordView',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.put(`/users/${userId}/view`);
      return response.data; // Returns the full updated user object from the backend
    } catch (error) {
      // We don't need to show a big error for this, so we can fail silently
      // but still reject the promise for debugging purposes.
      return rejectWithValue(error.response.data);
    }
  }
);

/**
 * The Redux state slice for managing the public list of users.
 */
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],       // Holds the array of all users
    status: 'idle',  // Tracks the data fetching status
    error: null,
  },
  reducers: {
    updateUserStatus: (state, action) => {
      const { userId, isOnline, lastActiveAt } = action.payload;
      const userIndex = state.items.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        state.items[userIndex].isOnline = isOnline;
        state.items[userIndex].lastActiveAt = lastActiveAt;
      }
    },
  },
  // This handles the state changes for our async thunks
  extraReducers: (builder) => {
    builder
      // Cases for fetching the entire user list
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Case for synchronizing state after a user updates their own profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
          const updatedUser = action.payload;
          const userIndex = state.items.findIndex(user => user._id === updatedUser._id);

          if (userIndex !== -1) {
              state.items[userIndex] = updatedUser;
          }
      })

      // NEW: Case for synchronizing state after a profile view is recorded
      .addCase(recordProfileView.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const userIndex = state.items.findIndex(user => user._id === updatedUser._id);

        // Replace the old user data with the new data containing the incremented view count
        if (userIndex !== -1) {
          state.items[userIndex] = updatedUser;
        }
      });
  },
});

export const { updateUserStatus } = usersSlice.actions;

export default usersSlice.reducer;