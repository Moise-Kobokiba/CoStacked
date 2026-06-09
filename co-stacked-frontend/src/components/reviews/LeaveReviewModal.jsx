// src/components/reviews/LeaveReviewModal.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReview } from '../../features/reviews/reviewsSlice';

import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { Label } from '../shared/Label';
import { Select } from '../shared/Select';
import { Textarea } from '../shared/Textarea';
import { StarRating } from '../shared/StarRating';
import { Loader2 } from 'lucide-react';
import styles from './LeaveReviewModal.module.css';
import PropTypes from 'prop-types';

export const LeaveReviewModal = ({ open, onClose, developer, reviewableProjects }) => {
  const dispatch = useDispatch();
  const { createStatus, error } = useSelector(state => state.reviews);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [projectId, setProjectId] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setValidationError('');
      // Set the default selected project to the first one in the list
      if (reviewableProjects.length > 0) {
        setProjectId(reviewableProjects[0]?.projectId?._id || '');
      }
    }
  }, [open, reviewableProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !projectId || !comment.trim()) {
      setValidationError('Please select a project, choose a star rating, and write your review.');
      return;
    }
    setValidationError('');
    const reviewData = { rating, comment: comment.trim(), developerId: developer._id, projectId };
    const resultAction = await dispatch(createReview(reviewData));
    if (createReview.fulfilled.match(resultAction)) {
      setTimeout(() => onClose(), 1500); // Close modal on success
    }
  };
  
  const projectOptions = reviewableProjects.map(conn => ({
      value: conn.projectId._id,
      label: conn.projectId.title,
  }));

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <header className={styles.header}>
        <h1 className={styles.title}>Leave a Review for {developer.name}</h1>
      </header>
      
      {createStatus === 'succeeded' ? (
        <div className={styles.successMessage}>Thank you for your feedback!</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <Label>Select Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projectOptions} />
          </div>
          <div className={styles.formGroup}>
            <Label>Your Rating</Label>
            <StarRating rating={rating} onRatingChange={setRating} isEditable={true} />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="comment">Comment</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} required />
          </div>

          {(validationError || createStatus === 'failed') && (
            <p className={styles.error}>{validationError || error}</p>
          )}
          
          <footer className={styles.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createStatus === 'loading'}>
              {createStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Submit Review'}
            </Button>
          </footer>
        </form>
      )}
    </Dialog>
  );
};

LeaveReviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  developer: PropTypes.object.isRequired,
  reviewableProjects: PropTypes.array.isRequired,
};