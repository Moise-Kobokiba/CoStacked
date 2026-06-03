// src/features/interests/interestsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

/**
 * Developer action: Sends a new interest request to a founder.
 */
export const sendInterestRequest = createAsyncThunk(
  'interests/sendRequest',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.post('/interests', { projectId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to send request.');
    }
  }
);

/**
 * Founder action: Fetches all interest requests they have received.
 */
export const fetchReceivedInterests = createAsyncThunk(
  'interests/fetchReceived',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/interests/received');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to fetch received requests.');
    }
  }
);

/**
 * Developer action: Fetches all interest requests they have sent.
 */
export const fetchSentInterests = createAsyncThunk(
  'interests/fetchSent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/interests/sent');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to fetch sent requests.');
    }
  }
);

/**
 * Founder action: Updates the status of an interest request (approve/reject).
 */
export const respondToInterest = createAsyncThunk(
  'interests/respond',
  async ({ interestId, status }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/interests/${interestId}/respond`, { status });
      // The payload now contains the updatedInterest AND the new/existing conversation object if approved
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to respond to request.');
    }
  }
);


// ===================================================================
// THE INTERESTS SLICE
// ===================================================================

/**
 * Deletes an interest/connection by its ID. Can be initiated by either participant.
 */
export const deleteInterest = createAsyncThunk(
  'interests/delete',
  async (interestId, { rejectWithValue }) => {
    try {
      await API.delete(`/interests/${interestId}`);
      return interestId; // Return the ID of the deleted interest on success
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to remove connection.');
    }
  }
);

// ===================================================================
// THE (SINGLE) INTERESTS SLICE
// ===================================================================

const initialState = {
  receivedItems: [],
  sentItems: [],
  status: 'idle',
  fetchStatus: 'idle',
  error: null,
};

const interestsSlice = createSlice({
  name: 'interests',
  initialState,
  reducers: {},
  // The extraReducers builder handles ALL our async thunks
  extraReducers: (builder) => {
    builder
      // Cases for SENDING a request
      .addCase(sendInterestRequest.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(sendInterestRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sentItems.unshift(action.payload);
      })
      .addCase(sendInterestRequest.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // Cases for FETCHING received requests
      .addCase(fetchReceivedInterests.pending, (state) => { state.fetchStatus = 'loading'; })
      .addCase(fetchReceivedInterests.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.receivedItems = action.payload;
      })
      .addCase(fetchReceivedInterests.rejected, (state, action) => { state.fetchStatus = 'failed'; state.error = action.payload; })

      // Cases for FETCHING sent requests
      .addCase(fetchSentInterests.pending, (state) => { state.fetchStatus = 'loading'; })
      .addCase(fetchSentInterests.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.sentItems = action.payload;
      })
      .addCase(fetchSentInterests.rejected, (state, action) => { state.fetchStatus = 'failed'; state.error = action.payload; })

      // Cases for RESPONDING to a request
      .addCase(respondToInterest.pending, (state) => { state.status = 'loading'; })
      .addCase(respondToInterest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedInterest = action.payload;
        // Update receivedItems for the founder
        const receivedIndex = state.receivedItems.findIndex(i => i._id === updatedInterest._id);
        if (receivedIndex !== -1) { state.receivedItems[receivedIndex] = updatedInterest; }
        // Update sentItems for the developer
        const sentIndex = state.sentItems.findIndex(i => i._id === updatedInterest._id);
        if (sentIndex !== -1) { state.sentItems[sentIndex] = updatedInterest; }
      })
      .addCase(respondToInterest.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // === MERGED: Cases for DELETING a connection ===
      .addCase(deleteInterest.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null;
      })
      .addCase(deleteInterest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const deletedId = action.payload;
        state.receivedItems = state.receivedItems.filter(i => i._id !== deletedId);
        state.sentItems = state.sentItems.filter(i => i._id !== deletedId);
      })
      .addCase(deleteInterest.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; 
      });
  },
});

export default interestsSlice.reducer;