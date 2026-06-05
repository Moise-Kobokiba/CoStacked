import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, Heart, Reply, Loader2, Check } from 'lucide-react';
import { getIdeaById, getIdeaComments, addIdeaComment, voteIdea, convertIdeaToProject } from '../api/ideasApi';
import styles from './IdeaDetailPage.module.css';

const stageClassName = (stage) => {
  const normalized = String(stage || '').toLowerCase();
  if (normalized.includes('validation')) return styles.stageValidation;
  if (normalized.includes('refin')) return styles.stageRefining;
  if (normalized.includes('mvp')) return styles.stageMvp;
  if (normalized.includes('archiv')) return styles.stageArchived;
  return styles.stageConcept;
};

const displayStage = (idea) => {
  if (!idea) return 'Ideation';
  if (idea.stage) return idea.stage;
  if (idea.status) return idea.status[0].toUpperCase() + idea.status.slice(1);
  return 'Ideation';
};

const formatDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getAuthorLink = (founder) => {
  if (!founder?._id) return '/profile';
  return `/users/${founder._id}`;
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

export const IdeaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth || {});

  const [voteState, setVoteState] = useState({ type: null, score: 0 });
  const [commentDraft, setCommentDraft] = useState('');
  const [newComments, setNewComments] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [shareFeedback, setShareFeedback] = useState(null);

  const { data: idea, isLoading: ideaLoading } = useQuery(
    ['ideaDetail', id],
    () => getIdeaById(id, token),
    { enabled: !!id }
  );

  const { data: comments = [], isLoading: commentsLoading } = useQuery(
    ['ideaComments', id],
    () => getIdeaComments(id),
    { enabled: !!id }
  );

  useEffect(() => {
    if (!idea) return;
    setVoteState({
      type: getVoteType(idea, user),
      score: idea.validationScore ?? idea.voteCount ?? 0,
    });
  }, [idea, user]);

  const ideaScore = voteState.score;
  const isUpvoted = voteState.type === 'up';
  const isDownvoted = voteState.type === 'down';

  const upvoteCount = idea?.upvotes?.length ?? 0;
  const downvoteCount = idea?.downvotes?.length ?? 0;

  const voteMutation = useMutation({
    mutationFn: (direction) => voteIdea(id, direction, token),
    onMutate: async (direction) => {
      await queryClient.cancelQueries(['ideaDetail', id]);
      const previousVote = voteState;
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
        return { type: newType, score: newScore };
      });
      return { previousVote };
    },
    onError: (_error, _direction, context) => {
      if (context?.previousVote) setVoteState(context.previousVote);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['ideaDetail', id]);
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
    }
  });

  const MIN_CONVERSION_SCORE = 60;
  const isIdeaOwner = idea?.founder?._id === user?._id;
  const hasConversionAccess = isIdeaOwner || user?.isAdmin;
  const conversionEnabled = idea && idea.validationScore >= MIN_CONVERSION_SCORE && idea.status !== 'converted';
  const showConversionButton = hasConversionAccess && idea?.status !== 'converted';

  const commentMutation = useMutation({
    mutationFn: (content) => addIdeaComment(id, content, token),
    onSuccess: (comment) => {
      setNewComments((prev) => [comment, ...prev]);
      setCommentDraft('');
      queryClient.invalidateQueries(['ideaComments', id]);
    },
  });

  const submitComment = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    commentMutation.mutate(trimmed);
  };

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (err) { console.error(err); }
  }, []);

  const handleSaveToggle = useCallback(() => {
    setIsSaved((prev) => !prev);
  }, []);

  const handleCommentLike = useCallback((commentId) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: {
        liked: !prev[commentId]?.liked,
        count: (prev[commentId]?.count || 0) + (prev[commentId]?.liked ? -1 : 1),
      },
    }));
  }, []);

  const author = idea?.founder;
  const authorInitials = author?.name
    ? author.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const targetUsers = idea?.targetAudience
    ? idea.targetAudience.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const commentsToRender = [...newComments, ...(comments || [])];

  // SVG ring constants
  const SVG_RADIUS = 96;
  const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;
  const clampedScore = Math.max(0, Math.min(100, ideaScore));
  const dashOffset = SVG_CIRCUMFERENCE - (clampedScore / 100) * SVG_CIRCUMFERENCE;

  if (ideaLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinner} />
        </div>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>Idea not found.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* ===== BREADCRUMB ===== */}
        <Link to="/validation-board" className={styles.breadcrumb}>
          <ArrowLeft size={18} />
          <span>Back to Validation Board</span>
        </Link>

        {/* ===== 12-COLUMN GRID ===== */}
        <div className={styles.grid}>
          {/* ===== LEFT COLUMN ===== */}
          <div className={styles.leftCol}>

            {/* HEADER CANVAS */}
            <section className={styles.headerCanvas}>
              <div className={styles.headerRow}>
                <span className={`${styles.stageBadge} ${stageClassName(displayStage(idea))}`}>
                  {displayStage(idea)}
                </span>
                <span className={styles.headerDate}>{formatDate(idea.createdAt)}</span>
              </div>
              <h1 className={styles.title}>{idea.title}</h1>
              <Link to={getAuthorLink(author)} className={styles.authorCard}>
                <span className={styles.authorAvatar}>
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.name} />
                  ) : (
                    authorInitials
                  )}
                </span>
                <span className={styles.authorMeta}>
                  <span className={styles.authorName}>{author?.name || 'Alex Rivera'}</span>
                  <span className={styles.authorRole}>{author?.headline || 'Project Lead & AI Researcher'}</span>
                </span>
              </Link>
            </section>

            {/* PROBLEM STATEMENT & TARGET MARKET */}
            <div className={styles.problemMarketGrid}>
              <article className={styles.problemCard}>
                <span className={styles.cardLabel}>Problem Statement</span>
                <p className={styles.cardContent}>{idea.problemStatement || 'No problem statement provided yet.'}</p>
              </article>
              <article className={styles.marketCard}>
                <span className={styles.cardLabel}>Target Market</span>
                <p className={styles.cardContent}>{idea.industry || 'No target market defined yet.'}</p>
              </article>
            </div>

            {/* TARGET USERS */}
            <section className={styles.targetUsersSection}>
              <span className={styles.cardLabel}>Target Audience</span>
              <div className={styles.userTags}>
                {targetUsers.length > 0 ? (
                  targetUsers.map((tag, i) => <span key={i} className={styles.userTag}>{tag}</span>)
                ) : (
                  <span className={styles.userTag}>No target users specified yet.</span>
                )}
              </div>
            </section>

            {/* OUR SOLUTION */}
            <article className={styles.solutionCard}>
              <span className={styles.cardLabel}>Our Solution</span>
              <p className={styles.cardContent}>{idea.valueProposition || 'No solution details added yet.'}</p>
            </article>

            {/* COMMUNITY COMMENTS THREAD */}
            <section className={styles.commentsSection}>
              <div className={styles.commentsHeader}>
                <div>
                  <h2 className={styles.commentsTitle}>Community Feedback</h2>
                  <p className={styles.commentsCount}>{commentsToRender.length} comments</p>
                </div>
                {(commentsLoading || commentMutation.isLoading) && <Loader2 size={20} className={styles.spinner} />}
              </div>

              <div className={styles.commentItems}>
                {commentsToRender.length > 0 ? (
                  commentsToRender.map((comment) => {
                    const commenter = comment.author || {};
                    const initials = commenter.name
                      ? commenter.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                      : 'U';
                    const commentId = comment._id || comment.createdAt || Math.random().toString();
                    const likeState = commentLikes[commentId] || { liked: false, count: 0 };
                    const initialLikeCount = comment.likes?.length ?? 0;
                    const totalLikes = initialLikeCount + likeState.count;
                    return (
                      <div key={commentId} className={styles.commentItem}>
                        <span className={styles.commentUserAvatar}>
                          {commenter.avatarUrl ? (
                            <img src={commenter.avatarUrl} alt={commenter.name} />
                          ) : initials}
                        </span>
                        <div className={styles.commentBody}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>{commenter.name || 'Community'}</span>
                            <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className={styles.commentContent}>{comment.content || comment.text || 'No comment text.'}</p>
                          <div className={styles.commentActions}>
                            <button
                              type="button"
                              className={`${styles.actionLink} ${likeState.liked ? styles.actionLiked : ''}`}
                              onClick={() => handleCommentLike(commentId)}
                            >
                              <Heart size={15} />
                              <span>{totalLikes > 0 ? totalLikes : 'Like'}</span>
                            </button>
                            <button type="button" className={styles.actionLink}>
                              <Reply size={15} />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.noComments}>No feedback yet. Leave the first constructive comment.</p>
                )}
              </div>

              <div className={styles.commentForm}>
                {isAuthenticated ? (
                  <>
                    <textarea
                      className={styles.textarea}
                      rows={4}
                      placeholder="Add your feedback to help refine this idea..."
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={submitComment}
                      disabled={!commentDraft.trim() || commentMutation.isLoading}
                    >
                      Post Feedback
                    </button>
                  </>
                ) : (
                  <p className={styles.loginPrompt}>
                    <Link to="/login" className={styles.loginLink}>Log in</Link> to leave feedback.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ===== RIGHT SIDEBAR (sticky) ===== */}
          <aside className={styles.rightCol}>
            {/* VALIDATION SCORE RING */}
            <section className={styles.sideCard}>
              <div className={styles.scoreLabelRow}>
                <span className={styles.scoreLabel}>Validation Score</span>
                <span className={styles.scoreSubtext}>Out of 100</span>
              </div>
              <div className={styles.scoreRingContainer}>
                <svg width="220" height="220" viewBox="0 0 220 220" className={styles.ringSvg}>
                  <circle
                    cx="110" cy="110" r={SVG_RADIUS}
                    fill="none"
                    stroke="var(--input-background)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="110" cy="110" r={SVG_RADIUS}
                    fill="none"
                    stroke="#00327d"
                    strokeWidth="8"
                    strokeDasharray={SVG_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 110 110)"
                    className={styles.scoreArc}
                  />
                </svg>
                <div className={styles.scoreValueBox}>
                  <span className={styles.scoreNumber}>{clampedScore}</span>
                  <span className={styles.scoreOutOf}>OUT OF 100</span>
                </div>
              </div>
            </section>

            {/* UPVOTE & DOWNVOTE */}
            <section className={styles.sideCard}>
              <button
                type="button"
                className={`${styles.voteBtn} ${styles.upvoteBtn} ${isUpvoted ? styles.voteActive : ''}`}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  voteMutation.mutate('up');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsUp size={20} />
                <span className={styles.voteLabel}>Upvote</span>
                <span className={styles.voteStats}>{upvoteCount} people agree</span>
              </button>
              <button
                type="button"
                className={`${styles.voteBtn} ${styles.downvoteBtn} ${isDownvoted ? styles.voteActive : ''}`}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  voteMutation.mutate('down');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsDown size={20} />
                <span className={styles.voteLabel}>Downvote</span>
                <span className={styles.voteStats}>{downvoteCount} people disagree</span>
              </button>
            </section>

            {/* ACTION CTA BLOCKS */}
            <section className={styles.sideCard}>
              <button
                type="button"
                className={styles.ctaBtn}
                onClick={handleShare}
              >
                <Share2 size={18} />
                <span>{shareFeedback === 'copied' ? 'Link Copied!' : 'Share Idea'}</span>
              </button>
              <button
                type="button"
                className={`${styles.ctaBtn} ${isSaved ? styles.ctaSaved : ''}`}
                onClick={handleSaveToggle}
              >
                {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                <span>{isSaved ? 'Saved' : 'Save for Later'}</span>
              </button>

              {showConversionButton && (
                <button
                  type="button"
                  className={`${styles.convertBtn} ${conversionEnabled ? '' : styles.convertLocked}`}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    if (!conversionEnabled) return;
                    if (confirm('Convert this idea into a project?')) convertMutation.mutate();
                  }}
                  disabled={!conversionEnabled || convertMutation.isLoading}
                >
                  <span>{conversionEnabled ? 'Convert to Project' : 'Conversion Locked'}</span>
                </button>
              )}
              {showConversionButton && !conversionEnabled && (
                <p className={styles.convertHint}>
                  Reach a validation score of {MIN_CONVERSION_SCORE} to unlock project conversion.
                </p>
              )}
              {idea?.status === 'converted' && (
                <p className={styles.convertHint} style={{ color: 'var(--success)' }}>
                  This idea has already been converted to a project.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};