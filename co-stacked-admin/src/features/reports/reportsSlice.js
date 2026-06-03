// src/features/reports/reportsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// Thunk to fetch all open reports
export const fetchAllReports = createAsyncThunk(
  'reports/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/reports');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

// --- NEW: Thunk to update a report's status ---
export const updateReportStatus = createAsyncThunk(
  'reports/updateStatus',
  async ({ reportId, status }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/reports/${reportId}`, { status });
      return response.data; // The updated report object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update report');
    }
  }
);

export const addReportMessage = createAsyncThunk(
  'reports/addMessage',
  async ({ reportId, content }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/admin/reports/${reportId}/messages`, { content });
      return response.data; // The updated report
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const initialState = {
  reports: [],
  status: 'idle',
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReports.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllReports.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reports = action.payload;
      })
      .addCase(fetchAllReports.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        const updatedReport = action.payload;
        if (updatedReport.status === 'dismissed') {
          state.reports = state.reports.filter(report => report._id !== updatedReport._id);
        } else {
          // Replace or update resolved/open ones
          const index = state.reports.findIndex(r => r._id === updatedReport._id);
          if (index !== -1) state.reports[index] = updatedReport;
        }
      })
      .addCase(addReportMessage.fulfilled, (state, action) => {
        const index = state.reports.findIndex(r => r._id === action.payload._id);
        if (index !== -1) state.reports[index] = action.payload;
      })
      .addCase(updateReportStatus.rejected, (state, action) => {
        // You could set an error state here to show in the UI if needed
        console.error("Failed to update report:", action.payload);
      });
  },
});

export default reportsSlice.reducer;