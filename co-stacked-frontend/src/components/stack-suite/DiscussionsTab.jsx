// src/components/stack-suite/DiscussionsTab.jsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Eye, ChevronUp, ChevronDown, Loader2,
  MessageSquare, Bookmark, Share2, ArrowLeft, Edit2, Trash2
} from 'lucide-react';
import { getStackPosts, upvoteStackPost, downvoteStackPost, deleteStackPost } from '../../api/stackSuiteApi';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

/* ─── Category Badge Map ─── */
const categoryBadge = {
  Validation: styles.badgeValidation,
  Tech:       styles.badgeTech,
  Equity:     styles.badgeEquity,
  Growth:     styles.badgeGrowth,
  Legal:      styles.badgeLegal,
  General:    styles.badgeGeneral,
};

/* ─── Detail View ─── */
function DiscussionDetailView({ postId, onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['stackPost', postId],
    queryFn: () => getStackPosts({ id: postId }).then(items => {
      if (Array.isArray(items)) return items.find(i => i._id === postId);
      return items;
    }),
  });

  const upvoteMutation = useMutation({
    mutationFn: upvoteStackPost,
    onSuccess: (data) => {
      queryClient.setQueryData(['stackPost', postId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries({ queryKey: ['stackPosts'] });
    }
  });

  const downvoteMutation = useMutation({
    mutationFn: downvoteStackPost,
    onSuccess: (data) => {
      queryClient.setQueryData(['stackPost', postId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries({ queryKey: ['stackPosts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStackPost,
    onSuccess: () => { queryClient.invalidateQueries(['stackPosts']); onBack(); }
  });

  if (isLoading || !post) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const isOwner = user && post.author && user._id === post.author._id;
  const isBookmarked = user?.bookmarks?.some(b => b.itemId === postId && b.itemType === 'stackPost');
  const netScore = (post.upvoteCount || 0) - (post.downvoteCount || 0);

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.body, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }
    } catch (err) { console.error('Share error:', err); }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this post? This action cannot be undone.')) {
      deleteMutation.mutate(postId);
    }
  };

  return (
    <div className={styles.detailContainer}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Discussions
      </button>
      <article className={styles.card} style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Vote column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 40 }}>
            <button
              className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${post.isUpvoted ? styles.upvoteBtnActive : ''}`}
              aria-label="Upvote"
              onClick={() => upvoteMutation.mutate(postId)}
            >
              <ChevronUp size={16} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: netScore > 0 ? 'var(--primary)' : 'var(--foreground)' }}>
              {netScore}
            </span>
            <button
              className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${post.isDownvoted ? styles.upvoteBtnActive : ''}`}
              aria-label="Downvote"
              onClick={() => downvoteMutation.mutate(postId)}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {post.category && (
                <span className={`${styles.badge} ${categoryBadge[post.category] || styles.badgeGeneral}`}>
                  {post.category}
                </span>
              )}
              {post.tags?.slice(0, 3).map(tag => (
                <span key={tag} className={styles.chip}>#{tag}</span>
              ))}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)', wordBreak: 'break-word' }}>
              {post.title}
            </h1>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)', opacity: 0.9, whiteSpace: 'pre-line', marginBottom: 20, wordBreak: 'break-word' }}>
              {post.body}
            </div>
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid var(--border)', marginBottom: 16 }}>
              <div
                className={`${styles.avatar} ${styles.avatarMd} ${styles.avatarPrimary}`}
                style={{ cursor: 'pointer' }}
                onClick={() => { if (post.author?._id) navigate(`/profile/${post.author._id}`); }}
              >
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt={post.author.name} />
                ) : (
                  post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U'
                )}
              </div>
              <div>
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}
                  onClick={() => { if (post.author?._id) navigate(`/profile/${post.author._id}`); }}
                >
                  {post.author?.name || 'Anonymous'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 12 }}>
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
              {isOwner && (
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button onClick={handleDelete} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)', fontSize: 13 }}>
                <MessageSquare size={15} />
                <span>{post.commentCount || 0} Comments</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)', fontSize: 13 }}>
                <Eye size={15} />
                <span>{post.viewCount || post.views || 0} views</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button onClick={() => dispatch(toggleBookmark({ itemId: postId, itemType: 'stackPost' }))}
                  className={styles.iconBtn}
                  style={{ color: isBookmarked ? 'var(--star-color)' : 'var(--muted-foreground)' }}>
                  <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleShare} className={styles.iconBtn}>
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Discussion ({post.commentCount || 0})
        </h2>
        <CommentThread comments={[]} parentType="post" parentId={post._id} />
      </div>
    </div>
  );
}

