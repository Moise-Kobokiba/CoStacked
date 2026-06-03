// src/features/reports/reportsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios'; // From user app's api folder

// ===================================================================
// ASYNC THUNKS
// ===================================================================

export const submitReport = createAsyncThunk(
    'reports/submit',
    async (reportData, { rejectWithValue }) => {
        try {
            const response = await API.post('/reports', reportData);
            return response.data; // { message: '...' }
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit report.');
        }
    }
);

export const fetchMyReports = createAsyncThunk(
    'reports/fetchMyReports',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/reports/my-reports');
            return response.data;
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets.');
        }
    }
);

export const addReportMessage = createAsyncThunk(
    'reports/addMessage',
    async ({ reportId, content }, { rejectWithValue }) => {
        try {
            const response = await API.post(`/reports/${reportId}/messages`, { content });
            return response.data;
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send message.');
        }
    }
);

// ===================================================================
// THE REPORTS SLICE
// ===================================================================

const initialState = {
    myReports: [],
    status: 'idle', // For submit
    fetchStatus: 'idle', 
    error: null,
};

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // SUBMIT
            .addCase(submitReport.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(submitReport.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(submitReport.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload; 
            })
            // FETCH MY REPORTS
            .addCase(fetchMyReports.pending, (state) => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchMyReports.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.myReports = action.payload;
            })
            .addCase(fetchMyReports.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.payload;
            })
            // ADD MESSAGE
            .addCase(addReportMessage.fulfilled, (state, action) => {
                // Update the ticket in the myReports array with the new populated version
                const index = state.myReports.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.myReports[index] = action.payload;
                }
            });
    },
});

export default reportsSlice.reducer;