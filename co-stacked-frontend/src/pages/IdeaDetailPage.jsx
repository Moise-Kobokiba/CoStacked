import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, Reply, Loader2, Check, 
  Edit3, Trash2, MessageSquare, AlertTriangle, CheckCircle, Calendar, Eye, 
  MapPin, Users, User, BookmarkCheck 
} from 'lucide-react';
import { 
  getIdeaById, getIdeaComments, addIdeaComment, voteIdea, deleteIdeaComment, 
  editIdeaComment, incrementIdeaViewCount, shareIdea, likeIdeaComment 
} from '../api/ideasApi';
import { saveItem, unsaveItemByType, checkSaved } from '../api/savedItemsApi';
import styles from './IdeaDetailPage.module.css';

/* ── Helpers ────────────────────────────────────────────── */

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

/* Dummy Component fallback if absolute custom element isn't globally accessible */
const Avatar = ({ src, name, size = 40 }) => {
  const initials = name
    ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#ccc', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
};

export const IdeaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth || {});

  const [voteState, setVoteState] = useState({ type: null, score: 0 });
  const [commentDraft, setCommentDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savedItemId, setSavedItemId] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [commentPage, setCommentPage] = useState(1);

  const viewRecordedRef = useRef(false);
  const COMMENT_PAGE_SIZE = 10;

  /* ── FIX 1: Standardized Main Idea Query ── */
  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ['ideaDetail', id],
    queryFn: () => getIdeaById(id, token),
    enabled: !!id,
  });

  /* ── FIX 2: Fixed Comments Query to Object Syntax for v5 ── */
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['ideaComments', id, commentPage],
    queryFn: () => getIdeaComments(id, { page: commentPage, limit: COMMENT_PAGE_SIZE }),
    enabled: !!id,
    placeholderData: (previousData) => previousData, // Replacing legacy keepPreviousData
  });

  /* ── Check if idea is saved ── */
  useEffect(() => {
    if (!id || !token || !isAuthenticated) return;
    checkSaved(token, 'idea', id)
      .then((data) => {
        setIsSaved(data.isSaved);
        if (data.savedItem) setSavedItemId(data.savedItem._id);
      })
      .catch(() => {});
  }, [id, token, isAuthenticated]);

  // Join idea-specific socket room
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !id) return;
    try {
      socket.emit('joinRoom', `idea:${id}`);
    } catch (e) { console.error('Failed to join idea room:', e); }
    return () => {
      try { socket.emit('leaveRoom', `idea:${id}`); } catch (e) {}
    };
  }, [socket, id]);

  useEffect(() => {
    if (!id || viewRecordedRef.current || typeof window === 'undefined') return;
    const viewKey = `idea_viewed_${id}`;
    if (window.sessionStorage.getItem(viewKey)) return;

    incrementIdeaViewCount(id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['ideaDetail', id] });
        window.sessionStorage.setItem(viewKey, '1');
      })
      .catch(() => {});
    viewRecordedRef.current = true;
  }, [id, queryClient]);

  useEffect(() => {
    if (!idea) return;
    setVoteState({
      type: getVoteType(idea, user),
      score: idea.validationScore ?? idea.voteCount ?? 0,
    });
  }, [idea, user]);

  /* ── Derived state ── */
  const ideaScore = voteState.score;
  const comments = commentsData?.comments ?? [];
  const totalComments = idea?.commentCount ?? commentsData?.totalTopComments ?? 0;
  const viewCount = idea?.viewCount ?? 0;

  const upvoteCount = idea?.upvoteCount ?? idea?.upvotes?.length ?? 0;
  const downvoteCount = idea?.downvoteCount ?? idea?.downvotes?.length ?? 0;
  const totalVotes = idea?.totalVotes ?? (upvoteCount + downvoteCount);
  const downvotePercentage = idea?.downvotePercentage ?? (totalVotes > 0 ? (downvoteCount / totalVotes) * 100 : 0);

  const ideaAge = idea ? (new Date() - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24) : 0;
  const showValidationFailure = (idea?.validationStatus === 'Unsuccessful') || (ideaAge >= 3 && downvotePercentage >= 50);
  const showValidationSuccess = (idea?.validationStatus === 'Highly Validated') || (upvoteCount >= 80);
  const MIN_CONVERSION_SCORE = 60;

  const clampedScore = Math.max(0, Math.min(100, ideaScore));
  const SVG_RADIUS = 72;
  const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;
  const dashOffset = SVG_CIRCUMFERENCE - (clampedScore / 100) * SVG_CIRCUMFERENCE;

  const author = idea?.founder;
  const targetUsers = idea?.targetAudience
    ? idea.targetAudience.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const isIdeaOwner = idea?.founder?._id === user?._id;
  const hasConversionAccess = isIdeaOwner || user?.isAdmin;
  const conversionEnabled = idea && (idea.canConvert || idea.validationScore >= MIN_CONVERSION_SCORE) && idea.status !== 'converted';

  const handleConvertToProject = () => {
    if (!idea) return;
    const draftProject = {
      title: idea.title || '',
      description: `${idea.problemStatement || ''}\n\nSolution: ${idea.valueProposition || ''}`.trim(),
      skills: Array.isArray(idea.tags) ? idea.tags.join(', ') : (idea.targetAudience || ''),
      compensation: 'Equity-based',
      location: 'Remote',
      stage: idea.stage || 'Concept',
      originIdeaId: idea._id,
    };
    navigate('/post-project', { state: { draftProject, originIdeaId: idea._id } });
  };

  /* ── Mutations ── */
  const voteMutation = useMutation({
    mutationFn: (direction) => voteIdea(id, direction, token),
    onMutate: async (direction) => {
      await queryClient.cancelQueries({ queryKey: ['ideaDetail', id] });
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
      queryClient.invalidateQueries({ queryKey: ['ideaDetail', id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveItem(token, { itemType: 'idea', itemId: id }),
    onSuccess: (data) => {
      setIsSaved(true);
      setSavedItemId(data._id);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveItemByType(token, { itemType: 'idea', itemId: id }),
    onSuccess: () => {
      setIsSaved(false);
      setSavedItemId(null);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content) => addIdeaComment(id, content, token),
    onSuccess: () => {
      setCommentDraft('');
      queryClient.invalidateQueries({ queryKey: ['ideaComments', id] });
      queryClient.invalidateQueries({ queryKey: ['ideaDetail', id] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ content, parentCommentId }) => addIdeaComment(id, content, token, parentCommentId),
    onSuccess: () => {
      setReplyDraft({});
      queryClient.invalidateQueries({ queryKey: ['ideaComments', id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteIdeaComment(id, commentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideaComments', id] });
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => editIdeaComment(id, commentId, content, token),
    onSuccess: () => {
      setEditingComment(null);
      setEditDraft('');
      queryClient.invalidateQueries({ queryKey: ['ideaComments', id] });
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: ({ commentId }) => likeIdeaComment(id, commentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideaComments', id] });
    },
  });

  const submitComment = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    commentMutation.mutate(trimmed);
  };

  const submitReply = (parentCommentId) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const trimmed = (replyDraft[parentCommentId] || '').trim();
    if (!trimmed) return;
    replyMutation.mutate({ content: trimmed, parentCommentId });
  };

  const handleSaveToggle = useCallback(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  }, [isSaved, isAuthenticated, navigate, saveMutation, unsaveMutation]);

  const handleShare = useCallback(async () => {
    try {
      await shareIdea(id);
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  if (ideaLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spinner} />
            <span>Loading idea…</span>
          </div>
        </div>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <AlertTriangle size={40} />
            <h2>Idea not found</h2>
            <Link to="/validation-board" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Validation Board
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ── BREADCRUMB ── */}
        <Link to="/validation-board" className={styles.breadcrumb}>
          <ArrowLeft size={18} />
          <span>Back to Validation Board</span>
        </Link>

        {/* Success / Failure Banner */}
        {showValidationSuccess && (
          <div className={`${styles.validationBanner} ${styles.bannerSuccess}`}>
            <div className={styles.bannerLeft}>
              <CheckCircle size={20} />
              <div>
                <strong>Validation Success!</strong>
                <p>This idea has reached the 80+ upvote threshold. It's time to build.</p>
              </div>
            </div>
            {conversionEnabled && hasConversionAccess && (
              <button className={styles.bannerAction} onClick={handleConvertToProject}>
                Turn Into Project
              </button>
            )}
          </div>
        )}

        {showValidationFailure && (
          <div className={`${styles.validationBanner} ${styles.bannerWarning}`}>
            <AlertTriangle size={20} />
            <span>This idea is unsuccessful based on community response.</span>
          </div>
        )}

        {/* ── MAIN 2-COLUMN GRID ── */}
        <div className={styles.mainGrid}>

          {/* ═══════════ LEFT COLUMN ═══════════ */}
          <div className={styles.leftCol}>
            <div className={styles.titleCard}>
              <div className={styles.topRow}>
                <span className={styles.categoryBadge}>
                  {idea.industry || idea.tags?.[0] || 'FinTech'}
                </span>
                <div className={styles.titleActions}>
                  <button type="button" className={styles.iconActionBtn} onClick={handleShare}>
                    <Share2 size={18} />
                    {shareFeedback === 'copied' && <span className={styles.tooltip}>Copied!</span>}
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconActionBtn} ${isSaved ? styles.iconActionBtnActive : ''}`}
                    onClick={handleSaveToggle}
                  >
                    {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>
              </div>

              <h1 className={styles.ideaTitle}>{idea.title}</h1>
              
              <div className={styles.postMeta}>
                <span className={styles.metaItem}>
                  <Calendar size={14} />
                  <span>Posted {formatPostedDate(idea.createdAt)}</span>
                </span>
                <span className={styles.metaItem}>
                  <Eye size={14} />
                  <span>{viewCount.toLocaleString()} Views</span>
                </span>
              </div>
            </div>

            {/* Quadrant Grid */}
            <div className={styles.quadrantGrid}>
              <div className={`${styles.quadrantCard} ${styles.problemCard}`}>
                <div className={styles.quadrantHeader}>
                  <AlertTriangle size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Problem Statement</span>
                </div>
                <p className={styles.quadrantText}>{idea.problemStatement}</p>
              </div>

              <div className={`${styles.quadrantCard} ${styles.solutionCard}`}>
                <div className={styles.quadrantHeader}>
                  <MapPin size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Our Solution</span>
                </div>
                <p className={styles.quadrantText}>{idea.valueProposition}</p>
              </div>

              <div className={`${styles.quadrantCard} ${styles.marketCard}`}>
                <div className={styles.quadrantHeader}>
                  <Users size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Target Market</span>
                </div>
                <p className={styles.quadrantText}>{idea.targetMarket || idea.industry}</p>
              </div>

              <div className={`${styles.quadrantCard} ${styles.usersCard}`}>
                <div className={styles.quadrantHeader}>
                  <User size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Target Users</span>
                </div>
                {targetUsers.length > 0 ? (
                  <ul className={styles.usersList}>
                    {targetUsers.map((tag, i) => (
                      <li key={i} className={styles.usersItem}>
                        <span className={styles.usersBullet} />
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.quadrantText}>No target users specified.</p>
                )}
              </div>
            </div>

            {/* Feedback / Comments Section */}
            <section className={styles.feedbackSection}>
              <div className={styles.feedbackHeader}>
                <h2 className={styles.feedbackTitle}>Community Feedback</h2>
                <span className={styles.feedbackCount}>{totalComments} Comments</span>
              </div>

              {isAuthenticated ? (
                <div className={styles.commentInputRow}>
                  <Avatar src={user?.avatarUrl} name={user?.name} size={40} />
                  <div className={styles.commentInputBody}>
                    <textarea
                      className={styles.commentTextarea}
                      rows={3}
                      placeholder="Add your constructive feedback..."
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.postCommentBtn}
                      onClick={submitComment}
                      disabled={!commentDraft.trim() || commentMutation.isPending}
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.loginPrompt}>Please sign in to leave feedback.</p>
              )}

              <div className={styles.commentList}>
                {comments.map((comment) => {
                  const commenter = comment.author || {};
                  const isCommentOwner = commenter._id?.toString() === user?._id?.toString();
                  const isEditing = editingComment === comment._id;

                  return (
                    <div key={comment._id} className={styles.commentItem}>
                      <Avatar src={commenter.avatarUrl} name={commenter.name} size={36} />
                      <div className={styles.commentContent}>
                        <div className={styles.commentMetaRow}>
                          <span className={styles.commentAuthor}>{commenter.name}</span>
                          <span className={styles.commentTimestamp}>{formatDate(comment.createdAt)}</span>
                        </div>
                        
                        {isEditing ? (
                          <div className={styles.editForm}>
                            <textarea
                              className={styles.editTextarea}
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                            />
                            <button onClick={() => editCommentMutation.mutate({ commentId: comment._id, content: editDraft })}>Save</button>
                            <button onClick={() => setEditingComment(null)}>Cancel</button>
                          </div>
                        ) : (
                          <p className={styles.commentText}>{comment.content}</p>
                        )}

                        <div className={styles.commentActionsRow}>
                          <button className={styles.commentActionBtn} onClick={() => commentLikeMutation.mutate({ commentId: comment._id })}>
                            <ThumbsUp size={14} /> <span>{comment.likeCount || 0} Likes</span>
                          </button>
                          {isCommentOwner && (
                            <button className={styles.commentActionBtn} onClick={() => deleteCommentMutation.mutate(comment._id)}>
                              <Trash2 size={14} /> <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ═══════════ RIGHT COLUMN (Sidebar Metrics) ═══════════ */}
          <div className={styles.rightCol}>
            {/* Validation Score Wheel */}
            <div className={styles.metricCard}>
              <h3 className={styles.sidebarCardTitle}>Validation Score</h3>
              <div className={styles.radialContainer}>
                <svg className={styles.radialSvg} width="160" height="160">
                  <circle className={styles.radialBg} cx="80" cy="80" r={SVG_RADIUS} />
                  <circle 
                    className={styles.radialProgress} 
                    cx="80" cy="80" r={SVG_RADIUS} 
                    strokeDasharray={SVG_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className={styles.radialCenterText}>
                  <span className={styles.radialScoreValue}>{clampedScore}</span>
                  <span className={styles.radialScoreLabel}>VOTES</span>
                </div>
              </div>

              <div className={styles.voteSummarySplit}>
                <div className={styles.voteStatBlock}>
                  <span className={styles.upvoteCountText}>{upvoteCount}</span>
                  <span className={styles.voteStatLabel}>UPVOTES</span>
                </div>
                <div className={styles.voteStatBlock}>
                  <span className={styles.downvoteCountText}>{downvoteCount}</span>
                  <span className={styles.voteStatLabel}>DOWNVOTES</span>
                </div>
              </div>

              <div className={styles.voteActionButtons}>
                <button 
                  className={`${styles.voteBtn} ${styles.vouchBtn} ${voteState.type === 'up' ? styles.vouchActive : ''}`} 
                  onClick={() => voteMutation.mutate('up')}
                >
                  <ThumbsUp size={16} /> Vouch
                </button>
                <button 
                  className={`${styles.voteBtn} ${styles.critiqueBtn} ${voteState.type === 'down' ? styles.critiqueActive : ''}`} 
                  onClick={() => voteMutation.mutate('down')}
                >
                  <ThumbsDown size={16} /> Critique
                </button>
              </div>
            </div>

            {/* Proposed By Profile Card */}
            <div className={styles.metricCard}>
              <h3 className={styles.sidebarCardTitle}>Proposed By</h3>
              <div className={styles.authorProfileBlock}>
                <Avatar src={author?.avatarUrl} name={author?.name} size={48} />
                <div className={styles.authorProfileMeta}>
                  <span className={styles.authorProfileName}>{author?.name || 'Anonymous Founder'}</span>
                  <span className={styles.authorProfileHeadline}>{author?.headline || 'Startup Creator'}</span>
                </div>
              </div>
              <Link to={author?._id ? `/talent/${author.username || author._id}` : '#'} className={styles.viewProfileBtn}>
                View Talent Profile
              </Link>
            </div>

            {/* Side Row Items */}
            <div className={styles.metricCard}>
              <h3 className={styles.sidebarCardTitle}>Real-Time Metrics</h3>
              <div className={styles.metricRowItem}>
                <span className={styles.metricRowLabel}>Engagement Rate</span>
                <span className={styles.metricRowValue}>{idea.engagementRate || '12.4%'}</span>
              </div>
              <div className={styles.metricRowItem}>
                <span className={styles.metricRowLabel}>Virality Score</span>
                <span className={styles.metricRowValue}>{idea.validationTrend || 'Medium'}</span>
              </div>
              <div className={styles.metricRowItem}>
                <span className={styles.metricRowLabel}>Active Testers</span>
                <span className={styles.metricRowValue}>{idea.saveCount || 0} Ready</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};