// src/components/stack-suite/CollaborationTab.jsx

import { useState } from 'react';
import { MessageSquare, Paperclip, CheckCircle2, Clock, AlertCircle, ArrowLeft, GitBranch, CalendarDays, Rocket, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCollabThreads, getStackComments } from '../../api/stackSuiteApi';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

const progressConfig = {
  Completed:    { badgeClass: styles.badgeCompleted,   Icon: CheckCircle2 },
  'In Progress':{ badgeClass: styles.badgeInProgress,  Icon: Clock        },
  'Needs Review':{ badgeClass: styles.badgeNeedsReview, Icon: AlertCircle  },
};

/* ─────────── Detail View ─────────── */
function ThreadDetail({ threadId, onBack }) {
  const queryClient = useQueryClient();

  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => getCollabThreads().then(items => items.find(i => i._id === threadId)),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'collabThread', threadId],
    queryFn: () => getStackComments('collabThread', threadId),
    enabled: !!threadId,
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

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, lineHeight: 1.3, color: 'var(--foreground)' }}>
          {thread.milestone}
        </h1>

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

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 12 }}>Team</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {thread.team?.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '6px 12px', borderRadius: 10 }}>
                <div className={`${styles.avatar} ${styles.avatarSm}`}>{member.name ? member.name.slice(0, 2).toUpperCase() : 'U'}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{member.name || 'Unknown'}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{member.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

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
                          {member.name ? member.name.slice(0, 2).toUpperCase() : 'U'}
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
