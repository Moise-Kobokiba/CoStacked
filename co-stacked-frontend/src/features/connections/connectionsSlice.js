// src/features/connections/connectionsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

// --- READ OPERATIONS ---
export const fetchConnections = createAsyncThunk(
  'connections/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/connections');
      return response.data; // Array of user objects
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'connections/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/connections/pending');
      return response.data; // Array of connection request objects
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchConnectionCount = createAsyncThunk(
  'connections/fetchCount',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/connections/count/${userId}`);
      return { userId, count: response.data.count };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// --- WRITE OPERATIONS ---
export const sendConnectionRequest = createAsyncThunk(
  'connections/sendRequest',
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await API.post('/connections/request', { recipientId });
      return response.data; // { status: 'pending_sent' }
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  'connections/acceptRequest',
  async (requesterId, { rejectWithValue }) => {
    try {
      const response = await API.put('/connections/accept', { requesterId });
      // We return the original requesterId to know which request to remove from the pending list
      return { status: response.data.status, requesterId, user: response.data.user };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeOrCancelConnection = createAsyncThunk(
  'connections/removeOrCancel',
  async (otherUserId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/connections/${otherUserId}`);
      // Return the other user's ID to update the UI
      return { status: response.data.status, otherUserId };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


// ===================================================================
// THE CONNECTIONS SLICE
// ===================================================================

const initialState = {
  connections: [],
  pendingRequests: [],
  connectionCounts: {},
  status: 'idle',
  pendingRequestsStatus: 'idle',
  actionStatus: 'idle',
  error: null,
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetching all connections
      .addCase(fetchConnections.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.connections = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload.message; })

      // Fetching pending requests
      .addCase(fetchPendingRequests.pending, (state) => { state.pendingRequestsStatus = 'loading'; })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequestsStatus = 'succeeded';
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => { state.pendingRequestsStatus = 'failed'; state.error = action.payload.message; })

       // --- WRITE OPERATIONS STATUS ---
       .addCase(sendConnectionRequest.pending, (state) => { state.actionStatus = 'loading'; })
       .addCase(acceptConnectionRequest.pending, (state) => { state.actionStatus = 'loading'; })
       .addCase(removeOrCancelConnection.pending, (state) => { state.actionStatus = 'loading'; })

       .addCase(sendConnectionRequest.rejected, (state, action) => { state.actionStatus = 'failed'; state.error = action.payload?.message || 'Failed to send request'; })
       .addCase(acceptConnectionRequest.rejected, (state, action) => { state.actionStatus = 'failed'; state.error = action.payload?.message || 'Failed to accept request'; })
       .addCase(removeOrCancelConnection.rejected, (state, action) => { state.actionStatus = 'failed'; state.error = action.payload?.message || 'Failed to update connection'; })

       // Sending a request
       .addCase(sendConnectionRequest.fulfilled, (state, action) => {
         state.actionStatus = 'succeeded';
         const recipientId = action.meta.arg;
         if (!state.pendingRequests.some(req => (req.recipient?._id === recipientId || req.recipient === recipientId))) {
           state.pendingRequests.push({
             recipient: { _id: recipientId },
             status: 'pending',
             createdAt: new Date().toISOString()
           });
         }
       })

       // Accepting a request
       .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
         state.actionStatus = 'succeeded';
         const { requesterId, user } = action.payload;
         const acceptedRequest = state.pendingRequests.find(req => (req.requester?._id === requesterId || req.requester === requesterId));
         
         const userToAdd = acceptedRequest?.requester || user || { _id: requesterId };
         
         if (userToAdd && !state.connections.some(c => c._id === userToAdd._id)) {
           state.connections.unshift(userToAdd);
         }
         
         state.pendingRequests = state.pendingRequests.filter(req => (req.requester?._id !== requesterId && req.requester !== requesterId));
         
         if (state.connectionCounts[requesterId]) {
           state.connectionCounts[requesterId] += 1;
         } else {
           state.connectionCounts[requesterId] = 1;
         }
       })

       // Removing a connection OR declining/canceling a request
       .addCase(removeOrCancelConnection.fulfilled, (state, action) => {
         state.actionStatus = 'succeeded';
         const { otherUserId } = action.payload;
         state.connections = state.connections.filter(user => user._id !== otherUserId);
         state.pendingRequests = state.pendingRequests.filter(req => 
           (req.requester?._id !== otherUserId && req.requester !== otherUserId) && 
           (req.recipient?._id !== otherUserId && req.recipient !== otherUserId)
         );
         if (state.connectionCounts[otherUserId]) {
           state.connectionCounts[otherUserId] -= 1;
         }
       })

       // Fetching connection count
       .addCase(fetchConnectionCount.fulfilled, (state, action) => {
         const { userId, count } = action.payload;
         state.connectionCounts[userId] = count;
       });
  },
});

export const { } = connectionsSlice.actions;
export default connectionsSlice.reducer;