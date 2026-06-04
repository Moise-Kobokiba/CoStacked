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

  // Derived vote counts
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
          newScore -= 20; // removing an up (+15) and adding a down (-5)
        } else if (currentType === 'down' && direction === 'up') {
          newScore += 20; // removing a down (-5) and adding an up (+15)
        } else {
          newScore += direction === 'up' ? 15 : -5;
        }

        return { type: newType, score: newScore };
      });
      return { previousVote };
    },
    onError: (_error, _direction, context) => {
      if (context?.previousVote) {
        setVoteState(context.previousVote);
      }
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    commentMutation.mutate(trimmed);
  };

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (err) {
      console.error(err);
    }
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
    ? author.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const targetUsers = idea?.targetAudience
    ? idea.targetAudience.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const commentsToRender = [...newComments, ...(comments || [])];

  return (
    <main className={styles.page}>
      <Link to="/validation-board" className={styles.backButton}>
        <ArrowLeft size={16} />
        <span>Back to Validation Board</span>
      </Link>

      {ideaLoading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : !idea ? (
        <div className={styles.emptyState}>Idea not found.</div>
      ) : (
        <div className={styles.layoutGrid}>
          <div className={styles.leftColumn}>
            {/* ── HEADER / HERO SECTION ── */}
            <section className={styles.heroCard}>
              <div className={styles.heroTop}>
                <span className={`${styles.stageBadge} ${stageClassName(displayStage(idea))}`}>
                  {displayStage(idea)}
                </span>
                <span className={styles.heroDate}>{formatDate(idea.createdAt)}</span>
              </div>
              <h1 className={styles.heroTitle}>{idea.title}</h1>
              <div className={styles.authorRow}>
                <Link to={getAuthorLink(author)} className={styles.authorLink}>
                  <span className={styles.authorBadge}>
                    {author?.avatarUrl ? <img src={author.avatarUrl} alt={author.name} /> : authorInitials}
                  </span>
                  <span className={styles.authorMeta}>
                    <span className={styles.authorName}>{author?.name || 'Alex Rivera'}</span>
                    <span className={styles.authorRole}>{author?.headline || 'Project Lead & AI Researcher'}</span>
                  </span>
                </Link>
              </div>
            </section>

            {/* ── PROBLEM STATEMENT & TARGET MARKET ── */}
            <div className={styles.infoGrid}>
              <article className={`${styles.sectionCard} ${styles.problemCard}`}>
                <p className={styles.sectionTag}>Problem Statement</p>
                <p className={styles.sectionText}>{idea.problemStatement || 'No problem statement provided yet.'}</p>
              </article>
              <article className={`${styles.sectionCard} ${styles.marketCard}`}>
                <p className={styles.sectionTag}>Target Market</p>
                <p className={styles.sectionText}>{idea.industry || 'No target market defined yet.'}</p>
              </article>
            </div>

            {/* ── TARGET USERS TAGS ── */}
            <div className={styles.tagsWrapper}>
              <span className={styles.tagsLabel}>Target Users</span>
              <div className={styles.tagList}>
                {targetUsers.length > 0 ? (
                  targetUsers.map((userTag, index) => (
                    <span key={index} className={styles.tagItemLight}>{userTag}</span>
                  ))
                ) : (
                  <span className={styles.tagItemLight}>No target users specified yet.</span>
                )}
              </div>
            </div>

            {/* ── OUR SOLUTION ── */}
            <article className={`${styles.sectionCard} ${styles.solutionCard}`}>
              <p className={styles.sectionTag}>Our Solution</p>
              <p className={styles.sectionText}>{idea.valueProposition || 'No solution details added yet.'}</p>
            </article>

            {/* ── CONCEPTUAL VISUALIZATION ── */}
            <section className={styles.visualizationCard}>
              <div className={styles.visualizationInner}>
                <div className={styles.visualizationIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <ellipse cx="12" cy="12" rx="4" ry="10" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </div>
                <p className={styles.visualizationLabel}>Conceptual Visualization</p>
                <p className={styles.visualizationHint}>World map network graphic placeholder</p>
              </div>
            </section>

            {/* ── COMMUNITY FEEDBACK / COMMENTS ── */}
            <section className={styles.commentCard}>
              <div className={styles.commentHeader}>
                <div>
                  <h2 className={styles.commentTitle}>Community Feedback</h2>
                  <p className={styles.commentCount}>{commentsToRender.length} comments</p>
                </div>
                {(commentsLoading || commentMutation.isLoading) && <Loader2 size={20} className="animate-spin" />}
              </div>

              <div className={styles.commentList}>
                {commentsToRender.length > 0 ? (
                  commentsToRender.map((comment) => {
                    const commenter = comment.author || {};
                    const initials = commenter.name
                      ? commenter.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U';
                    const commentId = comment._id || comment.createdAt || Math.random().toString();
                    const likeState = commentLikes[commentId] || { liked: false, count: 0 };
                    const initialLikeCount = comment.likes?.length ?? 0;
                    const totalLikes = initialLikeCount + likeState.count;
                    return (
                      <div key={commentId} className={styles.commentItem}>
                        <span className={styles.commentAvatar}>
                          {commenter.avatarUrl ? <img src={commenter.avatarUrl} alt={commenter.name} /> : initials}
                        </span>
                        <div className={styles.commentBody}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>{commenter.name || 'Community'}</span>
                            <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className={styles.commentText}>{comment.content || comment.text || 'No comment text.'}</p>
                          <div className={styles.commentActions}>
                            <button
                              type="button"
                              className={`${styles.commentActionBtn} ${likeState.liked ? styles.commentActionLiked : ''}`}
                              onClick={() => handleCommentLike(commentId)}
                            >
                              <Heart size={14} />
                              <span>{totalLikes > 0 ? totalLikes : 'Like'}</span>
                            </button>
                            <button type="button" className={styles.commentActionBtn}>
                              <Reply size={14} />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.commentText}>No feedback yet. Leave the first constructive comment.</p>
                )}
              </div>

              <div className={styles.commentForm}>
                {isAuthenticated ? (
                  <>
                    <textarea
                      className={styles.commentTextarea}
                      rows={4}
                      placeholder="Add your feedback to help refine this idea..."
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.commentSubmit}
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

          {/* ── RIGHT COLUMN / SIDEBAR ── */}
          <aside className={styles.rightColumn}>
            {/* SCORE */}
            <section className={styles.scoreCard}>
              <div className={styles.scoreHeader}>
                <span className={styles.scoreHeadline}>Validation Score</span>
                <span className={styles.scoreSub}>Out of 100</span>
              </div>
              <div className={styles.scoreRingWrapper}>
                <div
                  className={styles.scoreRing}
                  style={{
                    background: `conic-gradient(var(--primary) 0% ${Math.max(0, Math.min(100, ideaScore))}%, var(--input-background) ${Math.max(0, Math.min(100, ideaScore))}% 100%)`,
                  }}
                >
                  <div className={styles.scoreRingInner}>
                    <span className={styles.scoreRingValue}>{Math.max(0, Math.min(100, ideaScore))}</span>
                    <span className={styles.scoreRingLabel}>OUT OF 100</span>
                  </div>
                </div>
              </div>
            </section>

            {/* VOTING */}
            <section className={styles.actionCard}>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.upvoteButton} ${isUpvoted ? styles.actionButtonActive : ''}`}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  voteMutation.mutate('up');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsUp size={18} />
                <span>Upvote</span>
                <span className={styles.voteCount}>{upvoteCount} people agree</span>
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.downvoteButton} ${isDownvoted ? styles.actionButtonActive : ''}`}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  voteMutation.mutate('down');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsDown size={18} />
                <span>Downvote</span>
                <span className={styles.voteCount}>{downvoteCount} people disagree</span>
              </button>

              {/* UTILITIES */}
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleShare}
              >
                <Share2 size={18} />
                <span>{shareFeedback === 'copied' ? 'Link Copied!' : 'Share Idea'}</span>
              </button>
              <button
                type="button"
                className={`${styles.secondaryButton} ${isSaved ? styles.secondaryButtonSaved : ''}`}
                onClick={handleSaveToggle}
              >
                {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                <span>{isSaved ? 'Saved' : 'Save for Later'}</span>
              </button>
              {showConversionButton && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.convertButton} ${conversionEnabled ? '' : styles.actionButtonDisabled}`}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    if (!conversionEnabled) return;
                    if (confirm('Convert this idea into a project?')) {
                      convertMutation.mutate();
                    }
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

            {/* COMMUNITY FEEDBACK WIDGET */}
            <section className={styles.feedbackSummary}>
              <p className={styles.feedbackTitle}>Community Feedback</p>
              <p className={styles.feedbackQuote}>
                &ldquo;This idea clearly targets a well-defined audience, and the value proposition is both crisp and compelling.&rdquo;
              </p>
              <div className={styles.feedbackAvatars}>
                <div className={styles.avatarRing}>MC</div>
                <div className={styles.avatarRing}>SJ</div>
                <div className={styles.avatarRing}>AL</div>
                <span className={styles.avatarMore}>+45</span>
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
};