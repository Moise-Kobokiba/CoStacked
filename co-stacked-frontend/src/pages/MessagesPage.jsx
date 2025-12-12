// src/pages/MessagesPage.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom'; // Import useLocation
import styles from './MessagesPage.module.css';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';

// Import hooks and actions
import { useSocket } from '../hooks/useSocket';
import { fetchConversations, fetchMessages } from '../features/messages/messagesSlice';

const LoadingSpinner = () => <div className={styles.placeholder}><p>Loading conversations...</p></div>;

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

export const MessagesPage = () => {
  const dispatch = useDispatch();
  const location = useLocation(); // Use location hook
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const { user: currentUser } = useSelector(state => state.auth);
  const { 
    conversations, 
    messagesByConversation, 
    status: messagesStatus 
  } = useSelector(state => state.messages);
  
  const socket = useSocket(currentUser?._id);
  
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  
  // Set initial selected conversation from location state if exists
  useEffect(() => {
    if (location.state?.conversationId) {
      setSelectedConversationId(location.state.conversationId);
      // Clear state so refresh doesn't stick? Or leave it. Leaving it is fine.
    }
  }, [location.state]);

  useEffect(() => {
    if (messagesStatus === 'idle') {
      dispatch(fetchConversations());
    }
  }, [messagesStatus, dispatch]);
  
  useEffect(() => {
    if (selectedConversationId && !messagesByConversation[selectedConversationId]) {
      dispatch(fetchMessages(selectedConversationId));
    }
  }, [selectedConversationId, messagesByConversation, dispatch]);

  useEffect(() => {
    if (!isMobile && conversations.length > 0 && !selectedConversationId && !location.state?.conversationId) {
       // Only default select if no state was provided
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId, isMobile, location.state]);

  // --- 3. NEW EFFECT: Join and leave socket rooms ---
  useEffect(() => {
    if (socket && selectedConversationId) {
      // Tell the server we want to join this conversation's room
      socket.emit('join_conversation', selectedConversationId);
      
      // Cleanup: When the selected conversation changes or component unmounts,
      // you could optionally leave the room, but it's often not necessary.
    }
  }, [socket, selectedConversationId]);


  if (!currentUser) {
    return <LoadingSpinner />;
  }
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const selectedConversation = conversations.find(c => c._id === selectedConversationId);
  const messages = selectedConversationId ? (messagesByConversation[selectedConversationId] || []) : [];

  const pageContainerClass = `${styles.pageContainer} ${isMobile && selectedConversationId ? styles.chatActive : ''}`;
  
  return (
    <div className={pageContainerClass}>
      <div className={styles.conversationListWrapper}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          currentUserId={currentUser._id}
        />
      </div>
      <div className={styles.chatWindowWrapper}>
        {messagesStatus === 'loading' && conversations.length === 0 ? (
             <div className={styles.placeholder}><p>Loading...</p></div>
        ) : selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUser._id}
            onBack={handleBackToList}
            socket={socket} // <-- 4. PASS the socket instance down to the ChatWindow
          />
        ) : (
          <div className={styles.placeholder}>
            {conversations.length > 0
              ? <p>Select a conversation to start chatting.</p>
              : <p>You have no conversations yet.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
};