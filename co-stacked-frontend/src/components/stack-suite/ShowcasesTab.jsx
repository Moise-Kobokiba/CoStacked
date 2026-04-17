// src/components/stack-suite/ShowcasesTab.jsx

import { useState } from 'react';
import { ArrowBigUp, MessageSquare, ArrowLeft, Bookmark, Share2, ExternalLink, Calendar, Code, Users, Target, Globe, Rocket, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { getShowcases, upvoteShowcase, getStackComments, deleteShowcase } from '../../api/stackSuiteApi';
import { toggleBookmark } from '../../features/auth/authSlice';
import { CommentThread } from './CommentThread';
import { EditShowcaseModal } from './EditShowcaseModal';
import { ConnectionButton } from '../profile/ConnectionButton';
import { 
  sendConnectionRequest, 
  acceptConnectionRequest, 
  removeOrCancelConnection 
} from '../../features/connections/connectionsSlice';
import styles from './StackSuite.module.css';

const stageColorMap = {
  Idea:       { bg: '#E0F2FE', text: '#0284C7' },  // Blue
  MVP:        { bg: '#FEF3C7', text: '#D97706' },  // Amber
  Beta:       { bg: '#F1F5F9', text: '#475569' },  // Slate
  Launched:   { bg: '#DCFCE7', text: '#16A34A' },  // Green
};

/* ─────────── Detail View ─────────── */
function ShowcaseDetail({ showcaseId, onBack }) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  
  // Connection states
  const { connections, pendingRequests, actionStatus } = useSelector(state => state.connections);
  const isConnectionLoading = actionStatus === 'loading';

  const { data: showcase, isLoading } = useQuery({
    queryKey: ['showcase', showcaseId],
    queryFn: () => getShowcases().then(items => items.find(i => i._id === showcaseId)),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'showcase', showcaseId],
    queryFn: () => getStackComments('showcase', showcaseId),
    enabled: !!showcaseId,
  });

  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteShowcase(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['showcase', id]);
      const prev = queryClient.getQueryData(['showcase', id]);
      if (prev) {
        queryClient.setQueryData(['showcase', id], {
          ...prev,
          upvoteCount: prev.isUpvoted ? prev.upvoteCount - 1 : prev.upvoteCount + 1,
          isUpvoted: !prev.isUpvoted,
        });
      }
      return { prev };
    },
    onError: (err, id, context) => queryClient.setQueryData(['showcase', id], context.prev),
    onSettled: (id) => {
      queryClient.invalidateQueries(['showcase', id]);
      queryClient.invalidateQueries(['showcases']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteShowcase(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['showcases']);
      onBack();
    }
  });

  if (isLoading || !showcase) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: showcase.name,
      text: showcase.description,
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

  const isBookmarked = user?.bookmarks?.some(b => b.itemId === showcase._id && b.itemType === 'showcase');

  // Connection Helpers
  const getConnectionStatus = () => {
    if (!user || !showcase.founder || user._id === showcase.founder._id) return null;
    if (connections?.some(conn => conn._id === showcase.founder._id)) return 'connected';
    if (pendingRequests?.some(req => req.recipient?._id === showcase.founder._id)) return 'pending_sent';
    if (pendingRequests?.some(req => req.requester?._id === showcase.founder._id)) return 'pending_received';
    return 'not_connected';
  };

  const connectionStatus = getConnectionStatus();

  const connectionHandlers = {
    onConnect: () => showcase.founder?._id && dispatch(sendConnectionRequest(showcase.founder._id)),
    onCancel:  () => showcase.founder?._id && dispatch(removeOrCancelConnection(showcase.founder._id)),
    onRemove:  () => showcase.founder?._id && dispatch(removeOrCancelConnection(showcase.founder._id)),
    onAccept:  () => showcase.founder?._id && dispatch(acceptConnectionRequest(showcase.founder._id)),
    onDecline: () => showcase.founder?._id && dispatch(removeOrCancelConnection(showcase.founder._id)),
  };

  const stageStyle = stageColorMap[showcase.stage] || stageColorMap.Idea;
  const isOwner = user && showcase.founder && user._id === showcase.founder._id;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Showcases
      </button>

      <div className={styles.card} style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div className={`bg-gradient-to-r ${showcase.gradient}`} style={{ padding: '40px 32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 32, fontWeight: 700, color: '#0F172A' }}>
              {showcase.icon || showcase.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{showcase.name}</h1>
                <span className={styles.badge} style={{ background: stageStyle.bg, color: stageStyle.text, fontWeight: 600 }}>{showcase.stage}</span>
                {showcase.launched && (
                  <span className={styles.badge} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                    <Calendar size={12} style={{ marginRight: 4 }} /> Launched {showcase.launched}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 16, color: 'var(--muted-foreground)', margin: 0, maxWidth: 600 }}>{showcase.description}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isOwner && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setIsEditModalOpen(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--card-background)', color: 'var(--foreground)' }}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button onClick={() => { if(window.confirm('Are you sure you want to delete this showcase?')) deleteMutation.mutate(showcase._id); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: 'var(--destructive)', borderColor: 'var(--destructive)', background: 'var(--card-background)' }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px' }}>
                <ExternalLink size={16} /> Visit Project
              </button>
            </div>
          </div>
        </div>

        {isEditModalOpen && (
          <EditShowcaseModal showcase={showcase} onClose={() => setIsEditModalOpen(false)} />
        )}

        <div style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--card-background)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => upvoteMutation.mutate(showcase._id)}
              className={`${styles.upvoteBtn} ${showcase.isUpvoted ? styles.upvoteBtnActive : ''}`}
            >
              <ArrowBigUp size={20} />
              <span>{showcase.upvoteCount} Upvotes</span>
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
            <span style={{ fontSize: 14, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={16} /> {showcase.commentCount || 0} Comments
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => dispatch(toggleBookmark({ itemId: showcase._id, itemType: 'showcase' }))} 
              className={`${styles.iconBtn} ${isBookmarked ? styles.iconBtnActive : ''}`}
            >
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className={styles.iconBtn}><Share2 size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, padding: 32 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>About Project</h3>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', opacity: 0.9 }}>
              {showcase.longDescription || showcase.description}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 40, marginBottom: 16, color: 'var(--foreground)' }}>Tech Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {showcase.techStack?.map(tech => (
                <div key={tech} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>
                  <Code size={14} color="var(--primary-color)" /> {tech}
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--foreground)' }}>Discussion ({showcase.commentCount || 0})</h2>
              {commentsLoading ? <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Loading comments...</p> 
               : <CommentThread comments={comments} parentType="showcase" parentId={showcase._id} />}
            </div>
          </div>

          <div>
            <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Makers</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={`${styles.avatar} ${styles.avatarLg}`}>
                  {showcase.founder?.avatarUrl ? (
                    <img src={showcase.founder.avatarUrl} alt={showcase.founder.name} />
                  ) : (
                    showcase.founder?.name ? showcase.founder.name.slice(0, 2).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{showcase.founder?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{showcase.founder?.role || 'Founder'}</div>
                </div>
              </div>
              {showcase.teamSize > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} /> + {showcase.teamSize - 1} other team member(s)
                </div>
              )}
            </div>

            {showcase.looking?.length > 0 && (
              <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', border: '1px dashed rgba(var(--primary-rgb), 0.3)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Target size={18} color="var(--primary-color)" />
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Looking For</h4>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {showcase.looking.map(role => (
                    <li key={role} style={{ fontSize: 13, color: 'var(--foreground)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-color)', marginTop: 6 }}></div>
                      {role}
                    </li>
                  ))}
                </ul>
                
                {!isOwner && connectionStatus && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12, fontWeight: 500 }}>READY TO HELP?</p>
                    <ConnectionButton 
                      status={connectionStatus}
                      targetUserId={showcase.founder?._id}
                      isLoading={isConnectionLoading}
                      {...connectionHandlers}
                    />
                  </div>
                )}
              </div>
            )}
            
            {showcase.links?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Links</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {showcase.links.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        fontSize: 14, 
                        color: 'var(--foreground)', 
                        textDecoration: 'none',
                        padding: '10px 14px',
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <Globe size={16} color="var(--primary-color)" />
                      <span style={{ fontWeight: 500 }}>{link.name}</span>
                      <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── List View ─────────── */
export function ShowcasesTab({ search, stage }) {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: showcases = [], isLoading } = useQuery({
    queryKey: ['showcases', { search, stage }],
    queryFn: () => getShowcases({ search, stage }),
  });

  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteShowcase(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['showcases']);
      const prev = queryClient.getQueryData(['showcases', { search, stage }]);
      if (prev) {
        queryClient.setQueryData(['showcases', { search, stage }], prev.map(s => {
          if (s._id === id) {
            return {
              ...s,
              upvoteCount: s.isUpvoted ? s.upvoteCount - 1 : s.upvoteCount + 1,
              isUpvoted: !s.isUpvoted,
            };
          }
          return s;
        }));
      }
      return { prev };
    },
    onError: (err, id, context) => queryClient.setQueryData(['showcases', { search, stage }], context.prev),
    onSettled: () => queryClient.invalidateQueries(['showcases'])
  });

  if (selectedId) {
    return <ShowcaseDetail showcaseId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (showcases.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-background)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <Rocket size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>No projects found</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Change your filters or launch the first project.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
      {showcases.map(showcase => {
        const stageStyle = stageColorMap[showcase.stage] || stageColorMap.Idea;

        return (
          <article 
            key={showcase._id} 
            className={styles.card} 
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setSelectedId(showcase._id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(showcase._id); }}}
            tabIndex={0}
            role="button"
          >
            <div className={`bg-gradient-to-br ${showcase.gradient}`} style={{ height: 120, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: stageStyle.text, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {showcase.stage}
              </div>
              <div style={{ width: 64, height: 64, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {showcase.icon || showcase.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{showcase.name}</h3>
                {showcase.launched && (
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {showcase.launched}
                  </span>
                )}
              </div>
              
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                {showcase.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {showcase.techStack?.slice(0, 3).map(tech => (
                  <span key={tech} className={styles.chip} style={{ fontSize: 11, background: 'var(--background)' }}>{tech}</span>
                ))}
                {showcase.techStack?.length > 3 && (
                  <span className={styles.chip} style={{ fontSize: 11, background: 'var(--background)' }}>+{showcase.techStack.length - 3}</span>
                )}
              </div>

              {showcase.looking?.length > 0 && (
                <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-color)', marginBottom: 4, textTransform: 'uppercase' }}>Looking For</div>
                  <div style={{ fontSize: 12, color: 'var(--foreground)' }}>{showcase.looking.slice(0, 2).join(', ')}{showcase.looking.length > 2 ? '...' : ''}</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); upvoteMutation.mutate(showcase._id); }}
                    className={`${styles.upvoteBtn} ${showcase.isUpvoted ? styles.upvoteBtnActive : ''}`}
                    style={{ padding: '6px 10px', fontSize: 13 }}
                  >
                    <ArrowBigUp size={16} />
                    <span>{showcase.upvoteCount}</span>
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageSquare size={14} /> {showcase.commentCount || 0}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={styles.avatarGroup} style={{ marginRight: -10 }}>
                    <div className={`${styles.avatar} ${styles.avatarSm}`} style={{ border: '2px solid var(--card-background)' }}>
                      {showcase.founder?.avatarUrl ? (
                        <img src={showcase.founder.avatarUrl} alt={showcase.founder.name} />
                      ) : (
                        showcase.founder?.name ? showcase.founder.name.slice(0, 2).toUpperCase() : 'U'
                      )}
                    </div>
                  </div>
                  {showcase.teamSize > 1 && (
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 16, fontWeight: 500 }}>
                      +{showcase.teamSize - 1}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
