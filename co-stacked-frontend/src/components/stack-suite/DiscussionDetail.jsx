// src/components/stack-suite/DiscussionDetail.jsx

import { useState } from 'react';
import { ArrowLeft, Eye, Pin, Loader2, ArrowBigUp, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { getStackPostById, getStackPosts, upvoteStackPost, deleteStackPost, getStackComments } from '../../api/stackSuiteApi';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

const categoryBadgeClass = {
  Validation: styles.badgeValidation,
  Tech:       styles.badgeTech,
  Equity:     styles.badgeEquity,
  Growth:     styles.badgeGrowth,
  Legal:      styles.badgeLegal,
  General:    styles.badgeGeneral,
};

const roleBadgeClass = {
  Founder:   styles.badgeFounder,
  Developer: styles.badgeDeveloper,
};

export function DiscussionDetail({ discussionId, onBack }) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  const currentUser = useSelector((state) => state.auth.user);

  // Fetch single post
  const { data: discussion, isLoading } = useQuery({
    queryKey: ['stackPost', discussionId],
    queryFn: () => getStackPostById(discussionId),
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'post', discussionId],
    queryFn: () => getStackComments('post', discussionId),
    enabled: !!discussionId,
  });

  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteStackPost(id),
    onSuccess: (res, id) => {
      queryClient.setQueryData(['stackPost', id], prev => ({
        ...prev,
        upvoteCount: res.upvoteCount,
        isUpvoted: res.isUpvoted
      }));
      queryClient.invalidateQueries(['stackPosts']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStackPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['stackPosts']);
      onBack();
    },
    onError: (err) => {
      alert(`Failed to delete post: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deleteMutation.mutate(discussionId);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: discussion.title,
      text: discussion.body,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const isBookmarked = currentUser?.bookmarks?.some(b => b.itemId === discussionId && b.itemType === 'post');

  if (isLoading || !discussion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className="animate-spin" size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const initials = discussion.author?.name ? discussion.author.name.slice(0, 2).toUpperCase() : 'U';
  const isAuthor = currentUser && (currentUser._id === (discussion.author?._id || discussion.author) || currentUser.id === (discussion.author?._id || discussion.author));

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <button 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }} 
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Back to List
      </button>

      <article style={{ background: 'var(--card-background)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span className={`${styles.badge} ${categoryBadgeClass[discussion.category] || styles.badgeGeneral}`}>
            {discussion.category}
          </span>
          {discussion.pinned && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '99px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
              <Pin size={10} /> Pinned
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{discussion.time}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            <Eye size={12} /> {discussion.viewCount || 0} views
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--foreground)', lineHeight: '1.25' }}>
          {discussion.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--input-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '700', overflow: 'hidden' }}>
            {discussion.author?.avatarUrl ? (
              <img src={discussion.author.avatarUrl} alt={discussion.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>{discussion.author?.name || 'Unknown User'}</span>
              <span className={`${styles.badge} ${roleBadgeClass[discussion.author?.role] || styles.badgeDeveloper}`} style={{ fontSize: '10px' }}>
                {discussion.author?.role || 'Developer'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Posted {discussion.time}</p>
          </div>
          
          {isAuthor && (
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              style={{ fontSize: '12px', fontWeight: '600', color: 'var(--destructive)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {deleteMutation.isLoading ? <Loader2 size={12} className="animate-spin" /> : 'Delete Post'}
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: '2rem', opacity: 0.9 }}>
          {discussion.body}
        </div>

        {discussion.tags && discussion.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {discussion.tags.map(tag => (
              <span key={tag} className={styles.chip} style={{ fontSize: '11px' }}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => upvoteMutation.mutate(discussion._id)}
              className={`${styles.upvoteBtn} ${discussion.isUpvoted ? styles.upvoteBtnActive : ''}`}
            >
              <ArrowBigUp size={20} />
              <span style={{ fontWeight: '700' }}>{discussion.upvoteCount}</span>
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              <MessageSquare size={16} /> {discussion.commentCount || 0} comments
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => dispatch(toggleBookmark({ itemId: discussionId, itemType: 'post' }))}
              className={styles.iconBtn}
              style={{ color: isBookmarked ? 'var(--star-color)' : 'var(--muted-foreground)' }}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className={styles.iconBtn}>
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </article>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
          Comments ({discussion.commentCount || 0})
        </h2>
        {commentsLoading ? (
           <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Loading comments...</p>
        ) : (
           <CommentThread 
             comments={comments} 
             parentType="post"
             parentId={discussion._id}
           />
        )}
      </div>
    </div>
  );
}
