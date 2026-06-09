// src/pages/ValidationBoardPage.jsx

import { useState } from 'react';
import { 
  Search, PlusCircle, Lightbulb, ChevronLeft, ChevronRight, Loader2,
  ThumbsUp, MessageSquare, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIdeas } from '../api/ideasApi';
import { createValidationTip, updateValidationTip, deleteValidationTip } from '../api/validationTipApi';
import { useSelector } from 'react-redux';
import { getCommunityStats } from '../api/statsApi';
import { getValidationTips } from '../api/validationTipApi';
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
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(search, 500);

  const { data: posts = [], isLoading, isFetching } = useQuery({
    queryKey: ['validationPosts', { search: debouncedSearch, stage: phaseFilter }],
    queryFn: () => getIdeas({ search: debouncedSearch, stage: phaseFilter, visibility: 'public', status: 'active' }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['communityStats'],
    queryFn: () => getCommunityStats(),
  });

  const { data: tipsData } = useQuery({
    queryKey: ['validationTips'],
    queryFn: () => getValidationTips(),
  });

  // Subscribe to socket events via query invalidation handled in SocketProvider

  const queryClient = useQueryClient();
  const { token, user } = useSelector((state) => state.auth || {});

  const createTipMutation = useMutation({
    mutationFn: (newTip) => createValidationTip(newTip, token),
    onSuccess: () => queryClient.invalidateQueries(['validationTips'])
  });

  const updateTipMutation = useMutation({
    mutationFn: ({ id, data }) => updateValidationTip(id, data, token),
    onSuccess: () => queryClient.invalidateQueries(['validationTips'])
  });

  const deleteTipMutation = useMutation({
    mutationFn: (id) => deleteValidationTip(id, token),
    onSuccess: () => queryClient.invalidateQueries(['validationTips'])
  });

  const [manageOpen, setManageOpen] = useState(false);
  const [newTipTitle, setNewTipTitle] = useState('');
  const [newTipContent, setNewTipContent] = useState('');

  const phases = [
    { id: 'all', label: 'All Ideas' },
    { id: 'Problem', label: 'Problem Validation' },
    { id: 'Solution', label: 'Solution Validation' },
    { id: 'MVP', label: 'MVP/Landing Page' },
  ];

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
                const phaseClass = PHASE_BADGE_CLASS[post.stage] || styles.badgeGeneral;
                const description = post.problemStatement || post.valueProposition || post.targetAudience || '';
                const tags = post.tags?.length > 0 ? post.tags : post.industry ? [post.industry] : [];
                const author = post.founder || post.author;
                const upvoteCount = post.upvoteCount ?? post.upvotes?.length ?? 0;
                const commentCount = post.engagementCount ?? post.commentCount ?? 0;
                return (
                  <div 
                    key={post._id} 
                    onClick={() => navigate(`/validation-board/${post._id}`)}
                    className={styles.ideaCard}
                  >
                    <div className={styles.cardHeader}>
                      <span className={`${styles.phaseBadge} ${phaseClass}`}>
                        {post.stage || 'General'} Phase
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span className={styles.confidenceValue}>{post.validationScore ?? 0}%</span>
                        <div className={styles.confidenceLabel}>Confidence</div>
                      </div>
                    </div>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.cardBody}>{description}</p>
                    <div className={styles.tagList}>
                      {tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                    <div className={styles.cardFooter}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--input-background)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            author?.name?.slice(0, 2).toUpperCase() || '??'
                          )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{author?.name || 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--muted-foreground)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ThumbsUp size={14} />
                          <span style={{ fontSize: '12px', fontWeight: '700' }}>{upvoteCount}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageSquare size={14} />
                          <span style={{ fontSize: '12px', fontWeight: '700' }}>{commentCount}</span>
                        </div>
                      </div>
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
                <p style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--foreground)' }}>{statsData?.totalIdeas ?? 0}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Total Ideas</p>
              </div>
              <div>
                <p style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--foreground)' }}>{statsData?.activeIdeas ?? 0}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Active Ideas</p>
              </div>
              <div>
                <p style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--foreground)' }}>{statsData?.validatedIdeasCount ?? 0}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Validated Ideas</p>
              </div>
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar} style={{ width: `${Math.min(100, ((statsData?.validatedIdeasCount || 0) / Math.max(statsData?.totalIdeas || 1, 1)) * 100)}%` }}></div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{statsData?.totalUsers ?? 0} users on the platform</p>
            </div>
          </div>

          <div className={styles.sidebarCard} style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Lightbulb size={18} />
              <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Validation Tips</h4>
            </div>
            <div className={styles.tipList}>
              {tipsData ? (
                ([...(tipsData.manualTips || []), ...(tipsData.articleTips || [])]).slice(0, 6).map((tip, idx) => (
                  <div key={tip._id || idx} className={styles.tipItem}>
                    <span className={styles.tipNumber}>{String(idx + 1).padStart(2, '0')}</span>
                    <p className={styles.tipText}>
                      <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{tip.title}</span> {tip.content}
                    </p>
                  </div>
                ))
              ) : (
                <div>Loading tips…</div>
              )}
            </div>
            {user?.isAdmin && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <a
                  href="/admin/validation-tips"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}
                >
                  Manage Tips in Admin Panel →
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}