// src/components/stack-suite/CollaborationTab.jsx

import { useState, useEffect } from 'react';
import {
  MessageSquare, Paperclip, CheckCircle2, Clock, AlertCircle,
  ArrowLeft, GitBranch, CalendarDays, Rocket, Loader2, Edit2, Trash2,
  Bookmark, Share2, Users, Zap, Send, X, UserPlus, Briefcase,
  ChevronUp, ChevronDown, Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCollabThreads, getStackComments, deleteCollabThread, upvoteCollabThread, downvoteCollabThread, followCollabThread, unfollowCollabThread } from '../../api/stackSuiteApi';
import { useSocket } from '../../context/SocketProvider';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import { EditCollabModal } from './EditCollabModal';
import styles from './StackSuite.module.css';

const progressConfig = {
  Completed:    { badgeClass: styles.badgeCompleted,   Icon: CheckCircle2 },
  'In Progress':{ badgeClass: styles.badgeInProgress,  Icon: Clock        },
  'Needs Review':{ badgeClass: styles.badgeNeedsReview, Icon: AlertCircle  },
};

/* ─── Pitch / Apply Modal ─── */
function PitchModal({ thread, onClose }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    console.log('[Pitch] Sending pitch to', thread.author?.name, ':', message);
    setSent(true);
    setTimeout(onClose, 1200);
  };

  if (sent) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} style={{ padding: 40, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Send size={24} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>Pitch Sent!</h3>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Your message has been delivered to {thread.author?.name || 'the founder'}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>Pitch to Collaborate</h3>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Send a message to {thread.author?.name || 'the project founder'}</p>
          </div>
          <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 4 }}>
              About <strong style={{ color: 'var(--foreground)' }}>{thread.milestone}</strong>
            </p>
          </div>
          <textarea
            className={styles.commentInputBody}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={`Hi ${thread.author?.name || 'there'}! I'd love to contribute to this milestone. Here's my background...`}
            rows={5}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, resize: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: 16, borderTop: '1px solid var(--border)' }}>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSend} disabled={!message.trim()}>
            <Send size={14} /> Send Pitch
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail View ─── */
function ThreadDetail({ threadId, onBack }) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const { user } = useSelector(state => state.auth);

  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => getCollabThreads().then(items => items.find(i => i._id === threadId)),
  });

  // Join thread-specific room for realtime updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !threadId) return;
    try { socket.emit('joinRoom', `stacksuite:collab:${threadId}`); } catch (e) {}
    return () => { try { socket.emit('leaveRoom', `stacksuite:collab:${threadId}`); } catch (e) {} };
  }, [socket, threadId]);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'collabThread', threadId],
    queryFn: () => getStackComments('collabThread', threadId),
    enabled: !!threadId,
  });

  const upvoteMutation = useMutation({
    mutationFn: upvoteCollabThread,
    onSuccess: (data) => {
      queryClient.setQueryData(['thread', threadId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries(['threads']);
    }
  });

  const downvoteMutation = useMutation({
    mutationFn: downvoteCollabThread,
    onSuccess: (data) => {
      queryClient.setQueryData(['thread', threadId], (old) => old ? { ...old, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, isUpvoted: data.isUpvoted, isDownvoted: data.isDownvoted } : old);
      queryClient.invalidateQueries(['threads']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCollabThread(id),
    onSuccess: () => { queryClient.invalidateQueries(['threads']); onBack(); }
  });

  const followMutation = useMutation({
    mutationFn: ({ id, follow }) => follow ? followCollabThread(id) : unfollowCollabThread(id),
    onSuccess: (res, vars) => {
      const id = vars.id;
      queryClient.setQueryData(['thread', id], prev => ({ ...prev, followerCount: res.followerCount, isFollowing: (!!vars.follow) }));
      queryClient.invalidateQueries(['threads']);
    }
  });

  if (isLoading || !thread) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const cfg = progressConfig[thread.progress] || progressConfig['In Progress'];
  const ProgressIcon = cfg.Icon;
  const isOwner = user && thread.author && user._id === thread.author._id;
  const isBookmarked = user?.bookmarks?.some(b => b.itemId === threadId && b.itemType === 'collabThread');
  const netScore = (thread.upvoteCount || 0) - (thread.downvoteCount || 0);

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: thread.milestone, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this thread? This action cannot be undone.')) {
      deleteMutation.mutate(threadId);
    }
  };

  const authorName = thread.author?.name;
  const authorId = thread.author?._id;

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Collaboration
      </button>

      <article className={styles.card} style={{ padding: 24, marginBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{thread.project?.name || 'Project'}</span>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <span className={`${styles.badge} ${cfg.badgeClass}`}>
            <ProgressIcon size={12} /> {thread.progress}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {new Date(thread.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3, color: 'var(--foreground)', wordBreak: 'break-word' }}>
            {thread.milestone}
          </h1>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditModalOpen(true)} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={handleDelete}
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, fontSize: 13 }}>
          {thread.branch && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--input-background)', padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
              <GitBranch size={13} /> {thread.branch}
            </span>
          )}
          {thread.deadline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <CalendarDays size={13} /> Due: {new Date(thread.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Voting row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${thread.isUpvoted ? styles.upvoteBtnActive : ''}`}
            onClick={() => upvoteMutation.mutate(threadId)}
          >
            <ChevronUp size={14} /> {thread.upvoteCount || 0}
          </button>
          <button
            className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${thread.isDownvoted ? styles.upvoteBtnActive : ''}`}
            onClick={() => downvoteMutation.mutate(threadId)}
          >
            <ChevronDown size={14} /> {thread.downvoteCount || 0}
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--muted-foreground)' }}>
            <Eye size={14} /> {thread.views || 0} views
          </span>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9, wordBreak: 'break-word' }}>
          {thread.longDescription || thread.description}
        </div>

        {thread.attachment && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '8px 12px', borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)' }}>
            <Paperclip size={13} style={{ color: 'var(--muted-foreground)' }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{thread.attachment}</span>
          </div>
        )}

        {thread.links?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 4 }}>External Resources</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {thread.links.map((link, idx) => (
                <a key={idx} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--foreground)', textDecoration: 'none', padding: '8px 14px', background: 'var(--card-background)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <Rocket size={14} color="var(--primary-color)" />
                  <span style={{ fontWeight: 500 }}>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Team */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 12 }}>Team</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {thread.team?.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '6px 12px', borderRadius: 10 }}>
                <div className={`${styles.avatar} ${styles.avatarSm}`}>
                  {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : (member.name ? member.name.slice(0, 2).toUpperCase() : 'U')}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{member.name || 'Unknown'}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{member.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTop: '1px solid var(--border)', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
              <MessageSquare size={16} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{thread.commentCount || 0} Comments</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => followMutation.mutate({ id: threadId, follow: !thread.isFollowing })}
              className={styles.iconBtn}
              style={{ color: thread.isFollowing ? 'var(--primary-color)' : 'var(--muted-foreground)', fontWeight: 700 }}
            >
              {thread.isFollowing ? `Following • ${thread.followerCount || 0}` : `Follow • ${thread.followerCount || 0}`}
            </button>
            <button onClick={() => dispatch(toggleBookmark({ itemId: threadId, itemType: 'collabThread' }))}
              className={styles.iconBtn}
              style={{ color: isBookmarked ? 'var(--star-color)' : 'var(--muted-foreground)' }}>
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className={styles.iconBtn}><Share2 size={18} /></button>
          </div>
        </div>
      </article>

      {/* Pitch CTA (non-owner) */}
      {!isOwner && (
        <div style={{ padding: '20px 24px', background: 'var(--card-background)', border: '1px solid var(--border)', borderRadius: 12, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>Want to join this milestone?</h4>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Pitch your skills to {authorName || 'the founder'}.</p>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setPitchOpen(true)}>
            <UserPlus size={15} /> Apply / Pitch Founder
          </button>
        </div>
      )}

      {isEditModalOpen && (
        <EditCollabModal thread={thread} onClose={() => setIsEditModalOpen(false)} />
      )}

      {pitchOpen && <PitchModal thread={thread} onClose={() => setPitchOpen(false)} />}

      {/* Comments */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Updates & Discussion ({thread.commentCount || 0})
        </h2>
        {commentsLoading ? (
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Loading comments...</p>
        ) : (
          <CommentThread comments={comments} parentType="collabThread" parentId={thread._id} />
        )}
      </div>
    </div>
  );
}

