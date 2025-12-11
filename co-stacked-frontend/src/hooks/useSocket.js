// src/hooks/useSocket.js

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addMessage } from '../features/messages/messagesSlice'; // We will create this action

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
    if (!userId) return;

    // Create the socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    // Set up listeners for events from the server
    newSocket.on('receive_message', receiveMessageHandler);

    // Clean up the connection and listeners when the component unmounts
    return () => {
      newSocket.off('receive_message', receiveMessageHandler);
      newSocket.disconnect();
    };
  }, [userId, receiveMessageHandler]);

  return socket; // The component will get the socket instance
};