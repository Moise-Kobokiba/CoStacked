import { useState, useEffect } from 'react';
import {
  Search, Plus, MessageCircle, Rocket, GitBranch,
  ChevronDown, Sparkles, TrendingUp, Users, X, Send, Loader2,
  Zap, Hash, Image, ExternalLink, Briefcase, Grid3X3, List
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { createStackPost, createShowcase, createCollabThread, getStackSuiteStats } from '../api/stackSuiteApi';
import { DiscussionsTab }   from '../components/stack-suite/DiscussionsTab';
import { ShowcasesTab }     from '../components/stack-suite/ShowcasesTab';
import { CollaborationTab } from '../components/stack-suite/CollaborationTab';
import styles from './StackSuitePage.module.css';
import sharedStyles from '../components/stack-suite/StackSuite.module.css';

const CATEGORIES = ['Validation', 'Tech', 'Equity', 'Growth', 'Legal', 'General'];
const STAGES     = ['Idea', 'MVP', 'Beta', 'Launched'];
const SORT_OPTS  = ['Latest First', 'Most Upvoted', 'Trending'];

const TABS = [
  { id: 'discussions',   label: 'Discussions',   shortLabel: 'Chat',   Icon: MessageCircle },
  { id: 'showcases',     label: 'Showcases',     shortLabel: 'Show',   Icon: Rocket        },
  { id: 'collaboration', label: 'Collaboration', shortLabel: 'Collab', Icon: GitBranch     },
];

const TRENDING_TAGS = ['validation', 'saas', 'nextjs', 'react', 'startup', 'mvp', 'design', 'backend', 'api'];

export function StackSuitePage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter]               = useState('all');
  const [filterOpen, setFilterOpen]       = useState(false);
  const [activeTab, setActiveTab]         = useState('discussions');
  const [sortBy, setSortBy]               = useState('Latest First');
  const [sortOpen, setSortOpen]           = useState(false);
  const [tagFilter, setTagFilter]         = useState('');

  // Shared modal state
  const [createOpen, setCreateOpen]       = useState(false);
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [contentType, setContentType]     = useState('discussion');

  // Discussions Form State
  const [postTitle, setPostTitle]         = useState('');
  const [postBody, setPostBody]           = useState('');
  const [postCategory, setPostCategory]   = useState('General');
  const [postTags, setPostTags]           = useState('');

  // Build In Public
  const [bipType, setBipType]             = useState('weekly-update');
  const [bipMilestone, setBipMilestone]   = useState('');
  const [bipRevenue, setBipRevenue]       = useState('');
  const [bipUsers, setBipUsers]           = useState('');
  const [bipLookingFor, setBipLookingFor] = useState('');
  const [bipProgress, setBipProgress]     = useState(0);

  // Founder Matching
  const [fmRole, setFmRole]               = useState('co-founder');
  const [fmSkills, setFmSkills]           = useState('');
  const [fmAvailability, setFmAvailability] = useState('part-time');
  const [fmLocation, setFmLocation]       = useState('remote');

  // Community Challenges
  const [challengeType, setChallengeType] = useState('build-in-public');
  const [challengeGoal, setChallengeGoal] = useState('');
  const [challengeDuration, setChallengeDuration] = useState('30');
  const [challengeRewards, setChallengeRewards] = useState('');

  // Accountability
  const [accGoal, setAccGoal]             = useState('');
  const [accWeeklyTarget, setAccWeeklyTarget] = useState('');
  const [accStatus, setAccStatus]         = useState('in-progress');

  // Showcases Form State
  const [showcaseName, setShowcaseName]   = useState('');
  const [showcaseDesc, setShowcaseDesc]   = useState('');
  const [showcaseStage, setShowcaseStage] = useState('Idea');
  const [showcaseTech, setShowcaseTech]   = useState('');
  const [showcaseLooking, setShowcaseLooking] = useState('');
  const [showcaseImageUrl, setShowcaseImageUrl] = useState('');
  const [showcaseLiveUrl, setShowcaseLiveUrl]   = useState('');
  const [showcaseGithubUrl, setShowcaseGithubUrl] = useState('');

  // Collab Form State
  const [collabProject, setCollabProject]     = useState('');
  const [collabMilestone, setCollabMilestone] = useState('');
  const [collabDesc, setCollabDesc]           = useState('');
  const [collabRoles, setCollabRoles]         = useState('');

  // Links state
  const [links, setLinks]                 = useState([]);
  const [newLinkName, setNewLinkName]     = useState('');
  const [newLinkUrl, setNewLinkUrl]       = useState('');

  const addLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    setLinks([...links, { name: newLinkName.trim(), url: newLinkUrl.trim() }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const filterLabel = filter === 'founder' ? 'Founders' : filter === 'developer' ? 'Developers' : 'All Roles';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['discussions', 'showcases', 'collaboration'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const closeCreate = () => {
    setCreateOpen(false);
    setPostSubmitted(false);
    setContentType('discussion');
    setPostTitle(''); setPostBody(''); setPostCategory('General'); setPostTags('');
    setShowcaseName(''); setShowcaseDesc(''); setShowcaseStage('Idea');
    setShowcaseTech(''); setShowcaseLooking(''); setShowcaseImageUrl('');
    setShowcaseLiveUrl(''); setShowcaseGithubUrl('');
    setCollabProject(''); setCollabMilestone(''); setCollabDesc(''); setCollabRoles('');
    setLinks([]); setNewLinkName(''); setNewLinkUrl('');
  };

  const handleError = (error, contextAction) => {
    console.error(`[${contextAction}] Mutation ERROR:`, error);
    alert(`Failed to publish: ${error.response?.data?.message || error.message}`);
  };

  const createUnifiedPostMutation = useMutation({
    mutationFn: (data) => createStackPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stackPosts'] });
      queryClient.invalidateQueries({ queryKey: ['stackSuiteStats'] });
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createUnifiedPostMutation')
  });

  const createShowcaseMutation = useMutation({
    mutationFn: (data) => createShowcase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showcases'] });
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createShowcaseMutation')
  });

  const createCollabMutation = useMutation({
    mutationFn: (data) => createCollabThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createCollabMutation')
  });

  const buildStackPostPayload = () => {
    const tagList = typeof postTags === 'string'
      ? postTags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(postTags) ? postTags : [];

    const basePayload = {
      title: postTitle,
      body: postBody,
      category: postCategory || 'General',
      tags: tagList,
      links,
      contentType,
    };

    if (contentType === 'build-in-public') {
      return {
        ...basePayload,
        body: [
          `**Update Type:** ${bipType.replace(/-/g, ' ')}`,
          postBody,
          `**Revenue:** ${bipRevenue || 'N/A'}`,
          `**Users:** ${bipUsers || 'N/A'}`,
          `**Progress:** ${bipProgress}%`,
          bipLookingFor ? `**Looking for:** ${bipLookingFor}` : '',
        ].filter(Boolean).join('\n\n'),
        tags: ['build-in-public', bipType, ...tagList].filter(Boolean),
        phase: 'General',
      };
    }

    if (contentType === 'founder-matching') {
      return {
        ...basePayload,
        body: [
          `**Role:** ${fmRole.replace(/-/g, ' ')}`,
          `**Availability:** ${fmAvailability}`,
          `**Location:** ${fmLocation}`,
          fmSkills ? `**Skills:** ${fmSkills}` : '',
          postBody,
        ].filter(Boolean).join('\n\n'),
        tags: ['founder-matching', fmRole, fmAvailability, fmLocation, ...tagList].filter(Boolean),
        phase: 'General',
      };
    }

    if (contentType === 'challenge') {
      return {
        ...basePayload,
        body: [
          `**Challenge Type:** ${challengeType.replace(/-/g, ' ')}`,
          `**Goal:** ${challengeGoal}`,
          `**Duration:** ${challengeDuration} days`,
          challengeRewards ? `**Rewards:** ${challengeRewards}` : '',
          postBody,
        ].filter(Boolean).join('\n\n'),
        tags: ['challenge', challengeType, ...tagList].filter(Boolean),
        phase: 'Problem',
      };
    }

    if (contentType === 'accountability') {
      return {
        ...basePayload,
        body: [
          `**Weekly Goal:** ${accGoal}`,
          `**Target:** ${accWeeklyTarget}`,
          `**Status:** ${accStatus.replace(/-/g, ' ')}`,
          postBody,
        ].filter(Boolean).join('\n\n'),
        tags: ['accountability', accStatus, ...tagList].filter(Boolean),
        phase: 'General',
      };
    }

    return basePayload;
  };

  const handleCreateSubmit = (e) => {
    if (e) e.preventDefault();

    if (contentType === 'showcase') {
      if (!showcaseName.trim() || !showcaseDesc.trim()) return;
      createShowcaseMutation.mutate({
        name: showcaseName, description: showcaseDesc, stage: showcaseStage,
        imageUrl: showcaseImageUrl.trim() || undefined,
        liveUrl: showcaseLiveUrl.trim() || undefined,
        githubUrl: showcaseGithubUrl.trim() || undefined,
        techStack: showcaseTech.split(',').map(t => t.trim()).filter(Boolean),
        looking: showcaseLooking.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else if (contentType === 'collaboration') {
      if (!collabProject.trim() || !collabMilestone.trim() || !collabDesc.trim()) return;
      createCollabMutation.mutate({
        project: collabProject, milestone: collabMilestone,
        description: collabDesc,
        roles: collabRoles.split(',').map(r => r.trim()).filter(Boolean),
        links
      });
    } 
    else if (contentType === 'build-in-public') {
      if (!postTitle.trim() || !postBody.trim()) return;
      createUnifiedPostMutation.mutate({
        contentType: 'build-in-public',
        title: postTitle, body: postBody,
        category: 'General',
        boardType: 'stack-suite',
        bipType, bipMilestone, bipRevenue, bipUsers,
        bipProgress, bipLookingFor,
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else if (contentType === 'founder-matching') {
      if (!postTitle.trim() || !postBody.trim()) return;
      createUnifiedPostMutation.mutate({
        contentType: 'founder-matching',
        title: postTitle, body: postBody,
        category: 'General',
        boardType: 'stack-suite',
        fmRole,
        fmSkills: fmSkills.split(',').map(s => s.trim()).filter(Boolean),
        fmAvailability, fmLocation,
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else if (contentType === 'challenge') {
      if (!postTitle.trim() || !postBody.trim()) return;
      createUnifiedPostMutation.mutate({
        contentType: 'challenge',
        title: postTitle, body: postBody,
        challengeGoal, challengeType, challengeDuration, challengeRewards,
        category: 'General',
        boardType: 'stack-suite',
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else if (contentType === 'accountability') {
      if (!accGoal.trim() || !postBody.trim()) return;
      createUnifiedPostMutation.mutate({
        contentType: 'accountability',
        title: accGoal,
        body: postBody,
        accGoal, accWeeklyTarget, accStatus,
        category: 'General',
        boardType: 'stack-suite',
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else {
      if (!postTitle.trim() || !postBody.trim()) return;
      createUnifiedPostMutation.mutate(buildStackPostPayload());
    }
  };

  const isSubmitting = createUnifiedPostMutation.isPending || createShowcaseMutation.isPending || createCollabMutation.isPending;

  const btnLabel = contentType === 'discussion' ? 'Create Post'
    : contentType === 'showcase' ? 'Launch Showcase'
    : contentType === 'collaboration' ? 'New Milestone'
    : contentType === 'build-in-public' ? 'Publish Update'
    : contentType === 'founder-matching' ? 'Post Match Request'
    : contentType === 'challenge' ? 'Publish Challenge'
    : 'Track Goal';

  const modalTitle = contentType === 'discussion' ? 'Create a New Post'
    : contentType === 'showcase' ? 'Launch Your Showcase'
    : contentType === 'collaboration' ? 'Start a Collaboration Thread'
    : contentType === 'build-in-public' ? 'Share a Build-in-Public Update'
    : contentType === 'founder-matching' ? 'Find a Co-Founder or Partner'
    : contentType === 'challenge' ? 'Create a Community Challenge'
    : 'Share Your Accountability Goal';

  const modalDesc = contentType === 'discussion'
    ? 'Share a question, insight, or update with the community.'
    : contentType === 'showcase'
      ? 'Share what you are building, get feedback, and find collaborators.'
      : contentType === 'collaboration'
        ? 'Create a milestone for your project and find team members.'
        : contentType === 'build-in-public'
          ? 'Publish progress updates and keep the community aligned with your journey.'
          : contentType === 'founder-matching'
            ? 'Connect with founders, builders, and teammates who match your goals.'
            : contentType === 'challenge'
              ? 'Post a challenge to rally the community around a shared goal.'
              : 'Track your progress and stay accountable with weekly goals.';

  const { data: stats } = useQuery({
    queryKey: ['stackSuiteStats'],
    queryFn: getStackSuiteStats,
  });

  const handleTagClick = (tag) => {
    setTagFilter(prev => prev === tag ? '' : tag);
  };

  const handleSortSelect = (opt) => {
    setSortBy(opt);
    setSortOpen(false);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.heroSection}>
          <div className={styles.heroInner}>
            <div>
              <div className={styles.heroPill}>
                <Sparkles size={13} color="var(--primary)" />
                <span className={styles.heroPillText}>Community Hub</span>
              </div>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleAccent}>Stack</span>Suite
              </h1>
              <p className={styles.heroDesc}>
                Discuss ideas, showcase projects, and collaborate with founders and developers building the future.
              </p>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className={styles.statValue}>{stats ? stats.totalPosts + stats.totalValidations : '...'}</p>
                  <p className={styles.statLabel}>Active Posts</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statIcon} ${styles.statIconEmerald}`}>
                  <Users size={20} />
                </div>
                <div>
                  <p className={styles.statValue}>{stats ? stats.totalMembers : '...'}</p>
                  <p className={styles.statLabel}>Members</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statIcon} ${styles.statIconSky}`}>
                  <Rocket size={20} />
                </div>
                <div>
                  <p className={styles.statValue}>{stats ? stats.totalShowcases : '...'}</p>
                  <p className={styles.statLabel}>Projects</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Search & Filter ── */}
        <section className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search discussions, projects, threads..."
              value={search}
              onChange={e => { setSearch(e.target.value); setTagFilter(''); }}
              aria-label="Search StackSuite"
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            {/* Sort dropdown */}
            <div className={styles.filterWrap}>
              <button
                className={styles.filterBtn}
                onClick={() => setSortOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <Zap size={14} />
                <span>{sortBy}</span>
                <ChevronDown size={15} color="var(--muted-foreground)" />
              </button>
              {sortOpen && (
                <div className={styles.filterDropdown}>
                  {SORT_OPTS.map(opt => (
                    <button
                      key={opt}
                      className={`${styles.filterOption} ${sortBy === opt ? styles.filterOptionActive : ''}`}
                      onClick={() => handleSortSelect(opt)}
                      role="option"
                      aria-selected={sortBy === opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role filter */}
            <div className={styles.filterWrap}>
              <button
                className={styles.filterBtn}
                onClick={() => setFilterOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
              >
                <span>{filterLabel}</span>
                <ChevronDown size={15} color="var(--muted-foreground)" />
              </button>
              {filterOpen && (
                <div className={styles.filterDropdown}>
                  {['all', 'founder', 'developer'].map(opt => (
                    <button
                      key={opt}
                      className={`${styles.filterOption} ${filter === opt ? styles.filterOptionActive : ''}`}
                      onClick={() => { setFilter(opt); setFilterOpen(false); }}
                      role="option"
                      aria-selected={filter === opt}
                    >
                      {opt === 'all' ? 'All Roles' : opt === 'founder' ? 'Founders' : 'Developers'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className={styles.createBtn} onClick={() => {
              if (!isAuthenticated) return navigate('/login', { state: { from: '/stack-suite' } });
              setCreateOpen(true);
            }}>
              <Plus size={16} /> {isAuthenticated ? '+ Create New Post' : 'Login to Create'}
            </button>
          </div>
        </section>

        {/* ── Layout Grid ── */}
        <div className={styles.layoutGrid}>
          {/* Main Feed Area */}
          <div className={styles.feedColumn}>
            {/* Tabs */}
            <div className={styles.tabsContainer}>
              <div className={styles.tabsList} role="tablist">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    className={`${styles.tabBtn} ${activeTab === id ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div role="tabpanel">
                {activeTab === 'discussions' && (
                  <DiscussionsTab
                    search={debouncedSearch}
                    tagFilter={tagFilter}
                    roleFilter={filter}
                    sortBy={sortBy}
                    onTagClick={handleTagClick}
                  />
                )}
                {activeTab === 'showcases' && (
                  <ShowcasesTab
                    search={debouncedSearch}
                    tagFilter={tagFilter}
                    roleFilter={filter}
                    sortBy={sortBy}
                    onTagClick={handleTagClick}
                  />
                )}
                {activeTab === 'collaboration' && (
                  <CollaborationTab
                    search={debouncedSearch}
                    tagFilter={tagFilter}
                    roleFilter={filter}
                    sortBy={sortBy}
                    onTagClick={handleTagClick}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <aside className={styles.sidebar}>
            {/* Trending Tags */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <Hash size={16} />
                <span>Trending Tags</span>
              </div>
              <div className={styles.sideCardBody}>
                <div className={styles.tagCloud}>
                  {TRENDING_TAGS.map(tag => (
                    <button
                      key={tag}
                      className={`${styles.tagPill} ${tagFilter === tag ? styles.tagPillActive : ''}`}
                      onClick={() => handleTagClick(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <Users size={16} />
                <span>Community Stats</span>
              </div>
              <div className={styles.sideCardBody}>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>Active Posts</span>
                  <span className={styles.statRowValue}>{stats ? stats.totalPosts + stats.totalValidations : '...'}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>Total Members</span>
                  <span className={styles.statRowValue}>{stats ? stats.totalMembers : '...'}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>Online Now</span>
                  <span className={styles.statRowValue}>{stats?.onlineNow ?? '...'}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statRowLabel}>Showcases</span>
                  <span className={styles.statRowValue}>{stats ? stats.totalShowcases : '...'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <Zap size={16} />
                <span>Quick Actions</span>
              </div>
              <div className={styles.sideCardBody}>
                <button className={styles.sideActionBtn} onClick={() => {
                  if (!isAuthenticated) return navigate('/login', { state: { from: '/stack-suite' } });
                  setContentType('discussion');
                  setCreateOpen(true);
                }}>
                  <MessageCircle size={15} /> Start Discussion
                </button>
                <button className={styles.sideActionBtn} onClick={() => {
                  if (!isAuthenticated) return navigate('/login', { state: { from: '/stack-suite' } });
                  setContentType('showcase');
                  setCreateOpen(true);
                }}>
                  <Rocket size={15} /> Showcase Project
                </button>
                <button className={styles.sideActionBtn} onClick={() => {
                  if (!isAuthenticated) return navigate('/login', { state: { from: '/stack-suite' } });
                  setContentType('collaboration');
                  setCreateOpen(true);
                }}>
                  <GitBranch size={15} /> Create Milestone
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>CoStacked — Connect, Collaborate, Create.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="https://www.costacked.co.za" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              costacked.co.za
            </a>
          </div>
        </div>
      </footer>

      {/* ── Create Modal ── */}
      {createOpen && (
        <div className={styles.dialogOverlay} onClick={closeCreate}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <h2 className={styles.dialogTitle}>{modalTitle}</h2>
                <p className={styles.dialogDesc}>{modalDesc}</p>
              </div>
              <button className={styles.dialogClose} onClick={closeCreate} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            {postSubmitted ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <Send size={22} />
                </div>
                <h3 className={styles.successTitle}>Successfully Published!</h3>
                <p className={styles.successDesc}>Your item is now live in the community.</p>
              </div>
            ) : (
              <>
                {/* Content Type Selector */}
                <div className={styles.contentTypeSelector}>
                  <span className={styles.formLabel} style={{ marginBottom: 8 }}>Content Type</span>
                  <div className={styles.contentTypeGrid}>
                    {[
                      { id: 'discussion', label: 'Discussion', Icon: MessageCircle },
                      { id: 'showcase', label: 'Showcase', Icon: Rocket },
                      { id: 'collaboration', label: 'Collaboration', Icon: GitBranch },
                      { id: 'build-in-public', label: 'Build In Public', Icon: TrendingUp },
                      { id: 'founder-matching', label: 'Founder Match', Icon: Users },
                      { id: 'challenge', label: 'Challenge', Icon: Zap },
                      { id: 'accountability', label: 'Goals', Icon: Briefcase },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        className={`${styles.contentTypeChip} ${contentType === id ? styles.contentTypeChipActive : ''}`}
                        onClick={() => setContentType(id)}
                        type="button"
                      >
                        <Icon size={15} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup} style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 8 }}>
                  {/* === DISCUSSION FORM === */}
                  {contentType === 'discussion' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-title">Title</label>
                        <input id="post-title" type="text" className={styles.formInput} value={postTitle}
                          onChange={e => setPostTitle(e.target.value)} placeholder="What do you want to discuss?" />
                      </div>
                      <div>
                        <label className={styles.formLabel}>Category</label>
                        <div className={styles.categoryGrid}>
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              className={`${styles.categoryChip} ${postCategory === cat ? styles.categoryChipActive : ''}`}
                              onClick={() => setPostCategory(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Additional sub-forms can be appended right here as needed */}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
