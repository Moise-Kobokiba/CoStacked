// src/pages/IdeaDetailPage.jsx

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Loader2 } from 'lucide-react';
import { getIdeaById, getIdeaComments, addIdeaComment, voteIdea } from '../api/ideasApi';
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
          newScore += direction === 'up' ? -10 : 5;
        } else if (currentType === 'up' && direction === 'down') {
          newScore -= 15;
        } else if (currentType === 'down' && direction === 'up') {
          newScore += 15;
        } else {
          newScore += direction === 'up' ? 10 : -5;
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
      <button className={styles.backButton} type="button" onClick={() => navigate('/validation-board')}>
        <ArrowLeft size={16} /> Back to Validation Board
      </button>

      {ideaLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : !idea ? (
        <div style={{ padding: '4rem 0', color: 'var(--muted-foreground)' }}>
          Idea not found.
        </div>
      ) : (
        <>
          <section className={styles.header}>
            <div className={styles.titleRow}>
              <span className={`${styles.stageBadge} ${stageClassName(displayStage(idea))}`}>
                {displayStage(idea)}
              </span>
              <h1 className={styles.title}>{idea.title}</h1>
              <div className={styles.metaRow}>
                <span>Posted {formatDate(idea.createdAt)}</span>
                {author && (
                  <Link to={getAuthorLink(author)} className={styles.authorLink}>
                    <span className={styles.authorBadge}>
                      {author.avatarUrl ? <img src={author.avatarUrl} alt={author.name} /> : authorInitials}
                    </span>
                    <span className={styles.authorText}>
                      <span className={styles.authorName}>{author.name}</span>
                      <span className={styles.authorSubtitle}>View profile</span>
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.scorePanel}>
              <span className={styles.scoreLabel}>Validation score</span>
              <span className={styles.scoreValue}>{ideaScore}</span>
              <div className={styles.votesRow}>
                <button
                  type="button"
                  className={`${styles.voteBtn} ${styles.voteBtnUp} ${isUpvoted ? styles.voteBtnActive : ''}`}
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
                </button>
                <button
                  type="button"
                  className={`${styles.voteBtn} ${styles.voteBtnDown} ${isDownvoted ? styles.voteBtnActive : ''}`}
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
                </button>
              </div>
            </div>
          </section>

          <section className={styles.sectionGrid}>
            <article className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Target Market</h2>
              <p className={styles.sectionText}>{idea.industry || 'No target market defined yet.'}</p>
            </article>
            <article className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Problem Statement</h2>
              <p className={styles.sectionText}>{idea.problemStatement || 'No problem statement provided yet.'}</p>
            </article>
            <article className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Target Users</h2>
              {targetUsers.length > 0 ? (
                <ul className={styles.sectionText} style={{ paddingLeft: '1rem', listStyleType: 'disc' }}>
                  {targetUsers.map((person, index) => (
                    <li key={index}>{person}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.sectionText}>{idea.targetAudience || 'No target users specified yet.'}</p>
              )}
            </article>
            <article className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Your Solution</h2>
              <p className={styles.sectionText}>{idea.valueProposition || 'No solution details added yet.'}</p>
            </article>
          </section>

          <section className={styles.commentCard}>
            <div className={styles.commentHeader}>
              <div>
                <h2 className={styles.commentTitle}>Community Feedback</h2>
                <p className={styles.commentCount}>{commentsToRender.length} comments</p>
              </div>
              <div>{(commentsLoading || commentMutation.isLoading) && <Loader2 size={20} className="animate-spin" />}</div>
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
                  return (
                    <div key={comment._id || comment.createdAt || Math.random()} className={styles.commentItem}>
                      <span className={styles.commentAvatar}>
                        {commenter.avatarUrl ? (
                          <img src={commenter.avatarUrl} alt={commenter.name} />
                        ) : (
                          initials
                        )}
                      </span>
                      <div className={styles.commentBody}>
                        <div className={styles.commentMeta}>
                          <span className={styles.commentAuthor}>{commenter.name || 'Community'}</span>
                          <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className={styles.commentText}>{comment.content || comment.text || 'No comment text.'}</p>
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
                    placeholder="Leave constructive feedback or suggestions..."
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.commentSubmit}
                    onClick={submitComment}
                    disabled={!commentDraft.trim() || commentMutation.isLoading}
                  >
                    Submit feedback
                  </button>
                </>
              ) : (
                <p className={styles.loginPrompt}>
                  <Link to="/login" className={styles.loginLink}>
                    Log in
                  </Link>{' '}
                  to leave constructive feedback.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
};
