// src/pages/ValidationBoardPage.jsx

import { useEffect, useState } from 'react';
import { 
  Search, PlusCircle, Lightbulb, ChevronLeft, ChevronRight, Loader2,
  ThumbsUp, ThumbsDown, MessageSquare, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { getStackPosts } from '../api/stackSuiteApi';
import { DiscussionDetail } from '../components/stack-suite/DiscussionDetail';
import { useDebounce } from '../hooks/useDebounce';
import styles from './ValidationBoard.module.css';

const PHASE_BADGE_CLASS = {
  Problem:  styles.badgeProblem,
  Solution: styles.badgeSolution,
  MVP:      styles.badgeMvp,
  General:  styles.badgeGeneral,
};

export function ValidationBoardPage() {
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [selectedId, setSelectedId]     = useState(null);

  const debouncedSearch = useDebounce(search, 500);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [voteState, setVoteState] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [localComments, setLocalComments] = useState({});

  const { data: posts = [], isLoading, isFetching } = useQuery({
    queryKey: ['validationPosts', { search: debouncedSearch, phase: phaseFilter }],
    queryFn: () => getStackPosts({ boardType: 'validation-board', search: debouncedSearch, phase: phaseFilter }),
  });

  useEffect(() => {
    setLocalComments((prev) => {
      const next = { ...prev };
      posts.forEach((post) => {
        if (next[post._id] === undefined) {
          next[post._id] = post.comments || [];
        }
      });
      return next;
    });
  }, [posts]);

  const formatDate = (value) => {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCommentsForPost = (post) => localComments[post._id] ?? post.comments ?? [];

  const handleVote = (postId, direction, baseScore) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setVoteState((prev) => {
      const current = prev[postId] || { type: null, score: baseScore };
      const currentType = current.type;
      let newType = direction;
      let newScore = current.score;

      if (currentType === direction) {
        newType = null;
        newScore += direction === 'upvote' ? -1 : 1;
      } else if (currentType === 'upvote' && direction === 'downvote') {
        newScore -= 2;
      } else if (currentType === 'downvote' && direction === 'upvote') {
        newScore += 2;
      } else {
        newScore += direction === 'upvote' ? 1 : -1;
      }

      return {
        ...prev,
        [postId]: { type: newType, score: newScore },
      };
    });
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const updateCommentInput = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const submitComment = (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setLocalComments((prev) => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        {
          author: { name: 'You', avatarUrl: null },
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    setCommentInputs((prev) => ({
      ...prev,
      [postId]: '',
    }));
  };

  const phases = [
    { id: 'all', label: 'All Ideas' },
    { id: 'Problem', label: 'Problem Validation' },
    { id: 'Solution', label: 'Solution Validation' },
    { id: 'MVP', label: 'MVP/Landing Page' },
  ];

  if (selectedId) {
    return (
      <div className={styles.container}>
        <DiscussionDetail discussionId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Validation Board</h1>
          <p className={styles.subtitle}>Validate your ideas with the community and build something people want. Get feedback from experienced builders.</p>
        </div>
        <Link to="/validation-board/create" className={styles.createBtn}>
          <PlusCircle size={20} />
          Post Your Idea
        </Link>
      </div>

      {/* Filter Tab Bar */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsInner}>
          <nav className={styles.tabsList}>
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => setPhaseFilter(phase.id)}
                className={`${styles.tabBtn} ${phaseFilter === phase.id ? styles.tabBtnActive : ''}`}
              >
                {phase.label}
              </button>
            ))}
          </nav>
          <div className={styles.searchWrapper}>
            <div className={styles.searchIcon}>
              {isFetching ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
            </div>
            <input 
              className={styles.searchInput}
              placeholder="Search ideas..." 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout Grid */}
      <div className={styles.mainContent}>
        <div className={styles.gridWrapper}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.sidebarCard} style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Lightbulb size={48} style={{ margin: '0 auto 1rem', color: 'var(--border)' }} />
              <h3 className={styles.sectionTitle}>No ideas found</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>Try a different filter or search term.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {posts.map(post => {
                const phaseClass = PHASE_BADGE_CLASS[post.phase] || styles.badgeGeneral;
                const authorUsername = post.author?.username || (post.author?.name ? post.author.name.toLowerCase().replace(/\s+/g, '-') : 'unknown');
                const commentList = getCommentsForPost(post);
                const initialScore = post.validationScore ?? post.upvoteCount ?? 0;
                const vote = voteState[post._id] || { type: null, score: initialScore };
                const isUpvoted = vote.type === 'upvote';
                const isDownvoted = vote.type === 'downvote';
                const score = vote.score;
                const postedAt = formatDate(post.datePosted || post.createdAt || post.time || '');
                const targetUsers = Array.isArray(post.targetUsers)
                  ? post.targetUsers
                  : post.targetUsers
                    ? post.targetUsers.split(',').map((item) => item.trim())
                    : [];

                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedId(post._id)}
                    className={styles.ideaCard}
                  >
                    <div className={styles.cardHeader}>
                      <span className={`${styles.phaseBadge} ${phaseClass}`}>
                        {post.phase || 'Validation'}
                      </span>
                      <div className={styles.cardMeta}>
                        <span className={styles.postedAt}>Posted {postedAt}</span>
                        <div className={styles.validationScoreLabel}>Validation score</div>
                        <div className={styles.validationScoreValue}>{score}</div>
                      </div>
                    </div>

                    <h3 className={styles.cardTitle}>{post.title}</h3>

                    <div className={styles.cardAuthor}>
                      <Link
                        to={`/profile/${authorUsername}`}
                        className={styles.authorLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.authorAvatar}>
                          {post.author?.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} />
                          ) : (
                            post.author?.name?.slice(0, 2).toUpperCase() || '??'
                          )}
                        </div>
                        <div className={styles.authorMeta}>
                          <span className={styles.authorName}>{post.author?.name || 'Unknown'}</span>
                          <span className={styles.authorUsername}>@{authorUsername}</span>
                        </div>
                      </Link>

                      <div className={styles.voteControls} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`${styles.voteBtn} ${styles.voteBtnUp} ${isUpvoted ? styles.voteBtnActive : ''}`}
                          onClick={() => handleVote(post._id, 'upvote', initialScore)}
                          aria-label="Upvote"
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <span className={styles.validationScore}>{score}</span>
                        <button
                          type="button"
                          className={`${styles.voteBtn} ${styles.voteBtnDown} ${isDownvoted ? styles.voteBtnActive : ''}`}
                          onClick={() => handleVote(post._id, 'downvote', initialScore)}
                          aria-label="Downvote"
                        >
                          <ThumbsDown size={16} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.detailGrid}>
                      <div className={styles.detailBlock}>
                        <div className={styles.detailTitle}>Target Market</div>
                        <p className={styles.detailText}>{post.targetMarket || post.market || post.body || 'No market detail yet.'}</p>
                      </div>
                      <div className={styles.detailBlock}>
                        <div className={styles.detailTitle}>Problem Statement</div>
                        <p className={styles.detailText}>{post.problemStatement || post.problem || post.body || 'No problem statement yet.'}</p>
                      </div>
                      <div className={styles.detailBlock}>
                        <div className={styles.detailTitle}>Target Users</div>
                        {targetUsers.length > 0 ? (
                          <ul className={styles.targetUserList}>
                            {targetUsers.map((user, index) => (
                              <li key={`${post._id}-user-${index}`} className={styles.targetUserItem}>{user}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className={styles.detailText}>{post.targetUsers || 'No target users specified.'}</p>
                        )}
                      </div>
                      <div className={`${styles.detailBlock} ${styles.solutionBlock}`}>
                        <div className={styles.detailTitle}>Your Solution</div>
                        <p className={styles.detailText}>{post.solution || post.yourSolution || 'No solution detail yet.'}</p>
                      </div>
                    </div>

                    <div className={styles.commentSection} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.commentToggle}
                        onClick={() => toggleComments(post._id)}
                      >
                        <span>Community Feedback ({commentList.length})</span>
                        <span>{expandedComments[post._id] ? 'Hide' : 'Show'}</span>
                      </button>

                      {expandedComments[post._id] && (
                        <div className={styles.commentThread}>
                          {commentList.length > 0 ? (
                            commentList.map((comment, index) => {
                              const commentPosted = formatDate(comment.createdAt || comment.time || comment.date || '');
                              const commenterName = comment.author?.name || comment.author?.username || 'Community';
                              const commenterInitials = commenterName.slice(0, 2).toUpperCase();
                              return (
                                <div key={`${post._id}-comment-${index}`} className={styles.commentItem}>
                                  <div className={styles.commentAvatar}>
                                    {comment.author?.avatarUrl ? (
                                      <img src={comment.author.avatarUrl} alt={commenterName} />
                                    ) : (
                                      commenterInitials
                                    )}
                                  </div>
                                  <div>
                                    <div className={styles.commentMeta}>
                                      <span className={styles.commentAuthor}>{commenterName}</span>
                                      <span className={styles.commentTime}>{commentPosted}</span>
                                    </div>
                                    <p className={styles.commentText}>{comment.text || comment.body || 'No comment content.'}</p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className={styles.commentEmpty} style={{ color: 'var(--muted-foreground)' }}>
                              No comments yet. Be the first to leave feedback.
                            </div>
                          )}

                          <div className={styles.commentInputGroup}>
                            {isAuthenticated ? (
                              <>
                                <textarea
                                  className={styles.commentTextarea}
                                  rows={4}
                                  placeholder="Leave constructive feedback or suggestions..."
                                  value={commentInputs[post._id] || ''}
                                  onChange={(e) => updateCommentInput(post._id, e.target.value)}
                                />
                                <button
                                  type="button"
                                  className={styles.commentSubmit}
                                  onClick={() => submitComment(post._id)}
                                  disabled={!commentInputs[post._id]?.trim()}
                                >
                                  Submit feedback
                                </button>
                              </>
                            ) : (
                              <p className={styles.commentLoginPrompt}>
                                <Link to="/login" onClick={(e) => e.stopPropagation()}>Log in</Link> to leave feedback.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Placeholder */}
          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <button style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Page 1 of 1</span>
            <button style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h4 className={styles.sidebarLabel}>Community Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--foreground)' }}>1,240</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Total Ideas Validated</p>
              </div>
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar} style={{ width: '75%' }}></div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Join 5,000+ founders active this month.</p>
            </div>
          </div>

          <div className={styles.sidebarCard} style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Lightbulb size={18} />
              <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Validation Tips</h4>
            </div>
            <div className={styles.tipList}>
              <div className={styles.tipItem}>
                <span className={styles.tipNumber}>01</span>
                <p className={styles.tipText}><span style={{ fontWeight: '600', color: 'var(--foreground)' }}>Define your ICP.</span> Be specific about who has the problem you're solving.</p>
              </div>
              <div className={styles.tipItem}>
                <span className={styles.tipNumber}>02</span>
                <p className={styles.tipText}><span style={{ fontWeight: '600', color: 'var(--foreground)' }}>Ask open questions.</span> Don't lead the witness. Let them tell you their pain points.</p>
              </div>
              <div className={styles.tipItem}>
                <span className={styles.tipNumber}>03</span>
                <p className={styles.tipText}><span style={{ fontWeight: '600', color: 'var(--foreground)' }}>Iterate quickly.</span> If people aren't excited, tweak the pitch and repost.</p>
              </div>
            </div>
            <a style={{ marginTop: '1.5rem', display: 'inline-block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }} href="#">Read full guide →</a>
          </div>
        </aside>
      </div>
    </main>
  );
}