/* ─── List View ─── */
export function DiscussionsTab({ search, tagFilter, onTagClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['stackPosts', { search }],
    queryFn: () => getStackPosts({ search }),
  });

  // Client-side tag filtering
  const filtered = tagFilter
    ? posts.filter(p => p.tags?.some(t => t.toLowerCase() === tagFilter.toLowerCase()))
    : posts;

  if (selectedId) {
    return <DiscussionDetailView postId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-background)', borderRadius: 16, border: '1px solid var(--border)' }}>
        <MessageCircle size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No discussions found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Start a new conversation or adjust your filters.</p>
      </div>
    );
  }

  const handleUpvote = (e, postId) => {
    e.stopPropagation();
    queryClient.setQueryData(['stackPosts', { search }], (old) =>
      old?.map(p => p._id === postId ? { ...p, upvoteCount: (p.upvoteCount || 0) + (p.isUpvoted ? -1 : 1), isUpvoted: !p.isUpvoted, isDownvoted: false, downvoteCount: p.isDownvoted ? (p.downvoteCount || 1) - 1 : (p.downvoteCount || 0) } : p)
    );
    upvoteStackPost(postId).catch(() => queryClient.invalidateQueries({ queryKey: ['stackPosts', { search }] }));
  };

  const handleDownvote = (e, postId) => {
    e.stopPropagation();
    queryClient.setQueryData(['stackPosts', { search }], (old) =>
      old?.map(p => p._id === postId ? { ...p, downvoteCount: (p.downvoteCount || 0) + (p.isDownvoted ? -1 : 1), isDownvoted: !p.isDownvoted, isUpvoted: false, upvoteCount: p.isUpvoted ? (p.upvoteCount || 1) - 1 : (p.upvoteCount || 0) } : p)
    );
    downvoteStackPost(postId).catch(() => queryClient.invalidateQueries({ queryKey: ['stackPosts', { search }] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {filtered.map(post => {
        const netScore = (post.upvoteCount || 0) - (post.downvoteCount || 0);
        return (
          <article
            key={post._id}
            className={styles.card}
            style={{ padding: 16, cursor: 'pointer', width: '100%' }}
            onClick={() => setSelectedId(post._id)}
          >
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {/* Vote column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 36 }}>
                <ChevronUp size={18}
                  style={{ color: post.isUpvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                  onClick={(e) => handleUpvote(e, post._id)} />
                <span style={{ fontSize: 14, fontWeight: 700, color: netScore > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                  {netScore}
                </span>
                <ChevronDown size={18}
                  style={{ color: post.isDownvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                  onClick={(e) => handleDownvote(e, post._id)} />
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {post.category && (
                    <span className={`${styles.badge} ${categoryBadge[post.category] || styles.badgeGeneral}`}>
                      {post.category}
                    </span>
                  )}
                  {post.tags?.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className={styles.chip}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: 10, wordBreak: 'break-word' }}>
                  {post.body}
                </p>
                {/* Author chip + metrics */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className={`${styles.avatar} ${styles.avatarSm}`}
                      style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); if (post.author?._id) navigate(`/profile/${post.author._id}`); }}
                    >
                      {post.author?.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt={post.author.name} />
                      ) : (
                        post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U'
                      )}
                    </div>
                    <span
                      style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); if (post.author?._id) navigate(`/profile/${post.author._id}`); }}
                    >
                      {post.author?.name || 'Anonymous'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted-foreground)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <Eye size={13} /> {post.viewCount || post.views || 0}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <MessageCircle size={13} /> {post.commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}