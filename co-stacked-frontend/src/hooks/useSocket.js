// src/hooks/useSocket.js

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addMessage, updateMessageStatus, updateMessagesStatus } from '../features/messages/messagesSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  // Memoize the handler to prevent re-creating it on every render
  const receiveMessageHandler = useCallback((message) => {
    console.log('Received message via socket:', message);
    // When a message comes in, add it directly to our Redux store
    dispatch(addMessage(message));
  }, [dispatch]);

  useEffect(() => {
    // Only connect if we have a user ID (i.e., the user is logged in)
    if (!userId) {
      console.log('useSocket: No userId provided, skipping socket connection');
      return;
    }

    console.log('useSocket: Connecting to Socket.IO server at:', SOCKET_URL);
    console.log('useSocket: User ID:', userId);

    // Create the socket connection with proper configuration
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Set up listeners for events from the server
    newSocket.on('receive_message', receiveMessageHandler);

    // Listen for message status updates
    newSocket.on('message_status_update', (data) => {
      console.log('Message status update:', data);
      dispatch(updateMessageStatus(data));
    });

    newSocket.on('messages_read', (data) => {
      console.log('Messages marked as read:', data);
      dispatch(updateMessagesStatus(data));
    });

    // Listen for connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server with ID:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('Error details:', error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to Socket.IO server after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
    });

    // Clean up the connection and listeners when the component unmounts
    return () => {
      console.log('useSocket: Cleaning up socket connection');
      newSocket.off('receive_message', receiveMessageHandler);
      newSocket.disconnect();
    };
  }, [userId, receiveMessageHandler]);

  return socket; // The component will get the socket instance
};