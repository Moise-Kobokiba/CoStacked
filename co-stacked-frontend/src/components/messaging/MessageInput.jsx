// src/components/messaging/MessageInput.jsx

import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Textarea } from '../shared/Textarea';
import { Button } from '../shared/Button';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { sendFileMessage, addMessage } from '../../features/messages/messagesSlice';
import styles from './ChatWindow.module.css';
import { Send, Mic, Trash2, Paperclip, Loader2, Play } from 'lucide-react';
import PropTypes from 'prop-types';

export const MessageInput = ({ socket, conversationId, currentUserId }) => {
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const { isRecording, startRecording, stopRecording, audioBlob, clearRecording } = useAudioRecorder();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Send a text message via WebSocket
  const handleSendText = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    // Create a temporary message object for optimistic UI update
    const messageData = {
      conversationId,
      sender: { _id: currentUserId }, // Minimal sender info is enough for the socket
      type: 'text',
      content: text,
      _id: `temp_${Date.now()}`, // Temporary ID
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // Send the message to the server via WebSocket
    socket.emit('send_message', messageData);
    // Immediately add the message to our own UI
    dispatch(addMessage(messageData));
    setText('');
  };

  // Upload any file (image, doc, or the recorded audio blob)
  const handleSendFile = async (file) => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    // 'chatFile' must match the backend middleware: `chatUpload.single('chatFile')`
    formData.append('chatFile', file, file.name);

    const resultAction = await dispatch(sendFileMessage({ conversationId, formData }));
    
    if (sendFileMessage.fulfilled.match(resultAction)) {
      // After a successful upload, the backend returns the final, populated message object.
      // We broadcast this final object to the other user.
      socket.emit('send_message', resultAction.payload);
    } else {
      alert('File upload failed. Please try again.');
    }
    setIsUploading(false);
  };
  
  // Handler for when the user clicks "Send" on a recorded audio note
  const handleAudioSend = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      handleSendFile(audioFile);
      clearRecording(); // Clear the recorded blob
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSendFile(e.target.files[0]);
    }
  };

  // Special UI state for when the user is recording or has recorded audio
  if (isRecording || audioBlob) {
    return (
      <div className={styles.footer}>
        <Button 
          onClick={isRecording ? stopRecording : clearRecording} 
          variant="destructive" 
          aria-label={isRecording ? "Stop recording" : "Cancel recording"}
        >
          {isRecording ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
        </Button>
        <div className={styles.recordingIndicator}>
          {isRecording ? "Recording..." : "Ready to send"}
        </div>
        <Button onClick={handleAudioSend} disabled={isRecording}>
          <Send size={18} />
        </Button>
      </div>
    );
  }

  // Default UI state for typing text and uploading files
  return (
    <form className={styles.footer} onSubmit={handleSendText}>
      {/* Hidden file input */}
      <input 
        type="file" 
        id="file-upload" 
        ref={fileInputRef}
        style={{display: 'none'}} 
        onChange={handleFileChange} 
      />
      
      {/* Attachment Button */}
      <Button 
        type="button" 
        onClick={() => fileInputRef.current.click()} 
        variant="secondary" 
        aria-label="Attach file"
        disabled={isUploading}
      >
        <Paperclip size={18} />
      </Button>
      
      {/* Microphone Button */}
      <Button 
        type="button" 
        onClick={startRecording} 
        variant="secondary" 
        aria-label="Record voice note"
        disabled={isUploading}
      >
        <Mic size={18} />
      </Button>

      {/* Textarea for typing */}
      <Textarea 
        placeholder="Type a message..." 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        rows={1} 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText(e);
          }
        }}
      />

      {/* Send Button */}
      <Button type="submit" disabled={isUploading || !text.trim()}>
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </Button>
    </form>
  );
};

MessageInput.propTypes = {
  socket: PropTypes.object,
  conversationId: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
};