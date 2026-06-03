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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/**
 * Async Thunk to fetch the response rate for a single user.
 */
export const fetchResponseRate = createAsyncThunk(
  'users/fetchResponseRate',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/${userId}/response-rate`);
      return { userId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Could not fetch response rate');
    }
  }
);

/**
 * The Redux state slice for managing the public list of users.
 */
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    responseRates: {}, // Keyed by userId: { rate, label, totalDataPoints }
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
        if (!updatedUser?._id) return;
        const userIndex = state.items.findIndex(user => user._id === updatedUser._id);
        if (userIndex !== -1) {
          state.items[userIndex] = updatedUser;
        }
      })

      // NEW: Store response rate keyed by userId
      .addCase(fetchResponseRate.fulfilled, (state, action) => {
        const { userId, data } = action.payload;
        state.responseRates[userId] = data;
      });
  },
});

export const { updateUserStatus } = usersSlice.actions;

export default usersSlice.reducer;