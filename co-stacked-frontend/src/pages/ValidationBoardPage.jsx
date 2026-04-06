// src/pages/ValidationBoardPage.jsx

import { useState } from 'react';
import { 
  Search, PlusCircle, Lightbulb, ChevronLeft, ChevronRight, Loader2,
  ThumbsUp, MessageSquare, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

  const { data: posts = [], isLoading, isFetching } = useQuery({
    queryKey: ['stackPosts', { category: 'Validation', search: debouncedSearch, phase: phaseFilter }],
    queryFn: () => getStackPosts({ category: 'Validation', search: debouncedSearch, phase: phaseFilter }),
  });

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
                return (
                  <div 
                    key={post._id} 
                    onClick={() => setSelectedId(post._id)}
                    className={styles.ideaCard}
                  >
                    <div className={styles.cardHeader}>
                      <span className={`${styles.phaseBadge} ${phaseClass}`}>
                        {post.phase} Phase
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span className={styles.confidenceValue}>{post.confidenceScore || 0}%</span>
                        <div className={styles.confidenceLabel}>Confidence</div>
                      </div>
                    </div>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.cardBody}>{post.body}</p>
                    <div className={styles.tagList}>
                      {post.tags?.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                    <div className={styles.cardFooter}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--input-background)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {post.author?.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            post.author?.name?.slice(0, 2).toUpperCase() || '??'
                          )}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{post.author?.name || 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--muted-foreground)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ThumbsUp size={14} />
                          <span style={{ fontSize: '12px', fontWeight: '700' }}>{post.upvoteCount || 0}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageSquare size={14} />
                          <span style={{ fontSize: '12px', fontWeight: '700' }}>{post.commentCount || 0}</span>
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