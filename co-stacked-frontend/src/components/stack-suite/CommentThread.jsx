// src/components/stack-suite/CommentThread.jsx

import { useState } from 'react';
import { ArrowBigUp, Reply, Heart, Send, Loader2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addStackComment, upvoteStackComment, likeStackComment, deleteStackComment } from '../../api/stackSuiteApi';
import styles from './StackSuite.module.css';
import { useSelector } from 'react-redux';

const roleBadgeClass = {
  Founder:   styles.badgeFounder,
  Developer: styles.badgeDeveloper,
  Designer:  styles.badgeDesigner,
  Mentor:    styles.badgeMentor,
};

function SingleComment({ comment, depth = 0, onReplySubmit, parentType, parentId, invalidateParent }) {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  
  const [upvoted, setUpvoted]           = useState(comment.isUpvoted || false);
  const [liked, setLiked]               = useState(comment.isLiked || false);
  const [upvoteCount, setUpvoteCount]   = useState(comment.upvotes?.length || comment.upvoteCount || 0);
  const [likeCount, setLikeCount]       = useState(comment.likes?.length || comment.likeCount || 0);
  const [showReply, setShowReply]       = useState(false);
  const [replyText, setReplyText]       = useState('');

  const handleUpvote = async () => {
    setUpvoteCount(c => upvoted ? c - 1 : c + 1);
    setUpvoted(v => !v);
    try {
      await upvoteStackComment(comment._id || comment.id);
    } catch (err) {
      setUpvoteCount(c => upvoted ? c + 1 : c - 1);
      setUpvoted(v => !v);
    }
  };

  const handleLike = async () => {
    setLikeCount(c => liked ? c - 1 : c + 1);
    setLiked(v => !v);
    try {
      await likeStackComment(comment._id || comment.id);
    } catch (err) {
      setLikeCount(c => liked ? c + 1 : c - 1);
      setLiked(v => !v);
    }
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReplySubmit(comment._id || comment.id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    }
  };
  
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStackComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['stackComments', parentType, parentId]);
      invalidateParent();
    },
    onError: (err) => {
      alert(`Failed to delete comment: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate(comment._id || comment.id);
    }
  };
  
  const authorName = comment.author?.name || comment.author || 'Unknown';
  const authorInitials = authorName.slice(0, 2).toUpperCase();
  const authorRole = comment.author?.role || comment.role || 'Member';
  
  const isAuthor = currentUser && (currentUser._id === (comment.author?._id || comment.author) || currentUser.id === (comment.author?._id || comment.author));

  return (
    <div className={depth > 0 ? styles.commentNested : ''}>
      <div className={styles.commentItem}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className={`${styles.avatar} ${styles.avatarMd}`}>
            {comment.author?.avatarUrl ? (
              <img src={comment.author.avatarUrl} alt={authorName} />
            ) : (
              authorInitials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor}>{authorName}</span>
              <span className={`${styles.badge} ${roleBadgeClass[authorRole] || styles.badgeGeneral}`} style={{ fontSize: 10 }}>
                {authorRole}
              </span>
              <span className={styles.commentTime}>
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : comment.time || 'Just now'}
              </span>
            </div>

            <p className={styles.commentBody}>{comment.content}</p>

            <div className={styles.commentActions}>
              <button
                onClick={handleUpvote}
                className={`${styles.commentActionBtn} ${upvoted ? styles.commentActionBtnActive : ''}`}
                aria-label={`Upvote comment, count ${upvoteCount}`}
              >
                <ArrowBigUp size={14} />
                <span>{upvoteCount}</span>
              </button>
              <button
                onClick={handleLike}
                className={`${styles.commentActionBtn} ${liked ? styles.commentActionBtnLikedActive : ''}`}
                aria-label={`Like comment, count ${likeCount}`}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>
              <button
                onClick={() => setShowReply(v => !v)}
                className={styles.commentActionBtn}
              >
                <Reply size={14} />
                <span>Reply</span>
              </button>
              {isAuthor && (
                <button
                  onClick={handleDelete}
                  className={styles.commentActionBtn}
                  style={{ color: 'var(--destructive)', marginLeft: 'auto' }}
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? <Loader2 size={13} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                  <span>Delete</span>
                </button>
              )}
            </div>

            {showReply && (
              <div className={styles.replyForm}>
                <div className={styles.replyInputWrap}>
                  <textarea
                    className={styles.replyTextarea}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${authorName}...`}
                    rows={2}
                    aria-label={`Reply to ${authorName}`}
                  />
                  <div className={styles.replyActions}>
                    <button
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => { setShowReply(false); setReplyText(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                      onClick={handleSubmitReply}
                      disabled={!replyText.trim()}
                    >
                      <Send size={11} />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => (
            <SingleComment
              key={reply._id || reply.id}
              comment={reply}
              depth={depth + 1}
              onReplySubmit={onReplySubmit}
              parentType={parentType}
              parentId={parentId}
              invalidateParent={invalidateParent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments = [], parentType, parentId }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Helper to invalidate parent queries when comment count changes
  const invalidateParent = () => {
    // 1. Invalidate the specific detail query
    const detailKey = parentType === 'post' ? 'stackPost' 
                    : parentType === 'showcase' ? 'showcase' 
                    : 'thread';
    queryClient.invalidateQueries([detailKey, parentId]);

    // 2. Invalidate the list query
    const listKey = parentType === 'post' ? 'stackPosts'
                  : parentType === 'showcase' ? 'showcases'
                  : 'threads';
    queryClient.invalidateQueries({ queryKey: [listKey] });
  };

  const addCommentMutation = useMutation({
    mutationFn: ({ content, parentCommentId }) => addStackComment(parentType, parentId, content, parentCommentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['stackComments', parentType, parentId]);
      invalidateParent();
      setNewComment('');
    },
    onError: (error) => {
      alert(`Failed to post comment: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleNewComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleReplySubmit = (parentCommentId, text) => {
    addCommentMutation.mutate({ content: text, parentCommentId });
  };

  return (
    <div className={styles.commentThread}>
      {/* New comment input */}
      <div className={styles.commentInput}>
        <div className={styles.commentInputBody}>
          <div className={`${styles.avatar} ${styles.avatarMd} ${styles.avatarPrimary}`}>
            ME
          </div>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            aria-label="Write a new comment"
            disabled={addCommentMutation.isLoading}
          />
        </div>
        <div className={styles.commentInputFooter}>
          <span>Markdown supported</span>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={handleNewComment}
            disabled={!newComment.trim() || addCommentMutation.isLoading}
          >
            {addCommentMutation.isLoading ? <Loader2 size={13} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            {addCommentMutation.isLoading ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className={styles.commentList}>
        {comments.map(comment => (
          <SingleComment
            key={comment._id || comment.id}
            comment={comment}
            onReplySubmit={handleReplySubmit}
            parentType={parentType}
            parentId={parentId}
            invalidateParent={invalidateParent}
          />
        ))}
      </div>
    </div>
  );
}
