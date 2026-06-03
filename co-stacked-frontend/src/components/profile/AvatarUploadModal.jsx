// src/components/profile/AvatarUploadModal.jsx

import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadAvatar } from '../../features/auth/authSlice'; // We will create this action next

import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { Loader2, UploadCloud } from 'lucide-react';
import styles from './AvatarUploadModal.module.css';
import PropTypes from 'prop-types';

export const AvatarUploadModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector(state => state.auth); // We'll use the auth slice's status

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      // Create a temporary URL for the image preview
      setPreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedFile); // The key 'avatar' must match the backend route

    const resultAction = await dispatch(uploadAvatar(formData));
    if (uploadAvatar.fulfilled.match(resultAction)) {
      // On success, close the modal
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <header className={styles.header}>
        <h1 className={styles.title}>Update Profile Picture</h1>
      </header>
      <div className={styles.content}>
        <div 
          className={styles.dropzone}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg"
            style={{ display: 'none' }}
          />
          {preview ? (
            <img src={preview} alt="Avatar preview" className={styles.previewImage} />
          ) : (
            <div className={styles.placeholder}>
              <UploadCloud size={48} className={styles.uploadIcon} />
              <p>Click to select an image</p>
              <span>PNG, JPG, or JPEG</span>
            </div>
          )}
        </div>

        {status === 'failed' && error && <p className={styles.error}>{error}</p>}
      </div>
      <footer className={styles.footer}>
        <Button variant="secondary" onClick={handleClose} disabled={status === 'loading'}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!selectedFile || status === 'loading'}>
          {status === 'loading' ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Uploading...
            </>
          ) : (
            'Save & Upload'
          )}
        </Button>
      </footer>
    </Dialog>
  );
};

AvatarUploadModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};