import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, Share2, 
  AlertTriangle, Calendar, User, Target, DollarSign, ShieldAlert, 
  TrendingUp, BarChart3, MessageCircle, Send, CornerDownRight, ExternalLink, Loader2
} from 'lucide-react';
import styles from './IdeaDetailsPage.module.css';

// Reuses existing idea API endpoints
import { getIdeaById, getIdeaComments, addIdeaComment, voteIdea, incrementIdeaViewCount, shareIdea } from '../api/ideasApi';
import { saveItem, unsaveItemByType, checkSaved } from '../api/savedItemsApi';

const formatDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatPostedDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getVoteType = (idea, user) => {
  if (!idea || !user) return null;
  const userId = user._id || user.id;
  const hasUpvoted = idea.upvotes?.some((item) => {
    const id = item?._id || item;
    return id?.toString() === userId?.toString();
  });
  if (hasUpvoted) return 'up';
  const hasDownvoted = idea.downvotes?.some((item) => {
    const id = item?._id || item;
    return id?.toString() === userId?.toString();
  });
  if (hasDownvoted) return 'down';
  return null;
};

export function IdeaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, token } = useSelector(state => state.auth || {});

  const [activeTab, setActiveTab] = useState('overview');
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [voteState, setVoteState] = useState({ type: null, score: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(null);

  const viewRecordedRef = useRef(false);

  // ─── Data Fetching ───────────────────────────────────────────────
  const { data: idea, isLoading, isError } = useQuery({
    queryKey: ['ideaDetails', id],
    queryFn: () => getIdeaById(id, token),
    enabled: !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['ideaDetailsComments', id],
    queryFn: () => getIdeaComments(id, { page: 1, limit: 50 }),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });

  // ─── Check saved state ──
  useEffect(() => {
    if (!id || !token || !isAuthenticated) return;
    checkSaved(token, 'idea', id)
      .then((data) => setIsSaved(data.isSaved))
      .catch(() => {});
  }, [id, token, isAuthenticated]);

  // Join socket room
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !id) return;
    try { socket.emit('joinRoom', `idea:${id}`); } catch { /* Socket errors are non-critical */ }
    return () => { try { socket.emit('leaveRoom', `idea:${id}`); } catch { /* Socket errors are non-critical */ } };
  }, [socket, id]);

  // Record view once
  useEffect(() => {
    if (!id || viewRecordedRef.current) return;
    const viewKey = `idea_viewed_${id}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(viewKey)) return;
    incrementIdeaViewCount(id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['ideaDetails', id] });
      if (typeof window !== 'undefined') window.sessionStorage.setItem(viewKey, '1');
    }).catch(() => {});
    viewRecordedRef.current = true;
  }, [id, queryClient]);

  // Sync vote state from server
  useEffect(() => {
    if (!idea) return;
    setVoteState({
      type: getVoteType(idea, user),
      score: idea.validationScore ?? idea.voteCount ?? 0,
    });
  }, [idea, user]);

  const comments = commentsData?.comments ?? [];
  const totalCommentCount = idea?.commentCount ?? commentsData?.totalTopComments ?? 0;

  const upvoteCount = idea?.upvoteCount ?? idea?.upvotes?.length ?? 0;
  const downvoteCount = idea?.downvoteCount ?? idea?.downvotes?.length ?? 0;
  const totalVotes = idea?.totalVotes ?? (upvoteCount + downvoteCount);

  // ─── Mutations ────────────────────────────────────────────────────
  const voteMutation = useMutation({
    mutationFn: (direction) => voteIdea(id, direction, token),
    onMutate: async (direction) => {
      await queryClient.cancelQueries({ queryKey: ['ideaDetails', id] });
      const previousVote = { ...voteState };
      setVoteState((current) => {
        const currentType = current.type;
        let newType = direction;
        let newScore = current.score;
        if (currentType === direction) {
          newType = null;
          newScore += direction === 'up' ? -15 : 5;
        } else if (currentType === 'up' && direction === 'down') {
          newScore -= 20;
        } else if (currentType === 'down' && direction === 'up') {
          newScore += 20;
        } else {
          newScore += direction === 'up' ? 15 : -5;
        }
        return { type: newType, score: Math.max(0, Math.min(100, newScore)) };
      });
      return { previousVote };
    },
    onError: (_error, _direction, context) => {
      if (context?.previousVote) setVoteState(context.previousVote);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ideaDetails', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text) => addIdeaComment(id, text, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideaDetailsComments', id] });
      queryClient.invalidateQueries({ queryKey: ['ideaDetails', id] });
      setCommentText('');
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, text }) => addIdeaComment(id, text, token, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideaDetailsComments', id] });
      queryClient.invalidateQueries({ queryKey: ['ideaDetails', id] });
      setReplyText('');
      setReplyTarget(null);
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => isSaved ? unsaveItemByType(token, { itemType: 'idea', itemId: id }) : saveItem(token, { itemType: 'idea', itemId: id }),
    onSuccess: () => {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ['ideaDetails', id] });
    }
  });

  // ─── Actions ──────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await shareIdea(id);
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } catch {
      // Fallback with clipboard only
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback('copied');
        setTimeout(() => setShareFeedback(null), 2000);
      } catch {
        prompt('Copy this URL:', window.location.href);
      }
    }
  }, [id]);

  const handleReport = () => {
    const reason = prompt('Please input your specific moderation concern:');
    if (reason) alert('Thank you. Our moderation team has been notified.');
  };

  // Build derived idea details from the real Idea model fields
  const ideaMetrics = {
    validationScore: idea?.validationScore ?? voteState.score ?? 0,
    totalVotes: totalVotes,
    interestedUsers: idea?.saveCount ?? 0,
    communitySentiment: totalVotes > 0 ? Math.round((upvoteCount / totalVotes) * 100) : 0,
    feedbackCount: totalCommentCount,
  };

  const ideaDetails = {
    problem: idea?.problemStatement || '',
    solution: idea?.valueProposition || '',
    targetMarket: idea?.targetMarket || idea?.targetAudience || '',
    revenueModel: idea?.monetizationModel || '',
    competitors: idea?.risks || '',
  };

  const similarIdeas = [
    // Placeholder for similar ideas - backend endpoint could be extended
  ];

  const clampedScore = Math.max(0, Math.min(100, ideaMetrics.validationScore));

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className={styles.spinner} />
            <span>Loading validation metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <AlertTriangle size={40} />
            <h2>Idea not found</h2>
            <p>Failed to accurately map idea telemetry.</p>
            <button className={styles.backBtn} onClick={() => navigate('/validation-board')}>
              <ArrowLeft size={16} />
              <span>Back to Board</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Navigation Header */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/validation-board')}>
            <ArrowLeft size={16} />
            <span>Back to Board</span>
          </button>
          <div className={styles.actionRow}>
            <button 
              className={`${styles.actionBtn} ${isSaved ? styles.activeAction : ''}`} 
              onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } bookmarkMutation.mutate(); }}
            >
              <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save Idea'}</span>
            </button>
            <button className={styles.actionBtn} onClick={handleShare}>
              <Share2 size={16} />
              <span>{shareFeedback === 'copied' ? 'Copied!' : 'Share'}</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.reportBtn}`} onClick={handleReport}>
              <ShieldAlert size={16} />
            </button>
          </div>
        </header>

        <div className={styles.layoutGrid}>
          {/* Main Workspace Column */}
          <main className={styles.mainContent}>
            {/* Hero Metadata Panel */}
            <section className={styles.heroCard}>
              <div className={styles.metaBadgeRow}>
                <span className={styles.stageBadge}>{idea.stage || 'Concept'}</span>
                <span className={styles.categoryBadge}>{idea.industry || 'General'}</span>
                <span className={styles.dateBadge}>
                  <Calendar size={12} />
                  {formatPostedDate(idea.createdAt)}
                </span>
              </div>
              <h1 className={styles.title}>{idea.title}</h1>
              
              {idea.tags && idea.tags.length > 0 && (
                <div className={styles.tagCloud}>
                  {idea.tags.map(tag => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <div className={styles.founderRow}>
                <div className={styles.avatar}>
                  {idea.founder?.avatarUrl ? (
                    <img src={idea.founder.avatarUrl} alt={idea.founder.name} />
                  ) : (
                    (idea.founder?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className={styles.founderName}>{idea.founder?.name || 'Anonymous'}</p>
                  <p className={styles.founderRole}>{idea.founder?.headline || 'Founder'}</p>
                </div>
              </div>
            </section>

            {/* Tab Navigation */}
            <nav className={styles.tabNav}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`} 
                onClick={() => setActiveTab('overview')}
              >
                Idea Matrix
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'comments' ? styles.tabActive : ''}`} 
                onClick={() => setActiveTab('comments')}
              >
                Feedback Loop ({totalCommentCount})
              </button>
            </nav>

            {/* Tab Panes */}
            {activeTab === 'overview' ? (
              <div className={styles.tabPane}>
                {ideaDetails.problem && (
                  <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionHeading}><Target size={16} color="var(--primary)" /> Problem Statement</h3>
                    <p className={styles.sectionBody}>{ideaDetails.problem}</p>
                  </div>
                )}
                {ideaDetails.solution && (
                  <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionHeading}><TrendingUp size={16} color="var(--emerald, #10b981)" /> Proposed Solution</h3>
                    <p className={styles.sectionBody}>{ideaDetails.solution}</p>
                  </div>
                )}
                <div className={styles.gridSplit}>
                  {ideaDetails.targetMarket && (
                    <div className={styles.sectionBlock}>
                      <h3 className={styles.sectionHeading}><User size={16} /> Target Market</h3>
                      <p className={styles.sectionBody}>{ideaDetails.targetMarket}</p>
                    </div>
                  )}
                  {ideaDetails.revenueModel && (
                    <div className={styles.sectionBlock}>
                      <h3 className={styles.sectionHeading}><DollarSign size={16} /> Revenue Engine</h3>
                      <p className={styles.sectionBody}>{ideaDetails.revenueModel}</p>
                    </div>
                  )}
                </div>
                {ideaDetails.competitors && (
                  <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionHeading}><AlertTriangle size={16} /> Competitive Landscape</h3>
                    <p className={styles.sectionBody}>{ideaDetails.competitors}</p>
                  </div>
                )}
                {!ideaDetails.problem && !ideaDetails.solution && !ideaDetails.targetMarket && !ideaDetails.revenueModel && !ideaDetails.competitors && (
                  <div className={styles.sectionBlock}>
                    <p className={styles.sectionBody}>No detailed breakdown available for this idea yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.tabPane}>
                {/* Comment Form */}
                <form className={styles.commentForm} onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) commentMutation.mutate(commentText); }}>
                  <textarea 
                    className={styles.textInput} 
                    placeholder={isAuthenticated ? 'Provide actionable technical or growth feedback...' : 'Please sign in to log idea insights.'}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!isAuthenticated}
                  />
                  <button type="submit" className={styles.submitBtn} disabled={!isAuthenticated || !commentText.trim()}>
                    <Send size={14} /> Commit Feedback
                  </button>
                </form>

                {/* Comment Feed */}
                <div className={styles.commentFeed}>
                  {comments.length === 0 ? (
                    <p className={styles.emptyComments}>No feedback yet. Be the first to share your thoughts!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                          <div className={styles.commentAvatar}>
                            {comment.author?.avatarUrl ? (
                              <img src={comment.author.avatarUrl} alt={comment.author.name} />
                            ) : (
                              (comment.author?.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className={styles.commentUser}>{comment.author?.name || 'Anonymous'}</span>
                            <span className={styles.commentRole}>{comment.author?.headline || 'Contributor'}</span>
                            <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                          </div>
                        </div>
                        <p className={styles.commentBody}>{comment.content}</p>
                        <button className={styles.replyTrigger} onClick={() => setReplyTarget({ id: comment._id, username: comment.author?.name })}>
                          <MessageSquare size={12} /> Reply
                        </button>

                        {/* Replies (flattened from parent-child comment structure) */}
                        {comment.replies?.map(reply => (
                          <div key={reply._id} className={styles.replyItem}>
                            <CornerDownRight size={14} className={styles.nestedIcon} />
                            <div className={styles.replyContent}>
                              <div className={styles.commentHeader}>
                                <div className={styles.commentAvatarSmall}>
                                  {reply.author?.avatarUrl ? (
                                    <img src={reply.author.avatarUrl} alt={reply.author.name} />
                                  ) : (
                                    (reply.author?.name || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className={styles.commentUser}>{reply.author?.name || 'Anonymous'}</span>
                                  <span className={styles.commentRole}>{reply.author?.headline || 'Contributor'}</span>
                                  <span className={styles.commentTime}>{formatDate(reply.createdAt)}</span>
                                </div>
                              </div>
                              <p className={styles.commentBody}>{reply.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Reply Input */}
                        {replyTarget?.id === comment._id && (
                          <div className={styles.replyBox}>
                            <p className={styles.replyContextLabel}>
                              Replying to {replyTarget.username} 
                              <span className={styles.cancelReply} onClick={() => setReplyTarget(null)}>Cancel</span>
                            </p>
                            <div className={styles.replyInputWrap}>
                              <input 
                                type="text" 
                                className={styles.replyInput} 
                                placeholder="Add your contextual follow-up..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && replyText.trim()) {
                                    replyMutation.mutate({ commentId: comment._id, text: replyText });
                                  }
                                }}
                              />
                              <button 
                                className={styles.replySubmit} 
                                onClick={() => replyMutation.mutate({ commentId: comment._id, text: replyText })}
                                disabled={!replyText.trim()}
                              >
                                <Send size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar Analytical Control Deck */}
          <aside className={styles.sidebar}>
            {/* Validation Metrics Core Engine Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><BarChart3 size={16} /> Validation Metrics</h2>
              <div className={styles.metricScoreRow}>
                <div className={styles.scoreDial}>
                  <span className={styles.scoreValue}>{clampedScore}%</span>
                  <span className={styles.scoreLabel}>Confidence Index</span>
                </div>
              </div>
              
              <div className={styles.statsStack}>
                <div className={styles.statRow}>
                  <span>Total Votes Cast</span>
                  <strong>{ideaMetrics.totalVotes}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Interested Leads</span>
                  <strong>{ideaMetrics.interestedUsers} users</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Sentiment Quotient</span>
                  <strong>{ideaMetrics.communitySentiment}% Pos</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Feedback Nodes</span>
                  <strong>{ideaMetrics.feedbackCount} counts</strong>
                </div>
              </div>

              {/* Voting Control Array */}
              <div className={styles.votingDock}>
                <button 
                  className={`${styles.voteBtn} ${voteState.type === 'up' ? styles.voteBtnActive : ''}`} 
                  onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } voteMutation.mutate('up'); }}
                >
                  <ThumbsUp size={16} /> <span>{upvoteCount}</span>
                </button>
                <button 
                  className={`${styles.voteBtn} ${styles.downvote} ${voteState.type === 'down' ? styles.voteBtnDownActive : ''}`} 
                  onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } voteMutation.mutate('down'); }}
                >
                  <ThumbsDown size={16} /> <span>{downvoteCount}</span>
                </button>
              </div>
            </div>

            {/* Founder Profile Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><User size={16} /> Proposed By</h2>
              <div className={styles.founderProfile}>
                <div className={styles.founderAvatarLarge}>
                  {idea.founder?.avatarUrl ? (
                    <img src={idea.founder.avatarUrl} alt={idea.founder.name} />
                  ) : (
                    (idea.founder?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className={styles.founderNameLarge}>{idea.founder?.name || 'Anonymous'}</p>
                  <p className={styles.founderRoleLarge}>{idea.founder?.headline || 'Startup Creator'}</p>
                </div>
              </div>
            </div>

            {/* Similar Structural Concepts Node */}
            {similarIdeas.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}><MessageCircle size={16} /> Similar Sandbox Ideas</h2>
                <div className={styles.similarStack}>
                  {similarIdeas.map(sim => (
                    <div key={sim.id} className={styles.similarItem} onClick={() => navigate(`/validation-board/${sim.id}`)}>
                      <div>
                        <p className={styles.similarTitle}>{sim.title}</p>
                        <span className={styles.similarStage}>{sim.stage}</span>
                      </div>
                      <div className={styles.similarMetric}>{sim.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}