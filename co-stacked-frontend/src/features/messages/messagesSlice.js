// src/features/messages/messagesSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

import { respondToInterest } from '../interests/interestsSlice';

// ===================================================================
// ASYNC THUNKS
// ===================================================================

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/messages/conversations');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load conversations.');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/messages/${conversationId}`);
      return { conversationId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to load messages.');
    }
  }
);

/**
 * NEW: This thunk is now ONLY for uploading files (images, audio, etc.).
 * Text messages are sent via Socket.IO and don't need a thunk.
 */
export const sendFileMessage = createAsyncThunk(
  'messages/sendFileMessage',
  async ({ conversationId, formData }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/messages/${conversationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data; // The new, populated message object from the backend
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to send file.');
    }
  }
);

export const accessChat = createAsyncThunk(
  'messages/accessChat',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.post('/messages/access', { userId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data?.message || 'Failed to access chat.');
    }
  }
);

// ===================================================================
// THE MESSAGES SLICE
// ===================================================================

const initialState = {
  conversations: [],
  messagesByConversation: {},
  status: 'idle',
  sendState: 'idle',
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // --- THIS IS THE NEW REDUCER ---
    // A synchronous action to add a single message (text or file) to the state.
    // This will be used by our socket hook and after successful file uploads.
    addMessage: (state, action) => {
      const newMessage = action.payload;
      const { conversationId } = newMessage;

      // Ensure the conversation exists in the messages map
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }

      // Avoid adding duplicate messages that might arrive from both HTTP and socket
      const messageExists = state.messagesByConversation[conversationId].some(m => m._id === newMessage._id);
      if (!messageExists) {
        state.messagesByConversation[conversationId].push(newMessage);
      }

      // Move the conversation to the top of the list for recent activity
      const convoIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (convoIndex !== -1) {
        const conversation = state.conversations[convoIndex];
        // To avoid mutation, we remove and re-add it to the top
        state.conversations.splice(convoIndex, 1);
        state.conversations.unshift(conversation);
      }
    },

    // Update message status (delivered/read)
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;

      // Find and update the message status in all conversations
      for (const conversationId in state.messagesByConversation) {
        const messages = state.messagesByConversation[conversationId];
        const messageIndex = messages.findIndex(msg => msg._id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex].status = status;
          break; // Found and updated, no need to continue
        }
      }
    },

    // Update multiple message statuses (for bulk read updates)
    updateMessagesStatus: (state, action) => {
      const { conversationId, updatedMessages } = action.payload;

      if (state.messagesByConversation[conversationId]) {
        updatedMessages.forEach(update => {
          const messageIndex = state.messagesByConversation[conversationId]
            .findIndex(msg => msg._id === update.messageId);
          if (messageIndex !== -1) {
            state.messagesByConversation[conversationId][messageIndex].status = update.status;
          }
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Cases for fetching conversations list
      .addCase(fetchConversations.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchConversations.fulfilled, (state, action) => { state.status = 'succeeded'; state.conversations = action.payload; })
      .addCase(fetchConversations.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // Cases for fetching messages for a single conversation
      .addCase(fetchMessages.pending, (state) => { /* No status change needed here to avoid UI jumps */ })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      
      // Cases for sending a new FILE message
      .addCase(sendFileMessage.pending, (state) => { state.sendState = 'loading'; })
      .addCase(sendFileMessage.fulfilled, (state, action) => {
        state.sendState = 'succeeded';
        // We now call the `addMessage` reducer to handle adding the new message
        // This keeps the logic consistent for all new messages (socket or HTTP)
        messagesSlice.caseReducers.addMessage(state, action);
      })
.addCase(sendFileMessage.rejected, (state, action) => { state.sendState = 'failed'; state.error = action.payload; })

      // Cases for accessing/creating chat
      .addCase(accessChat.pending, (state) => { state.status = 'loading'; })
      .addCase(accessChat.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add new conversation to the list if not already present
        const exists = state.conversations.some(conv => conv._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(accessChat.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // Inter-slice reducer for new conversations
      .addCase(respondToInterest.fulfilled, (state, action) => {
        const { conversation } = action.payload;
        if (conversation) {
          const exists = state.conversations.some(c => c._id === conversation._id);
          if (!exists) {
            state.conversations.unshift(conversation);
          }
        }
      });
  },
});

// Export the new action
export const { addMessage, updateMessageStatus, updateMessagesStatus } = messagesSlice.actions;
export default messagesSlice.reducer;