// src/components/stack-suite/CommentThread.jsx

import { useState } from 'react';
import { ArrowBigUp, Reply, Heart, Send } from 'lucide-react';
import styles from './StackSuite.module.css';

const roleBadgeClass = {
  Founder:   styles.badgeFounder,
  Developer: styles.badgeDeveloper,
  Designer:  styles.badgeDesigner,
  Mentor:    styles.badgeMentor,
};

function SingleComment({ comment, depth = 0, onReplySubmit }) {
  const [upvoted, setUpvoted]           = useState(false);
  const [liked, setLiked]               = useState(false);
  const [upvoteCount, setUpvoteCount]   = useState(comment.upvotes);
  const [likeCount, setLikeCount]       = useState(comment.likes);
  const [showReply, setShowReply]       = useState(false);
  const [replyText, setReplyText]       = useState('');

  const handleUpvote = () => {
    setUpvoteCount(c => upvoted ? c - 1 : c + 1);
    setUpvoted(v => !v);
  };

  const handleLike = () => {
    setLikeCount(c => liked ? c - 1 : c + 1);
    setLiked(v => !v);
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReplySubmit(comment.id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <div className={depth > 0 ? styles.commentNested : ''}>
      <div className={styles.commentItem}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className={`${styles.avatar} ${styles.avatarMd}`}>
            {comment.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor}>{comment.author}</span>
              <span className={`${styles.badge} ${roleBadgeClass[comment.role] || styles.badgeGeneral}`} style={{ fontSize: 10 }}>
                {comment.role}
              </span>
              <span className={styles.commentTime}>{comment.time}</span>
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
            </div>

            {showReply && (
              <div className={styles.replyForm}>
                <div className={styles.replyInputWrap}>
                  <textarea
                    className={styles.replyTextarea}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.author}...`}
                    rows={2}
                    aria-label={`Reply to ${comment.author}`}
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
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments: initialComments }) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleNewComment = () => {
    if (!newComment.trim()) return;
    const newC = {
      id: Date.now(),
      author: 'You',
      initials: 'YU',
      role: 'Developer',
      content: newComment.trim(),
      time: 'Just now',
      upvotes: 0,
      likes: 0,
      replies: [],
    };
    setComments(prev => [newC, ...prev]);
    setNewComment('');
  };

  const handleReplySubmit = (parentId, text) => {
    const reply = {
      id: Date.now(),
      author: 'You',
      initials: 'YU',
      role: 'Developer',
      content: text,
      time: 'Just now',
      upvotes: 0,
      likes: 0,
      replies: [],
    };
    const addReply = list => list.map(c => {
      if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply] };
      if (c.replies && c.replies.length > 0) return { ...c, replies: addReply(c.replies) };
      return c;
    });
    setComments(prev => addReply(prev));
  };

  return (
    <div className={styles.commentThread}>
      {/* New comment input */}
      <div className={styles.commentInput}>
        <div className={styles.commentInputBody}>
          <div className={`${styles.avatar} ${styles.avatarMd} ${styles.avatarPrimary}`}>
            YU
          </div>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            aria-label="Write a new comment"
          />
        </div>
        <div className={styles.commentInputFooter}>
          <span>Markdown supported</span>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={handleNewComment}
            disabled={!newComment.trim()}
          >
            <Send size={13} />
            Comment
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className={styles.commentList}>
        {comments.map(comment => (
          <SingleComment
            key={comment.id}
            comment={comment}
            onReplySubmit={handleReplySubmit}
          />
        ))}
      </div>
    </div>
  );
}
