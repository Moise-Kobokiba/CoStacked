import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, BookmarkCheck,
  Reply, Loader2, Check, Edit3, Trash2, Send, AlertTriangle,
  CheckCircle, X, Rocket, Calendar, Eye, MapPin, Users, User,
  TrendingUp, Zap, UserCheck
} from 'lucide-react';
import { getIdeaById, getIdeaComments, addIdeaComment, voteIdea, convertIdeaToProject, deleteIdeaComment, editIdeaComment } from '../api/ideasApi';
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

const Avatar = ({ src, name, className = '', size = 40 }) => {
  const initials = name
    ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${styles.avatarImg} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`${styles.avatarFallback} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
};

/* ── Main Component ─────────────────────────────────────── */

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
  const [bannerDismissed, setBannerDismissed] = useState(false);

  /* ── React Query v5 object syntax ── */
  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ['ideaDetail', id],
    queryFn: () => getIdeaById(id, token),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['ideaComments', id],
    queryFn: () => getIdeaComments(id),
    enabled: !!id,
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

  useEffect(() => {
    if (!idea) return;
    setVoteState({
      type: getVoteType(idea, user),
      score: idea.validationScore ?? idea.voteCount ?? 0,
    });
  }, [idea, user]);

  /* ── Derived state ── */
  const ideaScore = voteState.score;
  const isUpvoted = voteState.type === 'up';
  const isDownvoted = voteState.type === 'down';

  const upvoteCount = idea?.upvotes?.length ?? 0;
  const downvoteCount = idea?.downvotes?.length ?? 0;
  const totalVotes = upvoteCount + downvoteCount;
  const downvotePercentage = totalVotes > 0 ? (downvoteCount / totalVotes) * 100 : 0;

  const ideaAge = idea ? (new Date() - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24) : 0;
  const showValidationFailure = ideaAge >= 3 && downvotePercentage >= 50;
  const showValidationSuccess = upvoteCount >= 80;
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
  const conversionEnabled = idea && idea.validationScore >= MIN_CONVERSION_SCORE && idea.status !== 'converted';

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
    onError: (err) => {
      console.error('Save failed:', err);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveItemByType(token, { itemType: 'idea', itemId: id }),
    onSuccess: () => {
      setIsSaved(false);
      setSavedItemId(null);
    },
    onError: (err) => {
      console.error('Unsave failed:', err);
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertIdeaToProject(id, token),
    onSuccess: (res) => {
      const projectId = res?.projectId || res?.project?._id;
      if (projectId) navigate(`/projects/${projectId}`);
      else alert('Idea converted to project');
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Failed to convert idea');
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
    onError: (err) => {
      alert(err?.response?.data?.message || 'Failed to edit comment');
    },
  });

  /* ── Handlers ── */
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
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (err) { console.error(err); }
  }, []);

  /* ── Loading state ── */
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

  /* ── Empty state ── */
  if (!idea) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <AlertTriangle size={40} />
            <h2>Idea not found</h2>
            <p>This idea may have been removed or is unavailable.</p>
            <Link to="/validation-board" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Validation Board
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Render ── */
  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ── BREADCRUMB ── */}
        <Link to="/validation-board" className={styles.breadcrumb}>
          <ArrowLeft size={18} />
          <span>Back to Validation Board</span>
        </Link>

        {/* ── TOP CALLOUT BANNER (Conditional Success) ── */}
        {showValidationSuccess && !bannerDismissed && (
          <div className={styles.successBanner}>
            <div className={styles.successBannerLeft}>
              <div className={styles.successBadge}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.successText}>
                <strong className={styles.successTitle}>Validation Success!</strong>
                <span className={styles.successSubtext}>
                  This idea has reached the 80+ upvote threshold. It's time to build.
                </span>
              </div>
            </div>
            <div className={styles.successBannerRight}>
              {hasConversionAccess && idea.status !== 'converted' && (
                <button
                  type="button"
                  className={styles.convertBannerBtn}
                  onClick={() => {
                    if (confirm('Convert this validated idea into a project? The project will be pre-filled with your idea details.')) {
                      convertMutation.mutate();
                    }
                  }}
                  disabled={convertMutation.isPending}
                >
                  {convertMutation.isPending ? (
                    <Loader2 size={16} className={styles.spinner} />
                  ) : (
                    <Rocket size={16} />
                  )}
                  <span>Turn into Project</span>
                </button>
              )}
              <button
                type="button"
                className={styles.bannerCloseBtn}
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss banner"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── VALIDATION FAILURE WARNING ── */}
        {showValidationFailure && (
          <div className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <span>This idea currently shows low validation from the community.</span>
          </div>
        )}

        {/* ── MAIN 2-COLUMN GRID ── */}
        <div className={styles.mainGrid}>

          {/* ═══════════ LEFT COLUMN (Main Content) ═══════════ */}
          <div className={styles.leftCol}>

            {/* ── Category Tag ── */}
            {(idea.industry || idea.status) && (
              <span className={styles.categoryTag}>
                {idea.industry || idea.status || 'Active'}
              </span>
            )}

            {/* ── Title + Share/Save Row ── */}
            <div className={styles.titleSection}>
              <h1 className={styles.ideaTitle}>{idea.title}</h1>
              <div className={styles.titleActions}>
                <button
                  type="button"
                  className={styles.iconActionBtn}
                  onClick={handleShare}
                  title="Share"
                >
                  <Share2 size={18} />
                  {shareFeedback === 'copied' && <span className={styles.tooltip}>Copied!</span>}
                </button>
                <button
                  type="button"
                  className={`${styles.iconActionBtn} ${isSaved ? styles.iconActionBtnActive : ''}`}
                  onClick={handleSaveToggle}
                  disabled={saveMutation.isPending || unsaveMutation.isPending}
                  title={isSaved ? 'Unsave' : 'Save'}
                >
                  {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
              </div>
            </div>

            {/* ── Post Meta (Date + Views) ── */}
            <div className={styles.postMeta}>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                <span>Posted {formatPostedDate(idea.createdAt)}</span>
              </span>
              <span className={styles.metaItem}>
                <Eye size={14} />
                <span>{(idea.engagementCount || totalVotes || 0).toLocaleString()} Views</span>
              </span>
            </div>

            {/* ── 2×2 Quadrant Grid ── */}
            <div className={styles.quadrantGrid}>
              {/* Problem Statement */}
              <div className={`${styles.quadrantCard} ${styles.problemCard}`}>
                <div className={styles.quadrantHeader}>
                  <AlertTriangle size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Problem Statement</span>
                </div>
                <p className={styles.quadrantText}>
                  {idea.problemStatement || 'No problem statement provided yet.'}
                </p>
              </div>

              {/* Our Solution */}
              <div className={`${styles.quadrantCard} ${styles.solutionCard}`}>
                <div className={styles.quadrantHeader}>
                  <MapPin size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Our Solution</span>
                </div>
                <p className={styles.quadrantText}>
                  {idea.valueProposition || 'No solution details added yet.'}
                </p>
              </div>

              {/* Target Market */}
              <div className={`${styles.quadrantCard} ${styles.marketCard}`}>
                <div className={styles.quadrantHeader}>
                  <Users size={16} className={styles.quadrantIcon} />
                  <span className={styles.quadrantLabel}>Target Market</span>
                </div>
                <p className={styles.quadrantText}>
                  {idea.industry || 'No target market defined yet.'}
                </p>
              </div>

              {/* Target Users */}
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
                  <p className={styles.quadrantText}>No target users specified yet.</p>
                )}
              </div>
            </div>

            {/* ═══════════ COMMUNITY FEEDBACK ═══════════ */}
            <section className={styles.feedbackSection}>
              <div className={styles.feedbackHeader}>
                <h2 className={styles.feedbackTitle}>
                  {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                </h2>
                {(commentsLoading || commentMutation.isPending) && (
                  <Loader2 size={20} className={styles.spinner} />
                )}
              </div>

              {/* ── Comment Input (Top) ── */}
              {isAuthenticated ? (
                <div className={styles.commentInputRow}>
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.name || user?.username}
                    size={40}
                  />
                  <div className={styles.commentInputBody}>
                    <textarea
                      className={styles.commentTextarea}
                      rows={3}
                      placeholder="Add your constructive feedback…"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <div className={styles.commentInputActions}>
                      <button
                        type="button"
                        className={styles.postCommentBtn}
                        onClick={submitComment}
                        disabled={!commentDraft.trim() || commentMutation.isPending}
                      >
                        {commentMutation.isPending && <Loader2 size={14} className={styles.spinner} />}
                        <span>Post Comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.loginPrompt}>
                  <Link to="/login" className={styles.loginLink}>Log in</Link> to leave feedback.
                </p>
              )}

              {/* ── Comment List ── */}
              <div className={styles.commentList}>
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const commenter = comment.author || {};
                    const isCommentOwner = commenter._id === user?._id;
                    const replies = comment.replies || [];
                    const isEditing = editingComment === comment._id;

                    return (
                      <div key={comment._id} className={styles.commentThread}>
                        <div className={styles.commentItem}>
                          <Link
                            to={commenter._id ? `/users/${commenter._id}` : '#'}
                            className={styles.commentAvatarLink}
                          >
                            <Avatar src={commenter.avatarUrl} name={commenter.name} size={36} />
                          </Link>
                          <div className={styles.commentContent}>
                            <div className={styles.commentMetaRow}>
                              <Link
                                to={commenter._id ? `/users/${commenter._id}` : '#'}
                                className={styles.commentAuthor}
                              >
                                {commenter.name || 'Community'}
                              </Link>
                              <span className={styles.commentDot}>·</span>
                              <span className={styles.commentTimestamp}>{formatDate(comment.createdAt)}</span>
                            </div>

                            {isEditing ? (
                              <div className={styles.editForm}>
                                <textarea
                                  className={styles.editTextarea}
                                  rows={3}
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                />
                                <div className={styles.editActions}>
                                  <button
                                    type="button"
                                    className={styles.editSaveBtn}
                                    onClick={() => {
                                      if (!editDraft.trim()) return;
                                      editCommentMutation.mutate({ commentId: comment._id, content: editDraft.trim() });
                                    }}
                                    disabled={!editDraft.trim() || editCommentMutation.isPending}
                                  >
                                    {editCommentMutation.isPending ? <Loader2 size={14} className={styles.spinner} /> : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.editCancelBtn}
                                    onClick={() => { setEditingComment(null); setEditDraft(''); }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={styles.commentText}>
                                {comment.content || comment.text || 'No comment text.'}
                              </p>
                            )}

                            <div className={styles.commentActionsRow}>
                              <button
                                type="button"
                                className={styles.commentActionBtn}
                                onClick={() => {
                                  if (!isAuthenticated) { navigate('/login'); return; }
                                  setShowReplies((prev) => ({ ...prev, [comment._id]: !prev[comment._id] }));
                                }}
                              >
                                <Reply size={14} />
                                <span>{replies.length > 0 ? `${replies.length} replies` : 'Reply'}</span>
                              </button>

                              {isCommentOwner && (
                                <>
                                  <button
                                    type="button"
                                    className={styles.commentActionBtn}
                                    onClick={() => {
                                      setEditingComment(comment._id);
                                      setEditDraft(comment.content || comment.text || '');
                                    }}
                                  >
                                    <Edit3 size={14} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.commentActionBtn} ${styles.commentActionDanger}`}
                                    onClick={() => {
                                      if (window.confirm('Delete this comment?')) {
                                        deleteCommentMutation.mutate(comment._id);
                                      }
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* ── Reply form ── */}
                            {showReplies[comment._id] && (
                              <div className={styles.replyFormArea}>
                                <textarea
                                  className={styles.replyTextarea}
                                  rows={2}
                                  placeholder="Write a reply…"
                                  value={replyDraft[comment._id] || ''}
                                  onChange={(e) => setReplyDraft((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                                />
                                <button
                                  type="button"
                                  className={styles.replySubmitBtn}
                                  onClick={() => submitReply(comment._id)}
                                  disabled={!(replyDraft[comment._id] || '').trim() || replyMutation.isPending}
                                >
                                  <Send size={14} />
                                  Reply
                                </button>
                              </div>
                            )}

                            {/* ── Nested Replies ── */}
                            {replies.length > 0 && (
                              <div className={styles.repliesList}>
                                {replies.map((reply) => {
                                  const replyAuthor = reply.author || {};
                                  const isReplyOwner = replyAuthor._id === user?._id;

                                  return (
                                    <div key={reply._id} className={styles.replyItem}>
                                      <Link
                                        to={replyAuthor._id ? `/users/${replyAuthor._id}` : '#'}
                                        className={styles.commentAvatarLink}
                                      >
                                        <Avatar
                                          src={replyAuthor.avatarUrl}
                                          name={replyAuthor.name}
                                          size={28}
                                        />
                                      </Link>
                                      <div className={styles.commentContent}>
                                        <div className={styles.commentMetaRow}>
                                          <Link
                                            to={replyAuthor._id ? `/users/${replyAuthor._id}` : '#'}
                                            className={styles.commentAuthor}
                                          >
                                            {replyAuthor.name || 'Community'}
                                          </Link>
                                          <span className={styles.commentDot}>·</span>
                                          <span className={styles.commentTimestamp}>{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className={styles.commentText}>
                                          {reply.content || reply.text || ''}
                                        </p>
                                        {isReplyOwner && (
                                          <div className={styles.commentActionsRow}>
                                            <button
                                              type="button"
                                              className={`${styles.commentActionBtn} ${styles.commentActionDanger}`}
                                              onClick={() => {
                                                if (window.confirm('Delete this reply?')) {
                                                  deleteCommentMutation.mutate(reply._id);
                                                }
                                              }}
                                            >
                                              <Trash2 size={13} />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noComments}>
                    <p>No feedback yet. Be the first to leave constructive feedback.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ═══════════ RIGHT SIDEBAR ═══════════ */}
          <aside className={styles.rightCol}>

            {/* ── Validation Score Card ── */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>Validation Score</h3>
              <div className={styles.ringContainer}>
                <svg width="180" height="180" viewBox="0 0 180 180" className={styles.ringSvg}>
                  <circle
                    cx="90" cy="90" r={SVG_RADIUS}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="90" cy="90" r={SVG_RADIUS}
                    fill="none"
                    stroke={clampedScore >= 60 ? '#10b981' : clampedScore >= 30 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={SVG_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                    className={styles.scoreArc}
                  />
                </svg>
                <div className={styles.ringCenter}>
                  <span className={styles.ringScore}>{clampedScore}</span>
                  <span className={styles.ringLabel}>VOTES</span>
                </div>
              </div>

              {/* Upvote / Downvote split */}
              <div className={styles.voteSplitRow}>
                <div className={`${styles.voteSplitItem} ${styles.voteSplitUp}`}>
                  <ThumbsUp size={14} />
                  <span className={styles.voteSplitCount}>{upvoteCount}</span>
                  <span className={styles.voteSplitLabel}>UPVOTES</span>
                </div>
                <div className={`${styles.voteSplitItem} ${styles.voteSplitDown}`}>
                  <ThumbsDown size={14} />
                  <span className={styles.voteSplitCount}>{downvoteCount}</span>
                  <span className={styles.voteSplitLabel}>DOWNVOTES</span>
                </div>
              </div>

              {/* Vouch / Critique Buttons */}
              <div className={styles.voteActionRow}>
                <button
                  type="button"
                  className={`${styles.voteActionBtn} ${styles.vouchBtn} ${isUpvoted ? styles.vouchBtnActive : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    voteMutation.mutate('up');
                  }}
                  disabled={voteMutation.isPending}
                >
                  <ThumbsUp size={18} />
                  <span>Vouch</span>
                </button>
                <button
                  type="button"
                  className={`${styles.voteActionBtn} ${styles.critiqueBtn} ${isDownvoted ? styles.critiqueBtnActive : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    voteMutation.mutate('down');
                  }}
                  disabled={voteMutation.isPending}
                >
                  <ThumbsDown size={18} />
                  <span>Critique</span>
                </button>
              </div>
            </div>

            {/* ── Proposed By Card ── */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>Proposed By</h3>
              <div className={styles.proposerRow}>
                <Avatar src={author?.avatarUrl} name={author?.name} size={48} />
                <div className={styles.proposerInfo}>
                  <span className={styles.proposerName}>{author?.name || 'Unknown User'}</span>
                  <span className={styles.proposerHeadline}>{author?.headline || 'Platform User'}</span>
                </div>
              </div>
              {author?._id && (
                <Link to={`/users/${author._id}`} className={styles.viewProfileBtn}>
                  View Talent Profile
                </Link>
              )}
            </div>

            {/* ── Real-Time Metrics Card ── */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>Real-Time Metrics</h3>
              <div className={styles.metricsList}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>
                    <TrendingUp size={14} />
                    Engagement Rate
                  </span>
                  <span className={styles.metricValue}>{totalVotes > 0 ? `${((upvoteCount / Math.max(totalVotes, 1)) * 100).toFixed(1)}%` : '—'}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>
                    <Zap size={14} />
                    Virality Score
                  </span>
                  <span className={styles.metricValue}>{clampedScore}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>
                    <UserCheck size={14} />
                    Active Testers
                  </span>
                  <span className={styles.metricValue}>{totalVotes}</span>
                </div>
              </div>
            </div>

            {/* ── Share & Save Actions ── */}
            <div className={styles.sidebarCard}>
              <button type="button" className={styles.sidebarActionBtn} onClick={handleShare}>
                <Share2 size={16} />
                <span>{shareFeedback === 'copied' ? 'Link Copied!' : 'Share Idea'}</span>
              </button>
              <button
                type="button"
                className={`${styles.sidebarActionBtn} ${isSaved ? styles.sidebarActionBtnSaved : ''}`}
                onClick={handleSaveToggle}
                disabled={saveMutation.isPending || unsaveMutation.isPending}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{isSaved ? 'Saved' : 'Save for Later'}</span>
              </button>

              {/* Convert to Project (sidebar fallback for non-banner case) */}
              {!showValidationSuccess && conversionEnabled && hasConversionAccess && (
                <button
                  type="button"
                  className={styles.sidebarConvertBtn}
                  onClick={() => {
                    if (confirm('Convert this validated idea into a project? The project will be pre-filled with your idea details.')) {
                      convertMutation.mutate();
                    }
                  }}
                  disabled={convertMutation.isPending}
                >
                  {convertMutation.isPending ? <Loader2 size={16} className={styles.spinner} /> : <Rocket size={16} />}
                  <span>Convert to Project</span>
                </button>
              )}
              {idea?.status === 'converted' && (
                <p className={styles.convertedHint}>
                  <Check size={14} /> This idea has been converted to a project.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};