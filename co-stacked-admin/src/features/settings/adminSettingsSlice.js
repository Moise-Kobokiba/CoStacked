// src/features/settings/adminSettingsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Async thunks for settings operations
export const getAdminSettings = createAsyncThunk(
  'settings/getAdminSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/settings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load settings' });
    }
  }
);

export const updateAdminProfile = createAsyncThunk(
  'settings/updateAdminProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await API.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const changeAdminPassword = createAsyncThunk(
  'settings/changeAdminPassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await API.put('/admin/change-password', passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  profile: null,
  systemSettings: null,
  status: 'idle',
  error: null,
  successMessage: null,
};

const adminSettingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsState: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    updateProfileOptimistically: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Admin Settings
      .addCase(getAdminSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getAdminSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.systemSettings = action.payload;
      })
      .addCase(getAdminSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to load settings';
      })

      // Update Admin Profile
      .addCase(updateAdminProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.successMessage = 'Profile updated successfully';
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update profile';
      })

      // Change Admin Password
      .addCase(changeAdminPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changeAdminPassword.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.successMessage = action.payload.message;
      })
      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to change password';
      });
  },
});

export const { clearSettingsState, updateProfileOptimistically } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;