// src/features/auth/authSlice.js
// DEPLOY FIX 2025-11-19 — force latest authSlice with userToken
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

// Import actions from other slices that this slice needs to react to
import {
  verifySubscription,
  verifyProfileBoost,
  cancelSubscription,
} from "../payments/paymentSlice";

// NEW: Consistent keys for localStorage (matches axios interceptor)
const TOKEN_KEY = "userToken";       // Axios looks for this exactly
const PROFILE_KEY = "userProfile";   // Optional for quick user access

// Utility to load initial state from localStorage
const loadInitialState = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  let user = null;
  try {
    const storedUser = localStorage.getItem(PROFILE_KEY);
    if (storedUser) user = JSON.parse(storedUser);
  } catch (err) {
    console.error("Failed to parse userProfile from localStorage", err);
  }
  return {
    user,
    token,
    isAuthenticated: !!token,
    status: "idle",
    error: null,
    successMessage: null,
    unverifiedEmail: null,
  };
};

// ===================================================================
// ASYNC THUNKS
// ===================================================================

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/register", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Registration failed." });
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, token }, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/verify-email", { email, token });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Verification failed." });
    }
  }
);

export const resendVerificationEmail = createAsyncThunk(
  "auth/resendVerification",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/resend-verification", { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to resend verification email." });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/login", credentials);
      const { user, token } = response.data;

      // NEW: Save in format axios interceptor expects
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error) {
      const payload = error.response?.data || { message: "Invalid credentials." };
      return rejectWithValue(payload);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/profile");
      const user = response.data;

      // Sync with localStorage
      localStorage.setItem(PROFILE_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
      }
      return rejectWithValue(error.response?.data || { message: "Failed to fetch profile." });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.put("/users/profile", userData);
      const updatedUser = response.data;

      // Update localStorage
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to update profile." });
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await API.put("/users/profile/change-password", passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to change password." });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/forgot-password", { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to send reset link." });
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/users/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to reset password." });
    }
  }
);

/**
 * NEW: Handles uploading a user's avatar.
 */
export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (formData, { rejectWithValue }) => {
    try {
      // The API instance already has the base URL and token interceptor.
      // We need to set the Content-Type to 'multipart/form-data' for file uploads.
      const response = await API.put('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // After uploading, sync the new user data with localStorage
      localStorage.setItem(PROFILE_KEY, JSON.stringify(response.data));
      
      return response.data; // The full updated user object from the backend
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.delete('/users/profile');
      // On successful deletion from the backend, dispatch the logout action
      // to clear the frontend state and local storage.
      dispatch(logout()); 
      return response.data; // { success, message }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  "auth/toggleBookmark",
  async ({ itemId, itemType }, { rejectWithValue }) => {
    try {
      const response = await API.put("/users/profile/bookmarks", { itemId, itemType });
      const updatedUser = response.data;

      // Sync with localStorage
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to toggle bookmark." });
    }
  }
);

export const fetchProfileViews = createAsyncThunk(
  "auth/fetchProfileViews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/profile/views");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to fetch profile views." });
    }
  }
);



// ===================================================================
// THE AUTH SLICE
// ===================================================================

  name: "auth",
  initialState: {
    ...loadInitialState(),
    profileViews: {
      total: 0,
      history: [],
      isRestricted: false,
      isSubscribed: false,
      status: 'idle',
      error: null
    }
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.successMessage = null;
      state.unverifiedEmail = null;
    },
    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    // NEW: Sync online status
    updateUserStatus: (state, action) => {
      const { userId, isOnline, lastActiveAt } = action.payload;
      if (state.user && state.user._id === userId) {
        state.user.isOnline = isOnline;
        state.user.lastActiveAt = lastActiveAt;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(state.user));
      }
    },
    // NEW: Manually update user state (e.g., after external payment verification)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Registration
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
        state.unverifiedEmail = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.unverifiedEmail = action.meta.arg.email;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Registration failed.";
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.unverifiedEmail = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload?.message || "Invalid credentials.";
        if (action.payload?.emailNotVerified) {
          state.unverifiedEmail = action.meta.arg.email;
        }
      })

      // Email Verification
      .addCase(verifyEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
        state.unverifiedEmail = null;
        // If token is returned, auto-login the user
        if (action.payload.token) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          // Save to localStorage
          localStorage.setItem(TOKEN_KEY, action.payload.token);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(action.payload.user));
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Verification failed.";
      })

      // Resend Verification Email
      .addCase(resendVerificationEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to resend verification email.";
      })

      // Get Profile
      .addCase(getUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Session expired.";
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to update profile.";
      })

      // Password Management
      .addCase(changePassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to change password.";
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to send reset link.";
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Failed to reset password.";
      })



      // Inter-Slice Reducers for Payment Events
      .addCase(verifySubscription.fulfilled, (state, action) => {
        const { user: updatedUser } = action.payload;
        if (state.user && updatedUser) {
          state.user = { ...state.user, ...updatedUser };
          localStorage.setItem(PROFILE_KEY, JSON.stringify(state.user));
        }
      })
      .addCase(verifyProfileBoost.fulfilled, (state, action) => {
        const { user: updatedUser } = action.payload;
        if (state.user && updatedUser) {
          state.user = { ...state.user, ...updatedUser };
          localStorage.setItem(PROFILE_KEY, JSON.stringify(state.user));
        }
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        const { user: updatedUser } = action.payload;
        if (state.user && updatedUser) {
          state.user = { ...state.user, ...updatedUser };
          localStorage.setItem(PROFILE_KEY, JSON.stringify(state.user));
        }
      })

      // --- NEW: Cases for Account Deletion ---
      .addCase(deleteAccount.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        // The logout action has already cleared the state,
        // but we can set a success message if needed (though user will be logged out).
        state.status = 'succeeded';
        state.successMessage = action.payload.message;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to delete account.';
      })

      // --- NEW: Cases for Avatar Upload ---
      .addCase(uploadAvatar.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Replace the user object with the updated one from the backend
        state.user = action.payload;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message || 'Failed to upload avatar.';
      })
      
      .addCase(toggleBookmark.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to toggle bookmark.";
      })
      
      // --- NEW: Cases for Profile Views ---
      .addCase(fetchProfileViews.pending, (state) => {
        state.profileViews.status = 'loading';
        state.profileViews.error = null;
      })
      .addCase(fetchProfileViews.fulfilled, (state, action) => {
        state.profileViews.status = 'succeeded';
        state.profileViews.total = action.payload.totalViews;
        state.profileViews.history = action.payload.history;
        state.profileViews.isRestricted = action.payload.isRestricted;
        state.profileViews.isSubscribed = action.payload.isSubscribed;
      })
      .addCase(fetchProfileViews.rejected, (state, action) => {
        state.profileViews.status = 'failed';
        state.profileViews.error = action.payload?.message || "Failed to fetch views.";
      });
  },
});

export const { logout, clearAuthMessages, setUser, updateUserStatus } = authSlice.actions;

export default authSlice.reducer;