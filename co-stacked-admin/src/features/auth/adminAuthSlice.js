// src/features/auth/adminAuthSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

const TOKEN_NAME = 'costacked-admin-token';

// Utility to load initial state from localStorage
const loadInitialState = () => {
  try {
    const serializedAuth = localStorage.getItem(TOKEN_NAME);
    if (serializedAuth === null) {
      return { user: null, token: null, isAuthenticated: false };
    }
    const { user, token } = JSON.parse(serializedAuth);
    return { user, token, isAuthenticated: !!token };
  } catch (e) {
    console.error("Could not load admin auth state from localStorage", e);
    return { user: null, token: null, isAuthenticated: false };
  }
};


// ===================================================================
// ASYNC THUNKS
// ===================================================================

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post('/users/login', credentials);
      const { user, token } = response.data;
      if (!user?.isAdmin) {
        return rejectWithValue({ message: 'Access Denied: Not an administrator.' });
      }
      // Store the entire auth object on successful login
      localStorage.setItem(TOKEN_NAME, JSON.stringify({ user, token }));
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const registerAdmin = createAsyncThunk(
  'auth/registerAdmin',
  async (adminData, { rejectWithValue }) => {
    try {
      const response = await API.post('/admin/register', adminData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const verifyAdminEmail = createAsyncThunk(
  'auth/verifyAdminEmail',
  async ({ email, token }, { rejectWithValue }) => {
    try {
      const response = await API.post('/users/verify-email', { email, token });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getAdminProfile = createAsyncThunk(
  'auth/getAdminProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/profile');
      if (!response.data?.isAdmin) {
        return rejectWithValue({ message: 'Access Denied: Not an administrator.' });
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch profile.' });
    }
  }
);

export const forgotAdminPassword = createAsyncThunk(
  'auth/forgotAdminPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post('/admin/forgot-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send reset link.' });
    }
  }
);


// ===================================================================
// THE SLICE DEFINITION
// ===================================================================

const initialState = {
  ...loadInitialState(),
  status: 'idle',
  error: null,
  successMessage: null,
  unverifiedEmail: null,
};

const adminAuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutAdmin: (state) => {
      localStorage.removeItem(TOKEN_NAME);
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      state.successMessage = null;
      state.unverifiedEmail = null;
    },
    clearAuthState: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.unverifiedEmail = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Login failed.';
        if (action.payload?.emailNotVerified) {
          state.unverifiedEmail = action.meta.arg.email;
        }
      })

      // Register Admin
      .addCase(registerAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.successMessage = null;
        state.unverifiedEmail = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.successMessage = action.payload.message;
        state.unverifiedEmail = action.meta.arg.email;
        // Save to localStorage so it persists on page refresh
        localStorage.setItem('admin-unverified-email', action.meta.arg.email);
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Registration failed.';
      })
      
      // Email Verification
      .addCase(verifyAdminEmail.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyAdminEmail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.successMessage = action.payload.message;
        state.unverifiedEmail = null;
      })
      .addCase(verifyAdminEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Verification failed.';
      })

       // Get Profile (for persistent session)
       .addCase(getAdminProfile.pending, (state) => {
         state.status = 'loading';
       })
       .addCase(getAdminProfile.fulfilled, (state, action) => {
         state.status = 'succeeded';
         state.isAuthenticated = true;
         state.user = action.payload;
       })
       .addCase(getAdminProfile.rejected, (state) => {
         localStorage.removeItem(TOKEN_NAME);
         state.isAuthenticated = false;
         state.user = null;
         state.token = null;
         state.status = 'failed';
       })

       // Forgot Password
       .addCase(forgotAdminPassword.pending, (state) => {
         state.status = 'loading';
         state.error = null;
         state.successMessage = null;
       })
       .addCase(forgotAdminPassword.fulfilled, (state, action) => {
         state.status = 'succeeded';
         state.successMessage = action.payload.message;
       })
       .addCase(forgotAdminPassword.rejected, (state, action) => {
         state.status = 'failed';
         state.error = action.payload?.message || 'Failed to send reset link.';
       });
  },
});

export const { logoutAdmin, clearAuthState } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;