/* ─── Timeline / List View ─── */
export function CollaborationTab({ search, tagFilter, onTagClick }) {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['threads', { search }],
    queryFn: () => getCollabThreads({ search }),
  });

  const filtered = tagFilter
    ? threads.filter(t => t.tags?.some(tg => tg.toLowerCase() === tagFilter.toLowerCase()) || t.roles?.some(r => r.toLowerCase() === tagFilter.toLowerCase()))
    : threads;

  if (selectedId) {
    return <ThreadDetail threadId={selectedId} onBack={() => setSelectedId(null)} />;
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
        <GitBranch size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No collaboration threads found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Start a new milestone or review your filters.</p>
      </div>
    );
  }

  const handleUpvote = (e, id) => {
    e.stopPropagation();
    queryClient.setQueryData(['threads', { search }], (old) =>
      old?.map(t => t._id === id ? { ...t, upvoteCount: (t.upvoteCount || 0) + (t.isUpvoted ? -1 : 1), isUpvoted: !t.isUpvoted, isDownvoted: false, downvoteCount: t.isDownvoted ? (t.downvoteCount || 1) - 1 : (t.downvoteCount || 0) } : t)
    );
    upvoteCollabThread(id).catch(() => queryClient.invalidateQueries({ queryKey: ['threads', { search }] }));
  };

  const handleDownvote = (e, id) => {
    e.stopPropagation();
    queryClient.setQueryData(['threads', { search }], (old) =>
      old?.map(t => t._id === id ? { ...t, downvoteCount: (t.downvoteCount || 0) + (t.isDownvoted ? -1 : 1), isDownvoted: !t.isDownvoted, isUpvoted: false, upvoteCount: t.isUpvoted ? (t.upvoteCount || 1) - 1 : (t.upvoteCount || 0) } : t)
    );
    downvoteCollabThread(id).catch(() => queryClient.invalidateQueries({ queryKey: ['threads', { search }] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {filtered.map(thread => {
        const cfg = progressConfig[thread.progress] || progressConfig['In Progress'];
        const ProgressIcon = cfg.Icon;
        const netScore = (thread.upvoteCount || 0) - (thread.downvoteCount || 0);

        return (
          <article
            key={thread._id}
            className={styles.card}
            style={{ padding: 20, cursor: 'pointer' }}
            onClick={() => setSelectedId(thread._id)}
          >
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{thread.project?.name || 'Project'}</span>
              <span style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">/</span>
              <span className={`${styles.badge} ${cfg.badgeClass}`} style={{ fontSize: 10 }}>
                <ProgressIcon size={11} /> {thread.progress}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)' }}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--foreground)', lineHeight: 1.35, wordBreak: 'break-word' }}>
              {thread.milestone}
            </h3>

            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: 16, wordBreak: 'break-word' }}>
              {thread.description}
            </p>

            {/* Voting row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ChevronUp size={14}
                style={{ color: thread.isUpvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                onClick={(e) => handleUpvote(e, thread._id)} />
              <span style={{ fontSize: 12, fontWeight: 700, color: netScore > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>{netScore}</span>
              <ChevronDown size={14}
                style={{ color: thread.isDownvoted ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}
                onClick={(e) => handleDownvote(e, thread._id)} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, fontSize: 11, color: 'var(--muted-foreground)' }}>
                <Eye size={11} /> {thread.views || 0}
              </span>
            </div>

            {/* Roles recruitment section */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {thread.roles?.length > 0 ? thread.roles.map(role => (
                <span key={role} className={styles.badge} style={{
                  background: 'rgba(79,70,229,0.06)', color: 'var(--primary)', 
                  borderColor: 'rgba(79,70,229,0.2)', fontSize: 11
                }}>
                  <Briefcase size={11} /> {role}
                </span>
              )) : (
                <>
                  {thread.team?.length > 0 && (
                    <span className={`${styles.chip}`}>
                      <Users size={11} /> {thread.team.length} member{thread.team.length > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )}
            </div>

            {thread.attachment && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--input-background)', padding: '5px 10px', borderRadius: 8, marginBottom: 16 }}>
                <Paperclip size={12} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{thread.attachment}</span>
              </div>
            )}

            {/* Footer with author */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex' }}>
                  {thread.team?.slice(0, 3).map((member, i) => (
                    <div key={i} className={`${styles.avatar} ${styles.avatarSm}`}
                      style={{ border: '2px solid var(--card-background)', marginLeft: i > 0 ? -8 : 0 }}>
                      {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : (member.name ? member.name.slice(0, 2).toUpperCase() : 'U')}
                    </div>
                  ))}
                </div>
                {thread.team?.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {thread.team.length} member{thread.team.length > 1 ? 's' : ''}
                  </span>
                )}
                {(!thread.team || thread.team.length === 0) && thread.author && (
                  <>
                    <div className={`${styles.avatar} ${styles.avatarSm}`}
                      style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); navigate(`/profile/${thread.author._id}`); }}>
                      {thread.author.avatarUrl ? (
                        <img src={thread.author.avatarUrl} alt={thread.author.name} />
                      ) : (
                        thread.author.name ? thread.author.name.slice(0, 2).toUpperCase() : 'U'
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); navigate(`/profile/${thread.author._id}`); }}>
                      {thread.author.name || 'Anonymous'}
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
                  <MessageSquare size={14} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{thread.commentCount || 0}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={e => { e.stopPropagation(); followMutation.mutate({ id: thread._id, follow: !thread.isFollowing }); }}
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    style={{ fontSize: 11 }}>
                    {thread.isFollowing ? `Following • ${thread.followerCount || 0}` : `Follow • ${thread.followerCount || 0}`}
                  </button>
                  <button onClick={e => { e.stopPropagation(); }}
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                    style={{ fontSize: 11 }}>
                    <UserPlus size={12} /> Apply
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}