// src/components/stack-suite/CollaborationTab.jsx

import { useState } from 'react';
import { MessageSquare, Paperclip, CheckCircle2, Clock, AlertCircle, ArrowLeft, GitBranch, CalendarDays, Rocket, Loader2, Edit2, Trash2, Bookmark, Share2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { getCollabThreads, getStackComments, deleteCollabThread } from '../../api/stackSuiteApi';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import { EditCollabModal } from './EditCollabModal';
import { ConnectionButton } from '../profile/ConnectionButton';
import { 
  sendConnectionRequest, 
  acceptConnectionRequest, 
  removeOrCancelConnection 
} from '../../features/connections/connectionsSlice';
import styles from './StackSuite.module.css';

const progressConfig = {
  Completed:    { badgeClass: styles.badgeCompleted,   Icon: CheckCircle2 },
  'In Progress':{ badgeClass: styles.badgeInProgress,  Icon: Clock        },
  'Needs Review':{ badgeClass: styles.badgeNeedsReview, Icon: AlertCircle  },
};

/* ─────────── Detail View ─────────── */
function ThreadDetail({ threadId, onBack }) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useSelector(state => state.auth);

  // Connection states
  const { connections, pendingRequests, actionStatus } = useSelector(state => state.connections);
  const isConnectionLoading = actionStatus === 'loading';

  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => getCollabThreads().then(items => items.find(i => i._id === threadId)),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'collabThread', threadId],
    queryFn: () => getStackComments('collabThread', threadId),
    enabled: !!threadId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCollabThread(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['threads']);
      onBack();
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

  const handleShare = async () => {
    const shareData = {
      title: thread.milestone,
      text: thread.description,
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

  const isBookmarked = user?.bookmarks?.some(b => b.itemId === threadId && b.itemType === 'collabThread');

  // Connection Helpers
  const getConnectionStatus = () => {
    if (!user || !thread.author || user._id === thread.author._id) return null;
    if (connections?.some(conn => conn._id === thread.author._id)) return 'connected';
    if (pendingRequests?.some(req => req.recipient?._id === thread.author._id)) return 'pending_sent';
    if (pendingRequests?.some(req => req.requester?._id === thread.author._id)) return 'pending_received';
    return 'not_connected';
  };

  const connectionStatus = getConnectionStatus();

  const connectionHandlers = {
    onConnect: () => thread.author?._id && dispatch(sendConnectionRequest(thread.author._id)),
    onCancel:  () => thread.author?._id && dispatch(removeOrCancelConnection(thread.author._id)),
    onRemove:  () => thread.author?._id && dispatch(removeOrCancelConnection(thread.author._id)),
    onAccept:  () => thread.author?._id && dispatch(acceptConnectionRequest(thread.author._id)),
    onDecline: () => thread.author?._id && dispatch(removeOrCancelConnection(thread.author._id)),
  };

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3, color: 'var(--foreground)' }}>
            {thread.milestone}
          </h1>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, background: 'var(--card-background)', color: 'var(--foreground)' }}>
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => { if(window.confirm('Are you sure you want to delete this thread?')) deleteMutation.mutate(thread._id); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, color: 'var(--destructive)', borderColor: 'var(--destructive)', background: 'var(--card-background)' }}>
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

        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9 }}>
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
                <a 
                  key={idx} 
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    fontSize: 13, 
                    color: 'var(--foreground)', 
                    textDecoration: 'none',
                    padding: '8px 14px',
                    background: 'var(--card-background)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Rocket size={14} color="var(--primary-color)" />
                  <span style={{ fontWeight: 500 }}>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 12 }}>Team</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {thread.team?.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '6px 12px', borderRadius: 10 }}>
                <div className={`${styles.avatar} ${styles.avatarSm}`}>
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} />
                  ) : (
                    member.name ? member.name.slice(0, 2).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{member.name || 'Unknown'}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{member.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isOwner && connectionStatus && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'rgba(var(--primary-rgb), 0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>Want to collaborate?</h4>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Connect with {thread.author?.name} to discuss this project further.</p>
              </div>
              <ConnectionButton 
                status={connectionStatus}
                targetUserId={thread.author?._id}
                isLoading={isConnectionLoading}
                {...connectionHandlers}
              />
            </div>
          </div>
        )}

        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', background: 'var(--card-background)', marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
               <MessageSquare size={16} />
               <span style={{ fontSize: 13, fontWeight: 500 }}>{thread.commentCount || 0} Comments</span>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => dispatch(toggleBookmark({ itemId: threadId, itemType: 'collabThread' }))} 
              className={styles.iconBtn}
              style={{ color: isBookmarked ? 'var(--star-color)' : 'var(--muted-foreground)' }}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className={styles.iconBtn}><Share2 size={18} /></button>
          </div>
        </div>
      </article>

      {isEditModalOpen && (
        <EditCollabModal thread={thread} onClose={() => setIsEditModalOpen(false)} />
      )}

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

/* ─────────── Timeline View ─────────── */
export function CollaborationTab({ search }) {
  const [selectedId, setSelectedId] = useState(null);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['threads', { search }],
    queryFn: () => getCollabThreads({ search }),
  });

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

  if (threads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-background)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <GitBranch size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No collaboration threads found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Start a new milestone or review your filters.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical timeline line */}
      <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 1, background: 'var(--border)', display: 'none' }} aria-hidden="true" className="timelineLine" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {threads.map(thread => {
          const cfg = progressConfig[thread.progress] || progressConfig['In Progress'];
          const ProgressIcon = cfg.Icon;
          
          return (
            <article
              key={thread._id}
              style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', outline: 'none' }}
              onClick={() => setSelectedId(thread._id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(thread._id); }}}
              aria-label={`Open thread: ${thread.milestone}`}
            >
              <div className={styles.card} style={{ padding: 20 }}>
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

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--foreground)', lineHeight: 1.35 }}>
                  {thread.milestone}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: 16 }}>
                  {thread.description}
                </p>

                {thread.attachment && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--input-background)', padding: '5px 10px', borderRadius: 8, marginBottom: 16 }}>
                    <Paperclip size={12} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{thread.attachment}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex' }}>
                      {thread.team?.slice(0, 3).map((member, i) => (
                        <div key={i} className={`${styles.avatar} ${styles.avatarSm}`}
                          style={{ border: '2px solid var(--card-background)', marginLeft: i > 0 ? -8 : 0 }}>
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} />
                          ) : (
                            member.name ? member.name.slice(0, 2).toUpperCase() : 'U'
                          )}
                        </div>
                      ))}
                    </div>
                    {thread.team?.length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {thread.team.length} member{thread.team.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
                    <MessageSquare size={14} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{thread.commentCount || 0} comments</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
