// src/components/stack-suite/ShowcasesTab.jsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, ExternalLink, Github, MessageCircle, ChevronUp, ChevronDown,
  Loader2, Users, ArrowLeft, Star, Share2, Bookmark, Eye, Globe, Image,
  Edit2, Trash2
} from 'lucide-react';
import { getShowcases, getShowcaseById, upvoteShowcase, downvoteShowcase, deleteShowcase, followShowcase, unfollowShowcase } from '../../api/stackSuiteApi';
import { useSocket } from '../../context/SocketProvider';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

/* ─── Stage Color Map ─── */
const stageBadge = {
  Idea:     styles.badgeIdea,
  MVP:      styles.badgeMvp,
  Beta:     styles.badgeBeta,
  Launched: styles.badgeLaunched,
};

/* ─── Detail View ─── */
function ShowcaseDetailView({ showcaseId, onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();

  const { data: showcase, isLoading } = useQuery({
    queryKey: ['showcase', showcaseId],
    queryFn: () => getShowcaseById(showcaseId),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'showcase', showcaseId],
    queryFn: () => getStackComments('showcase', showcaseId),
    enabled: !!showcaseId,
  });

  const upvoteMutation = useMutation({
    mutationFn: upvoteShowcase,
    onSuccess: (data) => {
      queryClient.setQueryData(['showcase', showcaseId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries(['showcases']);
    }
  });

  const downvoteMutation = useMutation({
    mutationFn: downvoteShowcase,
    onSuccess: (data) => {
      queryClient.setQueryData(['showcase', showcaseId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries(['showcases']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteShowcase(id),
    onSuccess: () => { queryClient.invalidateQueries(['showcases']); onBack(); }
  });

  const followMutation = useMutation({
    mutationFn: ({ id, follow }) => follow ? followShowcase(id) : unfollowShowcase(id),
    onSuccess: (res, vars) => {
      const id = vars.id;
      queryClient.setQueryData(['showcase', id], prev => ({ ...prev, followerCount: res.followerCount, isFollowing: (!!vars.follow) }));
      queryClient.invalidateQueries(['showcases']);
    }
  });

  if (isLoading || !showcase) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const isOwner = user && showcase.author?._id && user._id === showcase.author._id;
  const isFounder = user && showcase.founder?._id && user._id === showcase.founder._id;
  const isAuthorized = isOwner || isFounder;
  const isBookmarked = user?.bookmarks?.some(b => b.itemId === showcaseId && b.itemType === 'showcase');
  const netScore = (showcase.upvoteCount || 0) - (showcase.downvoteCount || 0);

  // Join showcase room for live updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !showcaseId) return;
    try { socket.emit('joinRoom', `stacksuite:showcase:${showcaseId}`); } catch (e) {}
    return () => { try { socket.emit('leaveRoom', `stacksuite:showcase:${showcaseId}`); } catch (e) {} };
  }, [socket, showcaseId]);

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: showcase.name, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this showcase? This action cannot be undone.')) {
      deleteMutation.mutate(showcaseId);
    }
  };

  const authorField = showcase.founder || showcase.author;
  const authorId = authorField?._id;
  const authorName = authorField?.name;

  return (
    <div className={styles.detailContainer}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Showcases
      </button>

      <article className={styles.card} style={{ overflow: 'hidden' }}>
        {/* Media Hero */}
        {showcase.imageUrl && (
          <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--input-background)' }}>
            <img src={showcase.imageUrl} alt={showcase.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {showcase.stage && (
              <span className={`${styles.badge} ${stageBadge[showcase.stage] || styles.badgeIdea}`}>
                <Rocket size={11} /> {showcase.stage}
              </span>
            )}
            {showcase.techStack?.slice(0, 4).map(tech => (
              <span key={tech} className={styles.chip} style={{ backgroundColor: 'rgba(79,70,229,0.06)', color: 'var(--primary)' }}>
                {tech}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', margin: 0, wordBreak: 'break-word' }}>
              {showcase.name}
            </h1>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)', opacity: 0.9, marginBottom: 24, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
            {showcase.description}
          </p>

          {/* Vote column inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button
              className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${showcase.isUpvoted ? styles.upvoteBtnActive : ''}`}
              onClick={() => upvoteMutation.mutate(showcaseId)}
            >
              <ChevronUp size={14} /> {showcase.upvoteCount || 0}
            </button>
            <button
              className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${showcase.isDownvoted ? styles.upvoteBtnActive : ''}`}
              onClick={() => downvoteMutation.mutate(showcaseId)}
            >
              <ChevronDown size={14} /> {showcase.downvoteCount || 0}
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--muted-foreground)' }}>
              <Eye size={14} /> {showcase.views || 0} views
            </span>
          </div>

          {/* External links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {showcase.liveUrl && (
              <a href={showcase.liveUrl} target="_blank" rel="noopener noreferrer"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
                <ExternalLink size={14} /> Live Demo
              </a>
            )}
            {showcase.githubUrl && (
              <a href={showcase.githubUrl} target="_blank" rel="noopener noreferrer"
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                <Github size={14} /> Source
              </a>
            )}
          </div>

          {/* Looking For */}
          {showcase.looking?.length > 0 && (
            <div style={{ marginBottom: 24, padding: 16, background: 'var(--background)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 10 }}>
                Looking For
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {showcase.looking.map(role => (
                  <span key={role} className={`${styles.badge} ${styles.badgePrimary}`}>
                    <Users size={11} /> {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className={`${styles.avatar} ${styles.avatarMd} ${styles.avatarPrimary}`}
              style={{ cursor: 'pointer' }}
              onClick={() => { if (authorId) navigate(`/profile/${authorId}`); }}>
              {authorField?.avatarUrl ? (
                <img src={authorField.avatarUrl} alt={authorName} />
              ) : (
                authorName ? authorName.slice(0, 2).toUpperCase() : 'U'
              )}
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}
                onClick={() => { if (authorId) navigate(`/profile/${authorId}`); }}>
                {authorName || 'Anonymous'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 10 }}>
                {showcase.createdAt ? new Date(showcase.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {isAuthorized && (
                <button onClick={handleDelete} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              )}              <button
                onClick={() => followMutation.mutate({ id: showcaseId, follow: !showcase.isFollowing })}
                className={styles.iconBtn}
                style={{ color: showcase.isFollowing ? 'var(--primary-color)' : 'var(--muted-foreground)', fontWeight: 700 }}
              >
                {showcase.isFollowing ? `Following • ${showcase.followerCount || 0}` : `Follow • ${showcase.followerCount || 0}`}
              </button>              <button onClick={() => dispatch(toggleBookmark({ itemId: showcaseId, itemType: 'showcase' }))}
                className={styles.iconBtn}
                style={{ color: isBookmarked ? 'var(--star-color)' : 'var(--muted-foreground)' }}>
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleShare} className={styles.iconBtn}><Share2 size={16} /></button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MessageCircle size={14} /> {showcase.commentCount || 0} comments</span>
          </div>
        </div>
      </article>

      {/* Comments */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Feedback & Discussion ({showcase.commentCount || 0})
        </h2>
        <div className={styles.card} style={{ padding: 24 }}>
          {commentsLoading ? (
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Loading comments...</p>
          ) : (
            <CommentThread comments={comments} parentType="showcase" parentId={showcase._id} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── List View ─── */
export function ShowcasesTab({ search, tagFilter, roleFilter, sortBy, onTagClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const sortParam = sortBy === 'Most Upvoted' || sortBy === 'Trending' ? 'popular' : undefined;

  const { data: showcases = [], isLoading } = useQuery({
    queryKey: ['showcases', { search, sortBy, roleFilter }],
    queryFn: () => getShowcases({ search, sort: sortParam }),
  });

  const filtered = showcases.filter(showcase => {
    const matchesTag = tagFilter
      ? showcase.techStack?.some(t => t.toLowerCase() === tagFilter.toLowerCase()) || showcase.looking?.some(l => l.toLowerCase() === tagFilter.toLowerCase())
      : true;
    const matchesRole = roleFilter && roleFilter !== 'all'
      ? showcase.founder?.role?.toLowerCase() === roleFilter.toLowerCase() || showcase.author?.role?.toLowerCase() === roleFilter.toLowerCase()
      : true;
    return matchesTag && matchesRole;
  });

  if (selectedId) {
    return <ShowcaseDetailView showcaseId={selectedId} onBack={() => setSelectedId(null)} />;
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
        <Rocket size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No showcases found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Be the first to share your project.</p>
      </div>
    );
  }

  const handleUpvote = (e, id) => {
    e.stopPropagation();
    queryClient.setQueryData(['showcases', { search }], (old) =>
      old?.map(s => s._id === id ? { ...s, upvoteCount: (s.upvoteCount || 0) + (s.isUpvoted ? -1 : 1), isUpvoted: !s.isUpvoted, isDownvoted: false, downvoteCount: s.isDownvoted ? (s.downvoteCount || 1) - 1 : (s.downvoteCount || 0) } : s)
    );
    upvoteShowcase(id).catch(() => queryClient.invalidateQueries({ queryKey: ['showcases', { search }] }));
  };

  const handleDownvote = (e, id) => {
    e.stopPropagation();
    queryClient.setQueryData(['showcases', { search }], (old) =>
      old?.map(s => s._id === id ? { ...s, downvoteCount: (s.downvoteCount || 0) + (s.isDownvoted ? -1 : 1), isDownvoted: !s.isDownvoted, isUpvoted: false, upvoteCount: s.isUpvoted ? (s.upvoteCount || 1) - 1 : (s.upvoteCount || 0) } : s)
    );
    downvoteShowcase(id).catch(() => queryClient.invalidateQueries({ queryKey: ['showcases', { search }] }));
  };

  return (
    <div className={styles.showcaseGrid}>
      {filtered.map(showcase => {
        const netScore = (showcase.upvoteCount || 0) - (showcase.downvoteCount || 0);
        const authorField = showcase.founder || showcase.author;
        const authorId = authorField?._id;
        const authorName = authorField?.name;
        return (
          <article
            key={showcase._id}
            className={styles.card}
            style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={() => setSelectedId(showcase._id)}
          >
            {/* Media thumbnail */}
            <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: 'var(--input-background)', position: 'relative' }}>
              {showcase.imageUrl ? (
                <img src={showcase.imageUrl} alt={showcase.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)', opacity: 0.3 }}>
                  <Image size={40} />
                </div>
              )}
              {showcase.stage && (
                <span className={`${styles.badge} ${stageBadge[showcase.stage] || styles.badgeIdea}`}
                  style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>
                  <Rocket size={10} /> {showcase.stage}
                </span>
              )}
            </div>

            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6, lineHeight: 1.3, wordBreak: 'break-word' }}>
                {showcase.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: 12, flex: 1, wordBreak: 'break-word' }}>
                {showcase.description}
              </p>

              {/* Tech tags */}
              {showcase.techStack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {showcase.techStack.slice(0, 3).map(tech => (
                    <span
                      key={tech}
                      className={styles.chip}
                      style={{ fontSize: 10, cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(tech); }}
                    >
                      {tech}
                    </span>
                  ))}
                  {showcase.techStack.length > 3 && (
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>+{showcase.techStack.length - 3}</span>
                  )}
                </div>
              )}

              {/* Vote + views row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <ChevronUp size={14}
                  style={{ color: showcase.isUpvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                  onClick={(e) => handleUpvote(e, showcase._id)} />
                <span style={{ fontSize: 12, fontWeight: 700, color: netScore > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>{netScore}</span>
                <ChevronDown size={14}
                  style={{ color: showcase.isDownvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                  onClick={(e) => handleDownvote(e, showcase._id)} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, fontSize: 11, color: 'var(--muted-foreground)' }}>
                  <Eye size={11} /> {showcase.views || 0}
                </span>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-foreground)', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle size={13} />
                    <span>{showcase.commentCount || 0}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {showcase.liveUrl && (
                    <a href={showcase.liveUrl} target="_blank" rel="noopener noreferrer"
                      className={styles.iconBtn}
                      onClick={e => e.stopPropagation()}
                      title="Live Demo">
                      <ExternalLink size={14} style={{ color: 'var(--primary)' }} />
                    </a>
                  )}
                  {showcase.githubUrl && (
                    <a href={showcase.githubUrl} target="_blank" rel="noopener noreferrer"
                      className={styles.iconBtn}
                      onClick={e => e.stopPropagation()}
                      title="Source Code">
                      <Github size={14} />
                    </a>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); followMutation.mutate({ id: showcase._id, follow: !showcase.isFollowing }); }}
                    className={styles.iconBtn}
                    style={{ color: showcase.isFollowing ? 'var(--primary-color)' : 'var(--muted-foreground)', fontWeight: 700 }}
                    title={showcase.isFollowing ? 'Following' : 'Follow'}
                  >
                    {showcase.isFollowing ? 'Following' : 'Follow'} • {showcase.followerCount || 0}
                  </button>
                </div>
              </div>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div className={`${styles.avatar} ${styles.avatarSm}`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); if (authorId) navigate(`/profile/${authorId}`); }}>
                  {authorField?.avatarUrl ? (
                    <img src={authorField.avatarUrl} alt={authorName} />
                  ) : (
                    authorName ? authorName.slice(0, 2).toUpperCase() : 'U'
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); if (authorId) navigate(`/profile/${authorId}`); }}>
                  {authorName || 'Anonymous'}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}