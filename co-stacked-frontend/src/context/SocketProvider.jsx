import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, user } = useSelector((s) => s.auth || {});
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    // Initialize socket with auth token if present
    const socket = io(API_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // connection established; server will validate token from handshake
      // Join rooms we want updates for by default
      try {
        if (token) {
          socket.emit('joinRoom', 'presence');
        }
        socket.emit('joinRoom', 'validation_tips');
        socket.emit('joinRoom', 'validation_feed');
        socket.emit('joinRoom', 'stacksuite_feed');
        socket.emit('joinRoom', 'projects');
      } catch (e) {
        console.error('Failed to join default rooms:', e);
      }
    });

    // Invalidate queries on relevant events
    socket.on('validation_tips_updated', () => {
      queryClient.invalidateQueries(['validationTips']);
    });

    socket.on('notification_created', () => {
      queryClient.invalidateQueries(['notifications']);
    });

    socket.on('user_status_changed', (payload) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['auth']);
    });

    socket.on('idea_vote_update', (payload) => {
      // Invalidate idea lists and specific idea detail if present
      queryClient.invalidateQueries(['validationPosts']);
      queryClient.invalidateQueries(['communityStats']);
      if (payload?.ideaId) queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
    });

    socket.on('idea_viewed', (payload) => {
      if (payload?.ideaId) queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
    });

    socket.on('idea_share_update', (payload) => {
      if (payload?.ideaId) queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
    });

    socket.on('idea_save_update', (payload) => {
      if (payload?.ideaId) queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
    });

    socket.on('idea_comment_added', (payload) => {
      queryClient.invalidateQueries(['communityStats']);
      if (payload?.ideaId) {
        queryClient.invalidateQueries(['ideaComments', payload.ideaId]);
        queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
      }
    });

    socket.on('idea_comment_deleted', (payload) => {
      if (payload?.ideaId) {
        queryClient.invalidateQueries(['ideaComments', payload.ideaId]);
        queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
      }
    });

    socket.on('idea_comment_updated', (payload) => {
      if (payload?.ideaId) {
        queryClient.invalidateQueries(['ideaComments', payload.ideaId]);
        queryClient.invalidateQueries(['ideaDetail', payload.ideaId]);
      }
    });

    socket.on('idea_created', () => {
      queryClient.invalidateQueries(['validationPosts']);
      queryClient.invalidateQueries(['communityStats']);
    });

    socket.on('idea_converted', (payload) => {
      queryClient.invalidateQueries(['validationPosts']);
      queryClient.invalidateQueries(['communityStats']);
    });

    socket.on('project_created', () => {
      queryClient.invalidateQueries(['communityStats']);
    });

    // StackSuite events
    socket.on('stacksuite_post_created', (payload) => {
      queryClient.invalidateQueries(['stackPosts']);
      if (payload?.post?.post?._id) queryClient.invalidateQueries(['stackPost', payload.post.post._id]);
    });

    socket.on('stacksuite_vote_update', (payload) => {
      if (payload?.postId) {
        queryClient.invalidateQueries(['stackPost', payload.postId]);
        queryClient.invalidateQueries(['stackPosts']);
      }
    });

    socket.on('stacksuite_follow_update', (payload) => {
      if (payload?.postId) {
        queryClient.invalidateQueries(['stackPost', payload.postId]);
        queryClient.invalidateQueries(['stackPosts']);
      }
    });

    socket.on('stacksuite_comment_added', (payload) => {
      if (payload?.parentId) {
        queryClient.invalidateQueries(['stackComments', payload.parentId]);
        queryClient.invalidateQueries(['stackPost', payload.parentId]);
      }
    });

    socket.on('stacksuite_showcase_created', (payload) => {
      queryClient.invalidateQueries(['showcases']);
    });

    socket.on('stacksuite_showcase_vote_update', (payload) => {
      if (payload?.showcaseId) {
        queryClient.invalidateQueries(['showcase', payload.showcaseId]);
        queryClient.invalidateQueries(['showcases']);
      }
    });

    socket.on('stacksuite_showcase_follow_update', (payload) => {
      if (payload?.showcaseId) {
        queryClient.invalidateQueries(['showcase', payload.showcaseId]);
        queryClient.invalidateQueries(['showcases']);
      }
    });

    // Saved items updates (user-specific)
    socket.on('saved_items_updated', (payload) => {
      // Refresh saved items list
      queryClient.invalidateQueries(['savedItems']);

      // Optionally refresh related item detail if provided
      if (payload?.itemType && payload?.itemId) {
        const keyMap = {
          idea: ['ideaDetail', payload.itemId],
          project: ['project', payload.itemId],
          showcase: ['showcase', payload.itemId],
          stackpost: ['stackPost', payload.itemId],
          collab: ['thread', payload.itemId],
        };
        const key = keyMap[payload.itemType];
        if (key) queryClient.invalidateQueries(key);
      }
    });

    socket.on('stacksuite_collab_created', (payload) => {
      queryClient.invalidateQueries(['collabThreads']);
    });

    socket.on('stacksuite_collab_vote_update', (payload) => {
      if (payload?.threadId) {
        queryClient.invalidateQueries(['thread', payload.threadId]);
        queryClient.invalidateQueries(['threads']);
      }
    });

    socket.on('stacksuite_collab_follow_update', (payload) => {
      if (payload?.threadId) {
        queryClient.invalidateQueries(['thread', payload.threadId]);
        queryClient.invalidateQueries(['threads']);
      }
    });

    return () => {
      try { socket.disconnect(); } catch (e) {}
    };
  // Recreate socket when token or user changes
  }, [token, user, queryClient]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
