import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, Bookmark, Reply, Loader2, Check, Edit3, Trash2, MessageSquare, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { getIdeaById, getIdeaComments, addIdeaComment, voteIdea, convertIdeaToProject, deleteIdeaComment, editIdeaComment, incrementIdeaViewCount, shareIdea, likeIdeaComment } from '../api/ideasApi';
import { saveItem, unsaveItemByType, checkSaved } from '../api/savedItemsApi';
import styles from './IdeaDetailPage.module.css';

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

const renderRichText = (text) => {
  if (!text) return <p className={styles.accentText}>No content provided.</p>;
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const blocks = [];
  let listItems = [];

  lines.forEach((line) => {
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      listItems.push(line.slice(2).trim());
      return;
    }

    if (listItems.length) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }

    if (line) {
      blocks.push({ type: 'paragraph', content: line });
    }
  });

  if (listItems.length) {
    blocks.push({ type: 'list', items: listItems });
  }

  return blocks.map((block, index) => {
    if (block.type === 'list') {
      return (
        <ul key={index} className={styles.richList}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className={styles.accentText}>
        {block.content}
      </p>
    );
  });
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

  const { data: idea, isLoading: ideaLoading } = useQuery(
    ['ideaDetail', id],
    () => getIdeaById(id, token),
    { enabled: !!id }
  );

  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['ideaComments', id, commentPage],
    () => getIdeaComments(id, { page: commentPage, limit: COMMENT_PAGE_SIZE }),
    { enabled: !!id, keepPreviousData: true }
  );

  // Check if idea is saved
  useEffect(() => {
    if (!id || !token || !isAuthenticated) return;
    checkSaved(token, 'idea', id).then((data) => {
      setIsSaved(data.isSaved);
      if (data.savedItem) setSavedItemId(data.savedItem._id);
    }).catch(() => {});
  }, [id, token, isAuthenticated]);

  // Join idea-specific socket room so we receive targeted real-time updates
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
        queryClient.invalidateQueries(['ideaDetail', id]);
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

  const ideaScore = voteState.score;
  const isUpvoted = voteState.type === 'up';
  const isDownvoted = voteState.type === 'down';

  const comments = commentsData?.comments ?? [];
  const totalComments = idea?.commentCount ?? commentsData?.totalTopComments ?? 0;
  const hasMoreComments = commentsData?.hasMore ?? false;
  const saveCount = idea?.saveCount ?? 0;
  const shareCount = idea?.shareCount ?? 0;
  const viewCount = idea?.viewCount ?? 0;
  const engagementRate = idea?.engagementRate ?? 0;
  const validationTrend = idea?.validationTrend ?? 'Stable';

  // Prefer backend-provided metadata when available; fall back to arrays if needed
  const upvoteCount = idea?.upvoteCount ?? idea?.upvotes?.length ?? 0;
  const downvoteCount = idea?.downvoteCount ?? idea?.downvotes?.length ?? 0;
  const totalVotes = idea?.totalVotes ?? (upvoteCount + downvoteCount);
  const downvotePercentage = idea?.downvotePercentage ?? (totalVotes > 0 ? (downvoteCount / totalVotes) * 100 : 0);

  // Use backend validationStatus / canConvert when provided
  const ideaAge = idea ? (new Date() - new Date(idea.createdAt)) / (1000 * 60 * 60 * 24) : 0;
  const showValidationFailure = (idea?.validationStatus === 'Unsuccessful') || (ideaAge >= 3 && downvotePercentage >= 50);
  const showValidationSuccess = (idea?.validationStatus === 'Highly Validated') || (upvoteCount >= 80);
  const MIN_CONVERSION_SCORE = 60;

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
        return { type: newType, score: Math.max(0, Math.min(100, newScore)) };
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

  const commentMutation = useMutation({
    mutationFn: (content) => addIdeaComment(id, content, token),
    onSuccess: () => {
      setCommentDraft('');
      queryClient.invalidateQueries(['ideaComments', id]);
      queryClient.invalidateQueries(['ideaDetail', id]);
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ content, parentCommentId }) => addIdeaComment(id, content, token, parentCommentId),
    onSuccess: () => {
      setReplyDraft({});
      queryClient.invalidateQueries(['ideaComments', id]);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteIdeaComment(id, commentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries(['ideaComments', id]);
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => editIdeaComment(id, commentId, content, token),
    onSuccess: () => {
      setEditingComment(null);
      setEditDraft('');
      queryClient.invalidateQueries(['ideaComments', id]);
      queryClient.invalidateQueries(['ideaDetail', id]);
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Failed to edit comment');
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: ({ commentId }) => likeIdeaComment(id, commentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries(['ideaComments', id]);
      queryClient.invalidateQueries(['ideaDetail', id]);
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
  }, [isSaved, isAuthenticated, navigate]);

  const handleShare = useCallback(async () => {
    try {
      await shareIdea(id);
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      queryClient.invalidateQueries(['ideaDetail', id]);
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (err) {
      console.error(err);
      setShareFeedback('error');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  }, [id, queryClient]);

  const author = idea?.founder;
  const authorAvatarInitial = author?.name
    ? author.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const targetUsers = idea?.targetAudience
    ? idea.targetAudience.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

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
        <div className={styles.emptyState}>
          <h2>Idea not found.</h2>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <Link to="/validation-board" className={styles.breadcrumb}>
          <ArrowLeft size={18} />
          <span>Back to Validation Board</span>
        </Link>

        {/* Validation Status Banners */}
        <div
          className={
            styles.validationBanner + ' ' +
            (showValidationSuccess
              ? styles.bannerSuccess
              : showValidationFailure
              ? styles.bannerWarning
              : styles.bannerNeutral)
          }
        >
          {showValidationSuccess ? (
            <>
              <CheckCircle size={20} />
              <span>This idea has earned strong community validation.</span>
            </>
          ) : showValidationFailure ? (
            <>
              <AlertTriangle size={20} />
              <span>This idea currently shows low validation from the community.</span>
            </>
          ) : (
            <>
              <MessageSquare size={20} />
              <span>Validation is in progress. Track community feedback and vote activity live.</span>
            </>
          )}
          {showValidationSuccess && conversionEnabled && hasConversionAccess && idea.status !== 'converted' && (
            <button className={styles.bannerAction} onClick={() => {
              if (confirm('Convert this validated idea into a project? The project will be pre-filled with your idea details.')) {
                handleConvertToProject();
              }
            }}>
              Turn Into Project
            </button>
          )}
        </div>

        {/* 12-Column Grid */}
        <div className={styles.grid12}>

          {/* LEFT COLUMN */}
          <div className={styles.leftCol}>
            <section className={styles.card}>
              <div className={styles.topRow}>
                <span className={styles.categoryBadge}>
                  {idea.industry || idea.tags?.[0] || 'Validation'}
                </span>
                <div className={styles.actionButtons}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleShare}>
                    <Share2 size={18} />
                    <span>{shareFeedback === 'copied' ? 'Link Copied!' : 'Share'}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.secondaryBtn} ${isSaved ? styles.secondaryBtnSaved : ''}`}
                    onClick={handleSaveToggle}
                    disabled={saveMutation.isLoading || unsaveMutation.isLoading}
                  >
                    {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              <h1 className={styles.ideaTitle}>{idea.title}</h1>
              <div className={styles.metaRow}>
                <span>Posted {formatDate(idea.createdAt)}</span>
                <span>{viewCount} views</span>
                <span>{idea.stage || 'Validation'}</span>
              </div>

              <Link to={author?._id ? `/users/${author._id}` : '/profile'} className={styles.authorRow}>
                <span className={styles.authorAvatar}>
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.name} />
                  ) : (
                    authorAvatarInitial
                  )}
                </span>
                <span className={styles.authorInfo}>
                  <span className={styles.authorName}>{author?.name || 'Unknown User'}</span>
                  <span className={styles.authorRole}>{author?.headline || 'Platform User'}</span>
                </span>
              </Link>
            </section>

            {/* Problem Statement */}
            <div className={styles.twoColGrid}>
              <article className={`${styles.accentCard} ${styles.problemCard}`}>
                <span className={styles.accentLabel}>Problem Statement</span>
                <p className={styles.accentText}>{idea.problemStatement || 'No problem statement provided yet.'}</p>
              </article>
              <article className={`${styles.accentCard} ${styles.marketCard}`}>
                <span className={styles.accentLabel}>Target Market</span>
                <p className={styles.accentText}>{idea.industry || 'No target market defined yet.'}</p>
              </article>
            </div>

            {/* Target Users */}
            <section className={styles.card}>
              <span className={styles.sectionLabel}>Target Users</span>
              <div className={styles.chipRow}>
                {targetUsers.length > 0 ? (
                  targetUsers.map((tag, i) => <span key={i} className={styles.chip}>{tag}</span>)
                ) : (
                  <span className={styles.chip}>No target users specified yet.</span>
                )}
              </div>
            </section>

            {/* Our Solution */}
            <article className={`${styles.accentCard} ${styles.solutionCard}`}>
              <span className={styles.accentLabel}>Our Solution</span>
              <p className={styles.accentText}>{idea.valueProposition || 'No solution details added yet.'}</p>
            </article>

            {/* Community Feedback */}
            <section className={styles.card}>
              <div className={styles.feedbackHeader}>
                <div>
                  <h2 className={styles.feedbackTitle}>Community Feedback</h2>
                  <p className={styles.feedbackCount}>{totalComments} comments</p>
                </div>
                {(commentsLoading || commentMutation.isLoading) && <Loader2 size={20} className={styles.spinner} />}
              </div>

              {/* Comment List */}
              <div className={styles.commentList}>
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const commenter = comment.author || {};
                    const initials = commenter.name
                      ? commenter.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                      : 'U';
                    const isCommentOwner = commenter._id?.toString() === user?._id?.toString();
                    const isCommentLiked = comment.likes?.some((item) => {
                      const id = item?._id || item;
                      return id?.toString() === user?._id?.toString();
                    });
                    const replies = comment.replies || [];
                    const isEditing = editingComment === comment._id;

                    return (
                      <div key={comment._id} className={styles.commentThread}>
                        <div className={styles.commentRow}>
                          {/* Clickable Avatar */}
                          <Link to={commenter._id ? `/users/${commenter._id}` : '#'} className={styles.commentUserCircle}>
                            {commenter.avatarUrl ? (
                              <img src={commenter.avatarUrl} alt={commenter.name} />
                            ) : initials}
                          </Link>
                          <div className={styles.commentBody}>
                            <div className={styles.commentMeta}>
                              {/* Clickable Username */}
                              <Link to={commenter._id ? `/users/${commenter._id}` : '#'} className={styles.commentAuthorName}>
                                {commenter.name || 'Community'}
                              </Link>
                              <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                            </div>
                            
                            {isEditing ? (
                              <div className={styles.editCommentForm}>
                                <textarea
                                  className={styles.textArea}
                                  rows={3}
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                />
                                <div className={styles.editActions}>
                                  <button
                                    className={styles.submitBtn}
                                    onClick={() => {
                                      if (!editDraft.trim()) return;
                                      editCommentMutation.mutate({ commentId: comment._id, content: editDraft.trim() });
                                    }}
                                    disabled={!editDraft.trim() || editCommentMutation.isLoading}
                                  >
                                    {editCommentMutation.isLoading ? <Loader2 size={14} className={styles.spinner} /> : 'Save'}
                                  </button>
                                  <button
                                    className={styles.cancelBtn}
                                    onClick={() => setEditingComment(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={styles.commentContent}>{comment.content || comment.text || 'No comment text.'}</p>
                            )}
                            
                            <div className={styles.commentActions}>
                              <button
                                type="button"
                                className={styles.cActionBtn}
                                onClick={() => {
                                  if (!isAuthenticated) { navigate('/login'); return; }
                                  setShowReplies((prev) => ({
                                    ...prev,
                                    [comment._id]: !prev[comment._id],
                                  }));
                                }}
                              >
                                <Reply size={15} />
                                <span>{replies.length > 0 ? `${replies.length} replies` : 'Reply'}</span>
                              </button>
                              <button
                                type="button"
                                className={styles.cActionBtn}
                                onClick={() => {
                                  if (!isAuthenticated) { navigate('/login'); return; }
                                  commentLikeMutation.mutate({ commentId: comment._id });
                                }}
                              >
                                <ThumbsUp size={15} />
                                <span>{comment.likeCount > 0 ? `${comment.likeCount} Like${comment.likeCount === 1 ? '' : 's'}` : 'Like'}</span>
                              </button>
                              {isCommentLiked && <span className={styles.likedBadge}>You liked this</span>}
                              {isCommentOwner && (
                                <>
                                  <button
                                    type="button"
                                    className={styles.cActionBtn}
                                    onClick={() => {
                                      setEditingComment(comment._id);
                                      setEditDraft(comment.content || comment.text || '');
                                    }}
                                  >
                                    <Edit3 size={15} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.cActionBtn}
                                    style={{ color: '#ef4444' }}
                                    onClick={() => {
                                      if (confirm('Delete this comment?')) {
                                        deleteCommentMutation.mutate(comment._id);
                                      }
                                    }}
                                  >
                                    <Trash2 size={15} />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Reply form */}
                            {showReplies[comment._id] && (
                              <div className={styles.replyForm}>
                                <textarea
                                  className={styles.textArea}
                                  rows={2}
                                  placeholder="Write a reply..."
                                  value={replyDraft[comment._id] || ''}
                                  onChange={(e) => setReplyDraft((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                                />
                                <button
                                  className={styles.submitBtn}
                                  onClick={() => submitReply(comment._id)}
                                  disabled={!(replyDraft[comment._id] || '').trim() || replyMutation.isLoading}
                                >
                                  <Send size={14} />
                                  Reply
                                </button>
                              </div>
                            )}

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className={styles.repliesList}>
                                {replies.map((reply) => {
                                  const replyAuthor = reply.author || {};
                                  const replyInitials = replyAuthor.name
                                    ? replyAuthor.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                                    : 'U';
                                  const isReplyOwner = replyAuthor._id?.toString() === user?._id?.toString();

                                  return (
                                    <div key={reply._id} className={styles.replyRow}>
                                      <Link to={replyAuthor._id ? `/users/${replyAuthor._id}` : '#'} className={styles.commentUserCircle + ' ' + styles.replyAvatar}>
                                        {replyAuthor.avatarUrl ? (
                                          <img src={replyAuthor.avatarUrl} alt={replyAuthor.name} />
                                        ) : replyInitials}
                                      </Link>
                                      <div className={styles.commentBody}>
                                        <div className={styles.commentMeta}>
                                          <Link to={replyAuthor._id ? `/users/${replyAuthor._id}` : '#'} className={styles.commentAuthorName}>
                                            {replyAuthor.name || 'Community'}
                                          </Link>
                                          <span className={styles.commentDate}>{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <p className={styles.commentContent}>{reply.content || reply.text || ''}</p>
                                        {isReplyOwner && (
                                          <div className={styles.commentActions}>
                                            <button
                                              type="button"
                                              className={styles.cActionBtn}
                                              style={{ color: '#ef4444' }}
                                              onClick={() => {
                                                if (confirm('Delete this reply?')) {
                                                  deleteCommentMutation.mutate(reply._id);
                                                }
                                              }}
                                            >
                                              <Trash2 size={14} />
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
                  <p className={styles.noComments}>No feedback yet. Leave the first constructive comment.</p>
                )}
              </div>
              {hasMoreComments && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setCommentPage((current) => current + 1)}
                  disabled={commentsLoading}
                >
                  Load more feedback
                </button>
              )}

              {/* Comment Form */}
              <div className={styles.commentForm}>
                {isAuthenticated ? (
                  <>
                    <textarea
                      className={styles.textArea}
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

          {/* RIGHT SIDEBAR */}
          <aside className={styles.rightCol}>
            {/* Validation Score Ring */}
            <section className={styles.sideCard}>
              <div className={styles.scoreHeader}>
                <span className={styles.scoreTitle}>Validation Score</span>
                <span className={styles.scoreSub}>Out of 100</span>
              </div>
              <div className={styles.ringContainer}>
                <svg width="220" height="220" viewBox="0 0 220 220" className={styles.ringSvg}>
                  <circle
                    cx="110" cy="110" r={SVG_RADIUS}
                    fill="none"
                    stroke="#e2e8f0"
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
                  <span className={styles.scoreOutOfLabel}>OUT OF 100</span>
                </div>
              </div>
              <div className={styles.voteRatio}>
                <span style={{ color: '#10B981' }}>{upvoteCount} upvotes</span>
                <span> / </span>
                <span style={{ color: '#f59e0b' }}>{downvoteCount} downvotes</span>
              </div>
              <div className={styles.statusLabel}>
                Status: <strong>{idea.status === 'converted' ? 'Converted to Project' : idea.status === 'validated' ? 'Validated' : 'Active'}</strong>
              </div>
            </section>

            <section className={`${styles.metricCard} ${styles.sideCard}`}>
              <span className={styles.sectionLabel}>Real-Time Metrics</span>
              <div className={styles.metricGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Engagement Rate</span>
                  <span className={styles.metricValue}>{engagementRate} / day</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Total Views</span>
                  <span className={styles.metricValue}>{viewCount}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Comments</span>
                  <span className={styles.metricValue}>{totalComments}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Saves</span>
                  <span className={styles.metricValue}>{saveCount}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Shares</span>
                  <span className={styles.metricValue}>{shareCount}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Validation Trend</span>
                  <span className={styles.metricValue}>{validationTrend}</span>
                </div>
              </div>
            </section>

            <section className={styles.sideCard}>
              <span className={styles.sectionLabel}>Proposed By</span>
              <Link to={author?._id ? `/users/${author._id}` : '/profile'} className={styles.authorRow}>
                <span className={styles.authorAvatar}>
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.name} />
                  ) : (
                    authorAvatarInitial
                  )}
                </span>
                <span className={styles.authorInfo}>
                  <span className={styles.authorName}>{author?.name || 'Unknown User'}</span>
                  <span className={styles.authorRole}>{author?.headline || 'Platform User'}</span>
                </span>
              </Link>
              <button
                type="button"
                className={styles.bannerAction}
                onClick={() => navigate(author?._id ? `/users/${author._id}` : '/profile')}
              >
                View Talent Profile
              </button>
            </section>

            {/* Vote Buttons */}
            <section className={styles.sideCard}>
              <button
                type="button"
                className={`${styles.voteBlock} ${styles.upvoteBlock} ${isUpvoted ? styles.voteBlockActiveUp : ''}`}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  voteMutation.mutate('up');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsUp size={20} />
                <span className={styles.voteLabel}>Upvote</span>
                <span className={styles.voteCount}>{upvoteCount}</span>
              </button>
              <button
                type="button"
                className={`${styles.voteBlock} ${styles.downvoteBlock} ${isDownvoted ? styles.voteBlockActiveDown : ''}`}
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  voteMutation.mutate('down');
                }}
                disabled={voteMutation.isLoading}
              >
                <ThumbsDown size={20} />
                <span className={styles.voteLabel}>Downvote</span>
                <span className={styles.voteCount}>{downvoteCount}</span>
              </button>
            </section>

            {/* Actions */}
            <section className={styles.sideCard}>
              <button type="button" className={styles.secondaryBtn} onClick={handleShare}>
                <Share2 size={18} />
                <span>{shareFeedback === 'copied' ? 'Link Copied!' : 'Share Idea'}</span>
              </button>
              <button
                type="button"
                className={`${styles.secondaryBtn} ${isSaved ? styles.secondaryBtnSaved : ''}`}
                onClick={handleSaveToggle}
                disabled={saveMutation.isLoading || unsaveMutation.isLoading}
              >
                {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                <span>{isSaved ? 'Saved' : 'Save for Later'}</span>
              </button>

              {/* Convert to Project - shown on validation success */}
              {showValidationSuccess && hasConversionAccess && idea.status !== 'converted' && (
                <button
                  type="button"
                  className={styles.convertBtn}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    if (confirm('Convert this validated idea into a project? The project will be pre-filled with your idea details.')) {
                      handleConvertToProject();
                    }
                  }}
                >
                  Convert To Project
                </button>
              )}
              {idea?.status === 'converted' && (
                <p className={styles.convertHint} style={{ color: '#10B981' }}>
                  ✓ This idea has been converted to a project.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};