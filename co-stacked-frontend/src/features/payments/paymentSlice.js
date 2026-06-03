// src/features/payments/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

/**
 * Verifies a payment for a project boost.
 */
export const verifyPayment = createAsyncThunk(
  'payments/verifyBoost',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/verify', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/**
 * Verifies a payment for a user's verification subscription.
 */
export const verifySubscription = createAsyncThunk(
  'payments/verifySubscription',
  async (chargeToken, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/verify-subscription', { chargeToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/**
 * Verifies a payment for boosting a user's profile.
 */
export const verifyProfileBoost = createAsyncThunk(
  'payments/verifyProfileBoost',
  async ({ chargeToken, tierId }, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/verify-profile-boost', { chargeToken, tierId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/**
 * NEW: Cancels the user's active verification subscription.
 */
export const cancelSubscription = createAsyncThunk(
  'payments/cancelSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/cancel-subscription');
      return response.data; // The backend returns { success, message, user }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


// ===================================================================
// THE PAYMENT SLICE
// ===================================================================

const initialState = {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // --- Cases for Project Boost Verification ---
            .addCase(verifyPayment.pending, (state) => { 
              state.status = 'loading';
              state.error = null;
            })
            .addCase(verifyPayment.fulfilled, (state) => { 
              state.status = 'succeeded';
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Boost payment verification failed.';
            })

            // --- Cases for Subscription Verification ---
            .addCase(verifySubscription.pending, (state) => {
              state.status = 'loading';
              state.error = null;
            })
            .addCase(verifySubscription.fulfilled, (state) => {
              state.status = 'succeeded';
            })
            .addCase(verifySubscription.rejected, (state, action) => {
              state.status = 'failed';
              state.error = action.payload?.message || 'Subscription verification failed.';
            })
            
            // --- Cases for Profile Boost Verification ---
            .addCase(verifyProfileBoost.pending, (state) => {
              state.status = 'loading';
              state.error = null;
            })
            .addCase(verifyProfileBoost.fulfilled, (state) => {
              state.status = 'succeeded';
            })
            .addCase(verifyProfileBoost.rejected, (state, action) => {
              state.status = 'failed';
              state.error = action.payload?.message || 'Profile boost verification failed.';
            })

            // --- NEW: Cases for Cancel Subscription ---
            .addCase(cancelSubscription.pending, (state) => {
              state.status = 'loading';
              state.error = null;
            })
            .addCase(cancelSubscription.fulfilled, (state) => {
              state.status = 'succeeded';
              // The authSlice will listen for this fulfilled action to update the user's state.
            })
            .addCase(cancelSubscription.rejected, (state, action) => {
              state.status = 'failed';
              state.error = action.payload?.message || 'Failed to cancel subscription.';
            });
    }
});

export default paymentSlice.reducer;