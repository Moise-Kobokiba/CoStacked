// src/pages/MessagesPage.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import styles from './MessagesPage.module.css';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { ChatSidebar } from '../components/messaging/ChatSidebar';
import { MessageCircle } from 'lucide-react';

import { useSocketContext } from '../context/SocketContext';
import { fetchConversations, fetchMessages, accessConversation } from '../features/messages/messagesSlice';

const LoadingSpinner = () => (
  <div className={styles.placeholder}>
    <p>Loading conversations...</p>
  </div>
);

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
  const location = useLocation();
  const { userId } = useParams();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktopWide = useMediaQuery('(min-width: 1201px)');

  const { user: currentUser } = useSelector(state => state.auth);
  const {
    conversations,
    messagesByConversation,
    status: messagesStatus
  } = useSelector(state => state.messages);

  const socket = useSocketContext();

  const [selectedConversationId, setSelectedConversationId] = useState(null);

  // Scroll to top when navigating to MessagesPage
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set initial selected conversation from location state or URL params
  useEffect(() => {
    if (location.state?.conversationId) {
      setSelectedConversationId(location.state.conversationId);
    } else if (userId && conversations.length > 0) {
      const existingConversation = conversations.find(conv =>
        conv.participants.some(p => p._id === userId)
      );
      if (existingConversation) {
        setSelectedConversationId(existingConversation._id);
      } else {
        dispatch(accessConversation(userId))
          .unwrap()
          .then((conversation) => {
            setSelectedConversationId(conversation._id);
          })
          .catch((error) => {
            console.error('Failed to access conversation:', error);
          });
      }
    }
  }, [location.state, userId, conversations, dispatch]);

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
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId, isMobile, location.state]);

  useEffect(() => {
    if (socket && selectedConversationId) {
      socket.emit('join_conversation', selectedConversationId);
    }
  }, [socket, selectedConversationId]);

  if (!currentUser) {
    return <LoadingSpinner />;
  }
  
  const handleBackToList = () => {
    setSelectedConversationId(null);
  };

  const handleMuteToggle = (muted) => {
    console.log('Conversation mute toggled:', muted);
  };

  const handleBlockUser = () => {
    console.log('User blocked or group left');
  };

  const selectedConversation = conversations.find(c => c._id === selectedConversationId);
  const messages = selectedConversationId ? (messagesByConversation[selectedConversationId] || []) : [];

  const pageContainerClass = `${styles.pageContainer} ${isMobile && selectedConversationId ? styles.chatActive : ''}`;
  
  return (
    <div className={pageContainerClass}>
      {/* Left Sidebar - Conversation List */}
      <div className={styles.conversationListWrapper}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          currentUserId={currentUser._id}
        />
      </div>

      {/* Center Pane - Chat Window */}
      <div className={styles.chatWindowWrapper}>
        {messagesStatus === 'loading' && conversations.length === 0 ? (
          <div className={styles.placeholder}><p>Loading...</p></div>
        ) : selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUser._id}
            onBack={handleBackToList}
            socket={socket}
          />
        ) : (
          <div className={styles.placeholder}>
            <MessageCircle size={48} className={styles.placeholderIcon} />
            <h3>Your Messages</h3>
            {conversations.length > 0
              ? <p>Select a conversation to start chatting.</p>
              : <p>You have no conversations yet. Connect with team members to start messaging.</p>
            }
          </div>
        )}
      </div>

      {/* Right Sidebar - Contextual Details Panel */}
      {isDesktopWide && (
        <div className={styles.sidebarWrapper}>
          {selectedConversation ? (
            <ChatSidebar
              conversation={selectedConversation}
              currentUserId={currentUser._id}
              onMuteToggle={handleMuteToggle}
              onBlockUser={handleBlockUser}
            />
          ) : (
            <div className={styles.placeholder}>
              <MessageCircle size={32} className={styles.placeholderIcon} />
              <p>Select a chat to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};