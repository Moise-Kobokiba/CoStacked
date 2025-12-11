// src/hooks/useAudioRecorder.js

import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /**
   * Requests microphone access and begins recording.
   * Handles errors gracefully if permission is denied.
   */
  const startRecording = useCallback(async () => {
    // Check if a recording is already in progress
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      return;
    }

    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a new MediaRecorder instance with the stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Clear any previous audio chunks
      audioChunksRef.current = [];

      // Event listener for when data is available (i.e., a chunk of audio)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Event listener for when the recording is stopped
      mediaRecorder.onstop = () => {
        // Combine all the audio chunks into a single Blob
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob); // Set the final audio file in state
        audioChunksRef.current = [];
        
        // Important: Stop the media stream tracks to turn off the microphone light
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null); // Clear any previous recording
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Inform the user if they have denied microphone permission
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. To record a voice note, please allow microphone access in your browser settings.");
      }
    }
  }, []);

  /**
   * Stops the current recording session.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // The `onstop` event handler will handle the rest
    setIsRecording(false);
  }, []);

  /**
   * Clears a recorded audio blob without sending it.
   */
  const clearRecording = useCallback(() => {
    setAudioBlob(null);
  }, []);

  // The hook returns the state and the functions to control it.
  return { isRecording, startRecording, stopRecording, audioBlob, clearRecording };
};