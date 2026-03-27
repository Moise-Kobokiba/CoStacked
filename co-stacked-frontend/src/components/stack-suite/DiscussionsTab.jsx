// src/components/stack-suite/DiscussionsTab.jsx

import { useState } from 'react';
import { ArrowBigUp, MessageSquare, ArrowLeft, Eye, Bookmark, Share2, Pin, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStackPosts, upvoteStackPost, getStackComments, addStackComment, upvoteStackComment, likeStackComment } from '../../api/stackSuiteApi';
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

/* ─────────── Detail View ─────────── */
function DiscussionDetail({ discussionId, onBack }) {
  const queryClient = useQueryClient();
  const [bookmarked, setBookmarked] = useState(false);

  // 1. Fetch the single post
  const { data: discussion, isLoading } = useQuery({
    queryKey: ['stackPost', discussionId],
    queryFn: () => getStackPosts().then(posts => posts.find(p => p._id === discussionId)), // For simplicity, grab from list or hit details
  });

  // 2. Fetch comments for this post
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'post', discussionId],
    queryFn: () => getStackComments('post', discussionId),
    enabled: !!discussionId,
  });

  // 3. Upvote Mutation
  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteStackPost(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['stackPost', id]);
      const prev = queryClient.getQueryData(['stackPost', id]);
      if (prev) {
        queryClient.setQueryData(['stackPost', id], {
          ...prev,
          upvoteCount: prev.isUpvoted ? prev.upvoteCount - 1 : prev.upvoteCount + 1,
          isUpvoted: !prev.isUpvoted,
        });
      }
      return { prev };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['stackPost', id], context.prev);
    },
    onSettled: (id) => {
      queryClient.invalidateQueries(['stackPost', id]);
      queryClient.invalidateQueries(['stackPosts']);
    }
  });

  if (isLoading || !discussion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const initials = discussion.author?.name ? discussion.author.name.slice(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Discussions
      </button>

      <article className={styles.card} style={{ padding: 24, marginBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className={`${styles.badge} ${categoryBadgeClass[discussion.category] || styles.badgeGeneral}`}>
            {discussion.category}
          </span>
          {discussion.pinned && (
            <span className={`${styles.badge} ${styles.badgePinned}`}>
              <Pin size={11} /> Pinned
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{discussion.time}</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={13} /> {discussion.viewCount || 0} views
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, lineHeight: 1.3, color: 'var(--foreground)' }}>
          {discussion.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className={`${styles.avatar} ${styles.avatarLg}`}>{initials}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{discussion.author?.name || 'Unknown User'}</span>
              <span className={`${styles.badge} ${roleBadgeClass[discussion.author?.role] || styles.badgeDeveloper}`} style={{ fontSize: 10 }}>{discussion.author?.role || 'Developer'}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Posted {discussion.time}</p>
          </div>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9 }}>
          {discussion.body}
        </div>

        {discussion.tags && discussion.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {discussion.tags.map(tag => (
              <span key={tag} className={styles.chip}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => upvoteMutation.mutate(discussion._id)}
              className={`${styles.upvoteBtn} ${discussion.isUpvoted ? styles.upvoteBtnActive : ''}`}
            >
              <ArrowBigUp size={20} />
              <span>{discussion.upvoteCount}</span>
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={15} /> {discussion.commentCount || 0} comments
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setBookmarked(v=>!v)}
              className={`${styles.iconBtn} ${bookmarked ? styles.iconBtnActive : ''}`}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className={styles.iconBtn} aria-label="Share">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </article>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Comments ({discussion.commentCount || 0})
        </h2>
        {commentsLoading ? (
           <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Loading comments...</p>
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

/* ─────────── List View ─────────── */
export function DiscussionsTab({ search, category }) {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['stackPosts', { search, category }],
    queryFn: () => getStackPosts({ search, category }),
  });

  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteStackPost(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['stackPosts']);
      const prev = queryClient.getQueryData(['stackPosts', { search, category }]);
      if (prev) {
        queryClient.setQueryData(['stackPosts', { search, category }], prev.map(p => {
          if (p._id === id) {
            return {
              ...p,
              upvoteCount: p.isUpvoted ? p.upvoteCount - 1 : p.upvoteCount + 1,
              isUpvoted: !p.isUpvoted,
            };
          }
          return p;
        }));
      }
      return { prev };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['stackPosts', { search, category }], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['stackPosts']);
    }
  });

  if (selectedId) {
    return <DiscussionDetail discussionId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-background)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <MessageSquare size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No discussions found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Be the first to start a conversation in this category.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {posts.map(post => (
        <article
          key={post._id}
          className={styles.card}
          style={{ padding: 20, cursor: 'pointer' }}
          onClick={() => setSelectedId(post._id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(post._id); }}}
          aria-label={`Open discussion: ${post.title}`}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Upvote column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
              <button
                onClick={e => { e.stopPropagation(); upvoteMutation.mutate(post._id); }}
                className={`${styles.upvoteBtn} ${post.isUpvoted ? styles.upvoteBtnActive : ''}`}
                style={{ flexDirection: 'column', padding: '6px 10px', gap: 2 }}
                aria-label={`Upvote, count ${post.upvoteCount}`}
              >
                <ArrowBigUp size={20} />
                <span style={{ fontSize: 11 }}>{post.upvoteCount}</span>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`${styles.badge} ${categoryBadgeClass[post.category] || styles.badgeGeneral}`}>{post.category}</span>
                {post.pinned && (
                  <span className={`${styles.badge} ${styles.badgePinned}`} style={{ fontSize: 10 }}>
                    <Pin size={10} /> Pinned
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{post.time}</span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={12} /> {post.viewCount || 0}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.35, color: 'var(--foreground)' }}>
                {post.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                {post.body}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`${styles.avatar} ${styles.avatarSm}`}>
                    {post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{post.author?.name || 'Unknown'}</span>
                  <span className={`${styles.badge} ${roleBadgeClass[post.author?.role] || styles.badgeDeveloper}`} style={{ fontSize: 10 }}>{post.author?.role || 'Developer'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {post.tags?.map(tag => (
                      <span key={tag} className={styles.chip} style={{ fontSize: 11 }}>#{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)' }}>
                    <MessageSquare size={15} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
