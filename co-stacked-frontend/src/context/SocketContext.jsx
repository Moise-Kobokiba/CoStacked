import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, updateMessageStatus, updateMessagesStatus } from '../features/messages/messagesSlice';
import { fetchNotifications } from '../features/notifications/notificationsSlice';
import { updateUserStatus as updateUsersStatus } from '../features/users/usersSlice';
import { updateUserStatus as updateAuthStatus } from '../features/auth/authSlice';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const socketRef = useRef(null);

  const receiveMessageHandler = useCallback((message) => {
    console.log('Socket: Received message:', message);
    dispatch(addMessage(message));
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current) return; // Already connected

    console.log('Socket: Initializing global connection for user:', userId);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Event Listeners
    newSocket.on('receive_message', receiveMessageHandler);

    newSocket.on('message_status_update', (data) => {
      dispatch(updateMessageStatus(data));
    });

    newSocket.on('messages_read', (data) => {
      dispatch(updateMessagesStatus(data));
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      newSocket.emit('setup', userId);
    });

    newSocket.on('user_status_changed', (data) => {
      console.log('Socket: User status changed:', data);
      dispatch(updateUsersStatus(data));
      dispatch(updateAuthStatus(data));
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    return () => {
      if (newSocket) {
        newSocket.off('receive_message', receiveMessageHandler);
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [userId, receiveMessageHandler, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  return context;
};
