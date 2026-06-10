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

const COMMITMENT_LEVELS = ['Full-Time', 'Part-Time', 'Weekends', 'Flexible'];
const TIMELINE_OPTIONS  = ['1 Week', '2 Weeks', '1 Month', '3 Months', '6 Months', 'Open'];

const TABS = [
  { id: 'discussions',   label: 'Discussions',   shortLabel: 'Chat',   Icon: MessageCircle },
  { id: 'showcases',     label: 'Showcases',     shortLabel: 'Show',   Icon: Rocket        },
  { id: 'collaboration', label: 'Collaboration', shortLabel: 'Collab', Icon: GitBranch     },
];

const TRENDING_TAGS = ['validation', 'saas', 'nextjs', 'react', 'startup', 'mvp', 'design', 'backend', 'api'];

/* ─── Role Chip Input Component ─── */
function RoleChipInput({ roles, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState('');

  const addRole = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !roles.includes(trimmed)) {
      onChange([...roles, trimmed]);
      setInputValue('');
    }
  };

  const removeRole = (roleToRemove) => {
    onChange(roles.filter(r => r !== roleToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRole();
    }
    if (e.key === 'Backspace' && !inputValue && roles.length > 0) {
      removeRole(roles[roles.length - 1]);
    }
  };

  return (
    <div className={styles.chipInputContainer}>
      <div className={styles.chipInputTags}>
        {roles.map(role => (
          <span key={role} className={styles.roleChip}>
            {role}
            <button type="button" className={styles.roleChipRemove} onClick={() => removeRole(role)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.chipInputField}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addRole}
          placeholder={roles.length === 0 ? placeholder : ''}
        />
      </div>
    </div>
  );
}

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
  const [validationErrors, setValidationErrors] = useState({});

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
  const [fmOpportunityDesc, setFmOpportunityDesc] = useState('');
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
  const [showcaseTags, setShowcaseTags]   = useState('');

  // Collab Form State
  const [collabProject, setCollabProject]         = useState('');
  const [collabMilestone, setCollabMilestone]     = useState('');
  const [collabDesc, setCollabDesc]               = useState('');
  const [collabRoles, setCollabRoles]             = useState([]);
  const [collabTags, setCollabTags]               = useState('');
  const [collabCommitment, setCollabCommitment]   = useState('Part-Time');
  const [collabTimeline, setCollabTimeline]       = useState('1 Month');

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
    setValidationErrors({});
    setPostTitle(''); setPostBody(''); setPostCategory('General'); setPostTags('');
    setShowcaseName(''); setShowcaseDesc(''); setShowcaseStage('Idea');
    setShowcaseTech(''); setShowcaseLooking(''); setShowcaseImageUrl('');
    setShowcaseLiveUrl(''); setShowcaseGithubUrl(''); setShowcaseTags('');
    setCollabProject(''); setCollabMilestone(''); setCollabDesc(''); setCollabRoles([]);
    setCollabTags(''); setCollabCommitment('Part-Time'); setCollabTimeline('1 Month');
    setBipType('weekly-update'); setBipMilestone(''); setBipRevenue('');
    setBipUsers(''); setBipLookingFor(''); setBipProgress(0);
    setFmRole('co-founder'); setFmOpportunityDesc(''); setFmSkills(''); setFmAvailability('part-time'); setFmLocation('remote');
    setChallengeType('build-in-public'); setChallengeGoal(''); setChallengeDuration('30'); setChallengeRewards('');
    setAccGoal(''); setAccWeeklyTarget(''); setAccStatus('in-progress');
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
          `**About:** ${postBody}`,
          `**Opportunity:** ${fmOpportunityDesc}`,
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
        title: accGoal,
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

  /* ─── Validation ─── */
  const validateForm = () => {
    const errors = {};

    if (contentType === 'discussion') {
      if (!postTitle.trim()) errors.title = 'Title is required';
      if (!postBody.trim()) errors.body = 'Body is required';
    } else if (contentType === 'showcase') {
      if (!showcaseName.trim()) errors.showcaseName = 'Project name is required';
      if (!showcaseDesc.trim()) errors.showcaseDesc = 'Description is required';
    } else if (contentType === 'collaboration') {
      if (!collabProject.trim()) errors.collabProject = 'Project name is required';
      if (!collabMilestone.trim()) errors.collabMilestone = 'Milestone is required';
      if (!collabDesc.trim()) errors.collabDesc = 'Description is required';
    } else if (contentType === 'build-in-public') {
      if (!postTitle.trim()) errors.title = 'Update title is required';
      if (!postBody.trim()) errors.body = 'Update content is required';
    } else if (contentType === 'founder-matching') {
      if (!postTitle.trim()) errors.title = 'Title is required';
      if (!postBody.trim()) errors.body = 'About you is required';
      if (!fmOpportunityDesc.trim()) errors.fmOpportunityDesc = 'Opportunity description is required';
    } else if (contentType === 'challenge') {
      if (!postTitle.trim()) errors.title = 'Challenge title is required';
      if (!challengeGoal.trim()) errors.challengeGoal = 'Goal is required';
      if (!postBody.trim()) errors.body = 'Description is required';
    } else if (contentType === 'accountability') {
      if (!accGoal.trim()) errors.accGoal = 'Goal title is required';
      if (!accWeeklyTarget.trim()) errors.accWeeklyTarget = 'Weekly target is required';
      if (!postBody.trim()) errors.body = 'Goal description is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    if (contentType === 'showcase') {
      createShowcaseMutation.mutate({
        name: showcaseName, description: showcaseDesc, stage: showcaseStage,
        imageUrl: showcaseImageUrl.trim() || undefined,
        liveUrl: showcaseLiveUrl.trim() || undefined,
        githubUrl: showcaseGithubUrl.trim() || undefined,
        techStack: showcaseTech.split(',').map(t => t.trim()).filter(Boolean),
        looking: showcaseLooking.split(',').map(t => t.trim()).filter(Boolean),
        tags: showcaseTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    }
    else if (contentType === 'collaboration') {
      createCollabMutation.mutate({
        project: collabProject, milestone: collabMilestone,
        description: collabDesc,
        team: collabRoles.map(role => ({ name: role, role, initials: role.slice(0, 2).toUpperCase() })),
        commitment: collabCommitment,
        timeline: collabTimeline,
        tags: collabTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    } 
    else if (contentType === 'build-in-public') {
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
      createUnifiedPostMutation.mutate({
        contentType: 'founder-matching',
        title: postTitle, body: postBody,
        fmOpportunityDesc,
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
                  <span className={styles.formLabel} style={{ marginBottom: 8 }}>Content Type <span className={styles.requiredStar}>*</span></span>
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
                        onClick={() => { setContentType(id); setValidationErrors({}); }}
                        type="button"
                      >
                        <Icon size={15} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateSubmit} className={styles.modalFormBody} id="createPostForm">
                  <div className={styles.formScrollArea}>
                    {/* === DISCUSSION FORM === */}
                    {contentType === 'discussion' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="post-title">
                            Title <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="post-title" type="text"
                            className={`${styles.formInput} ${validationErrors.title ? styles.formInputError : ''}`}
                            value={postTitle}
                            onChange={e => { setPostTitle(e.target.value); setValidationErrors(prev => ({ ...prev, title: undefined })); }}
                            placeholder="What do you want to discuss?" />
                          {validationErrors.title && <p className={styles.formError}>{validationErrors.title}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Category <span className={styles.requiredStar}>*</span>
                          </label>
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
                        <div>
                          <label className={styles.formLabel} htmlFor="post-body">
                            Discussion Content <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="post-body"
                            className={`${styles.formTextarea} ${validationErrors.body ? styles.formInputError : ''}`}
                            rows={5} value={postBody}
                            onChange={e => { setPostBody(e.target.value); setValidationErrors(prev => ({ ...prev, body: undefined })); }}
                            placeholder="Share your thoughts, questions, or insights..." />
                          {validationErrors.body && <p className={styles.formError}>{validationErrors.body}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="post-tags">Tags</label>
                          <input id="post-tags" type="text" className={styles.formInput} value={postTags}
                            onChange={e => setPostTags(e.target.value)} placeholder="e.g. react, saas, mvp (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === SHOWCASE FORM === */}
                    {contentType === 'showcase' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-name">
                            Project Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="showcase-name" type="text"
                            className={`${styles.formInput} ${validationErrors.showcaseName ? styles.formInputError : ''}`}
                            value={showcaseName}
                            onChange={e => { setShowcaseName(e.target.value); setValidationErrors(prev => ({ ...prev, showcaseName: undefined })); }}
                            placeholder="Your project name" />
                          {validationErrors.showcaseName && <p className={styles.formError}>{validationErrors.showcaseName}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-desc">
                            Description <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="showcase-desc"
                            className={`${styles.formTextarea} ${validationErrors.showcaseDesc ? styles.formInputError : ''}`}
                            rows={4} value={showcaseDesc}
                            onChange={e => { setShowcaseDesc(e.target.value); setValidationErrors(prev => ({ ...prev, showcaseDesc: undefined })); }}
                            placeholder="Describe your project, what you've built, and what you're looking for..." />
                          {validationErrors.showcaseDesc && <p className={styles.formError}>{validationErrors.showcaseDesc}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Stage <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={styles.categoryGrid}>
                            {STAGES.map(s => (
                              <button key={s} type="button"
                                className={`${styles.categoryChip} ${showcaseStage === s ? styles.categoryChipActive : ''}`}
                                onClick={() => setShowcaseStage(s)}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-tech">Tech Stack</label>
                          <input id="showcase-tech" type="text" className={styles.formInput} value={showcaseTech}
                            onChange={e => setShowcaseTech(e.target.value)} placeholder="e.g. React, Node.js, PostgreSQL (comma separated)" />
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-looking">Looking For</label>
                          <input id="showcase-looking" type="text" className={styles.formInput} value={showcaseLooking}
                            onChange={e => setShowcaseLooking(e.target.value)} placeholder="e.g. Backend Developer, Designer (comma separated)" />
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-image">
                            Cover Image URL <span className={styles.formLabelMuted}>(optional)</span>
                          </label>
                          <input id="showcase-image" type="url" className={styles.formInput} value={showcaseImageUrl}
                            onChange={e => setShowcaseImageUrl(e.target.value)} placeholder="https://..." />
                          {showcaseImageUrl && (
                            <div className={styles.imagePreview}>
                              <img src={showcaseImageUrl} alt="Preview" onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-live">
                            Live URL <span className={styles.formLabelMuted}>(optional)</span>
                          </label>
                          <input id="showcase-live" type="url" className={styles.formInput} value={showcaseLiveUrl}
                            onChange={e => setShowcaseLiveUrl(e.target.value)} placeholder="https://..." />
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-github">
                            GitHub URL <span className={styles.formLabelMuted}>(optional)</span>
                          </label>
                          <input id="showcase-github" type="url" className={styles.formInput} value={showcaseGithubUrl}
                            onChange={e => setShowcaseGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="showcase-tags">Tags</label>
                          <input id="showcase-tags" type="text" className={styles.formInput} value={showcaseTags}
                            onChange={e => setShowcaseTags(e.target.value)} placeholder="e.g. react, saas, mvp (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === COLLABORATION FORM === */}
                    {contentType === 'collaboration' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="collab-project">
                            Project Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="collab-project" type="text"
                            className={`${styles.formInput} ${validationErrors.collabProject ? styles.formInputError : ''}`}
                            value={collabProject}
                            onChange={e => { setCollabProject(e.target.value); setValidationErrors(prev => ({ ...prev, collabProject: undefined })); }}
                            placeholder="Name of the project" />
                          {validationErrors.collabProject && <p className={styles.formError}>{validationErrors.collabProject}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="collab-milestone">
                            Milestone <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="collab-milestone" type="text"
                            className={`${styles.formInput} ${validationErrors.collabMilestone ? styles.formInputError : ''}`}
                            value={collabMilestone}
                            onChange={e => { setCollabMilestone(e.target.value); setValidationErrors(prev => ({ ...prev, collabMilestone: undefined })); }}
                            placeholder="e.g. MVP Launch, Beta Release" />
                          {validationErrors.collabMilestone && <p className={styles.formError}>{validationErrors.collabMilestone}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="collab-desc">
                            Description <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="collab-desc"
                            className={`${styles.formTextarea} ${validationErrors.collabDesc ? styles.formInputError : ''}`}
                            rows={4} value={collabDesc}
                            onChange={e => { setCollabDesc(e.target.value); setValidationErrors(prev => ({ ...prev, collabDesc: undefined })); }}
                            placeholder="Describe the milestone and what you need help with..." />
                          {validationErrors.collabDesc && <p className={styles.formError}>{validationErrors.collabDesc}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Roles Needed <span className={styles.requiredStar}>*</span>
                          </label>
                          <RoleChipInput
                            roles={collabRoles}
                            onChange={setCollabRoles}
                            placeholder="Type a role and press Enter (e.g. Frontend Dev)"
                          />
                          <div className={styles.roleSuggestions}>
                            {['Frontend Developer', 'Backend Developer', 'UI Designer', 'Product Manager', 'Marketing'].map(role => (
                              <button key={role} type="button" className={styles.roleSuggestionChip}
                                onClick={() => { if (!collabRoles.includes(role)) setCollabRoles([...collabRoles, role]); }}>
                                + {role}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel}>Commitment Level</label>
                          <div className={styles.categoryGrid}>
                            {COMMITMENT_LEVELS.map(level => (
                              <button key={level} type="button"
                                className={`${styles.categoryChip} ${collabCommitment === level ? styles.categoryChipActive : ''}`}
                                onClick={() => setCollabCommitment(level)}>
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel}>Timeline</label>
                          <div className={styles.categoryGrid}>
                            {TIMELINE_OPTIONS.map(t => (
                              <button key={t} type="button"
                                className={`${styles.categoryChip} ${collabTimeline === t ? styles.categoryChipActive : ''}`}
                                onClick={() => setCollabTimeline(t)}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="collab-tags">Tags</label>
                          <input id="collab-tags" type="text" className={styles.formInput} value={collabTags}
                            onChange={e => setCollabTags(e.target.value)} placeholder="e.g. collaboration, react, open-source (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === BUILD IN PUBLIC FORM === */}
                    {contentType === 'build-in-public' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="bip-title">
                            Update Title <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="bip-title" type="text"
                            className={`${styles.formInput} ${validationErrors.title ? styles.formInputError : ''}`}
                            value={postTitle}
                            onChange={e => { setPostTitle(e.target.value); setValidationErrors(prev => ({ ...prev, title: undefined })); }}
                            placeholder="What did you accomplish?" />
                          {validationErrors.title && <p className={styles.formError}>{validationErrors.title}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Update Type <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={styles.categoryGrid}>
                            {[{ id: 'weekly-update', label: 'Weekly Update' }, { id: 'milestone', label: 'Milestone' },
                              { id: 'launch', label: 'Launch' }, { id: 'pivot', label: 'Pivot' }].map(t => (
                              <button key={t.id} type="button"
                                className={`${styles.categoryChip} ${bipType === t.id ? styles.categoryChipActive : ''}`}
                                onClick={() => setBipType(t.id)}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="bip-body">
                            Update Content <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="bip-body"
                            className={`${styles.formTextarea} ${validationErrors.body ? styles.formInputError : ''}`}
                            rows={5} value={postBody}
                            onChange={e => { setPostBody(e.target.value); setValidationErrors(prev => ({ ...prev, body: undefined })); }}
                            placeholder="Share your update, what you learned, what's next..." />
                          {validationErrors.body && <p className={styles.formError}>{validationErrors.body}</p>}
                        </div>
                        <div className={styles.formRow}>
                          <div>
                            <label className={styles.formLabel} htmlFor="bip-revenue">Revenue</label>
                            <input id="bip-revenue" type="text" className={styles.formInput} value={bipRevenue}
                              onChange={e => setBipRevenue(e.target.value)} placeholder="e.g. $500 MRR" />
                          </div>
                          <div>
                            <label className={styles.formLabel} htmlFor="bip-users">Users</label>
                            <input id="bip-users" type="text" className={styles.formInput} value={bipUsers}
                              onChange={e => setBipUsers(e.target.value)} placeholder="e.g. 150 signups" />
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="bip-looking">Looking For</label>
                          <input id="bip-looking" type="text" className={styles.formInput} value={bipLookingFor}
                            onChange={e => setBipLookingFor(e.target.value)} placeholder="e.g. beta testers, feedback" />
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Progress <span className={styles.requiredStar}>*</span>: {bipProgress}%
                          </label>
                          <div className={styles.progressContainer}>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressBar} style={{ width: `${bipProgress}%` }} />
                            </div>
                            <input type="range" min="0" max="100" value={bipProgress}
                              onChange={e => setBipProgress(Number(e.target.value))}
                              className={styles.progressSlider} />
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="bip-tags">Tags</label>
                          <input id="bip-tags" type="text" className={styles.formInput} value={postTags}
                            onChange={e => setPostTags(e.target.value)} placeholder="e.g. build-in-public, saas (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === FOUNDER MATCHING FORM === */}
                    {contentType === 'founder-matching' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="fm-title">
                            Title <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="fm-title" type="text"
                            className={`${styles.formInput} ${validationErrors.title ? styles.formInputError : ''}`}
                            value={postTitle}
                            onChange={e => { setPostTitle(e.target.value); setValidationErrors(prev => ({ ...prev, title: undefined })); }}
                            placeholder="e.g. Looking for CTO for AI SaaS" />
                          {validationErrors.title && <p className={styles.formError}>{validationErrors.title}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Looking For <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={styles.categoryGrid}>
                            {[{ id: 'co-founder', label: 'Co-Founder' }, { id: 'technical-founder', label: 'Technical Founder' },
                              { id: 'business-partner', label: 'Business Partner' }, { id: 'mentor', label: 'Mentor' }].map(r => (
                              <button key={r.id} type="button"
                                className={`${styles.categoryChip} ${fmRole === r.id ? styles.categoryChipActive : ''}`}
                                onClick={() => setFmRole(r.id)}>
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="fm-body">
                            About You <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="fm-body"
                            className={`${styles.formTextarea} ${validationErrors.body ? styles.formInputError : ''}`}
                            rows={4} value={postBody}
                            onChange={e => { setPostBody(e.target.value); setValidationErrors(prev => ({ ...prev, body: undefined })); }}
                            placeholder="Describe yourself, your background, and what you bring to the table..." />
                          {validationErrors.body && <p className={styles.formError}>{validationErrors.body}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="fm-opportunity">
                            Opportunity Description <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="fm-opportunity"
                            className={`${styles.formTextarea} ${validationErrors.fmOpportunityDesc ? styles.formInputError : ''}`}
                            rows={4} value={fmOpportunityDesc}
                            onChange={e => { setFmOpportunityDesc(e.target.value); setValidationErrors(prev => ({ ...prev, fmOpportunityDesc: undefined })); }}
                            placeholder="Describe the opportunity, your project, and what kind of partner you're looking for..." />
                          {validationErrors.fmOpportunityDesc && <p className={styles.formError}>{validationErrors.fmOpportunityDesc}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="fm-skills">Required Skills</label>
                          <input id="fm-skills" type="text" className={styles.formInput} value={fmSkills}
                            onChange={e => setFmSkills(e.target.value)} placeholder="e.g. React, Python, Marketing (comma separated)" />
                        </div>
                        <div className={styles.formRow}>
                          <div>
                            <label className={styles.formLabel}>Availability</label>
                            <div className={styles.categoryGrid}>
                              {[{ id: 'full-time', label: 'Full-time' }, { id: 'part-time', label: 'Part-time' }].map(a => (
                                <button key={a.id} type="button"
                                  className={`${styles.categoryChip} ${fmAvailability === a.id ? styles.categoryChipActive : ''}`}
                                  onClick={() => setFmAvailability(a.id)}>
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={styles.formLabel}>Location Preference</label>
                            <div className={styles.categoryGrid}>
                              {[{ id: 'remote', label: 'Remote' }, { id: 'in-person', label: 'In-Person' }, { id: 'hybrid', label: 'Hybrid' }].map(l => (
                                <button key={l.id} type="button"
                                  className={`${styles.categoryChip} ${fmLocation === l.id ? styles.categoryChipActive : ''}`}
                                  onClick={() => setFmLocation(l.id)}>
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="fm-tags">Tags</label>
                          <input id="fm-tags" type="text" className={styles.formInput} value={postTags}
                            onChange={e => setPostTags(e.target.value)} placeholder="e.g. founder-matching, remote (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === CHALLENGE FORM === */}
                    {contentType === 'challenge' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="ch-title">
                            Challenge Title <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="ch-title" type="text"
                            className={`${styles.formInput} ${validationErrors.title ? styles.formInputError : ''}`}
                            value={postTitle}
                            onChange={e => { setPostTitle(e.target.value); setValidationErrors(prev => ({ ...prev, title: undefined })); }}
                            placeholder="Name your challenge" />
                          {validationErrors.title && <p className={styles.formError}>{validationErrors.title}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>
                            Challenge Type <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={styles.categoryGrid}>
                            {[{ id: 'build-in-public', label: 'Build in Public' }, { id: 'mvp-sprint', label: 'MVP Sprint' },
                              { id: 'design-challenge', label: 'Design Challenge' }, { id: 'revenue', label: 'Revenue Goal' }].map(c => (
                              <button key={c.id} type="button"
                                className={`${styles.categoryChip} ${challengeType === c.id ? styles.categoryChipActive : ''}`}
                                onClick={() => setChallengeType(c.id)}>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="ch-goal">
                            Goal <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="ch-goal" type="text"
                            className={`${styles.formInput} ${validationErrors.challengeGoal ? styles.formInputError : ''}`}
                            value={challengeGoal}
                            onChange={e => { setChallengeGoal(e.target.value); setValidationErrors(prev => ({ ...prev, challengeGoal: undefined })); }}
                            placeholder="e.g. Ship 3 features in 30 days" />
                          {validationErrors.challengeGoal && <p className={styles.formError}>{validationErrors.challengeGoal}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="ch-body">
                            Description <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="ch-body"
                            className={`${styles.formTextarea} ${validationErrors.body ? styles.formInputError : ''}`}
                            rows={5} value={postBody}
                            onChange={e => { setPostBody(e.target.value); setValidationErrors(prev => ({ ...prev, body: undefined })); }}
                            placeholder="Describe the challenge, rules, and how to participate..." />
                          {validationErrors.body && <p className={styles.formError}>{validationErrors.body}</p>}
                        </div>
                        <div className={styles.formRow}>
                          <div>
                            <label className={styles.formLabel}>
                              Duration <span className={styles.requiredStar}>*</span>
                            </label>
                            <div className={styles.categoryGrid}>
                              {['7', '14', '30', '90'].map(d => (
                                <button key={d} type="button"
                                  className={`${styles.categoryChip} ${challengeDuration === d ? styles.categoryChipActive : ''}`}
                                  onClick={() => setChallengeDuration(d)}>
                                  {d} Days
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={styles.formLabel} htmlFor="ch-rewards">Rewards</label>
                            <input id="ch-rewards" type="text" className={styles.formInput} value={challengeRewards}
                              onChange={e => setChallengeRewards(e.target.value)} placeholder="e.g. Featured on homepage" />
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="ch-tags">Tags</label>
                          <input id="ch-tags" type="text" className={styles.formInput} value={postTags}
                            onChange={e => setPostTags(e.target.value)} placeholder="e.g. challenge, saas (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === GOALS (ACCOUNTABILITY) FORM === */}
                    {contentType === 'accountability' && (
                      <>
                        <div>
                          <label className={styles.formLabel} htmlFor="acc-goal">
                            Goal Title <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="acc-goal" type="text"
                            className={`${styles.formInput} ${validationErrors.accGoal ? styles.formInputError : ''}`}
                            value={accGoal}
                            onChange={e => { setAccGoal(e.target.value); setValidationErrors(prev => ({ ...prev, accGoal: undefined })); }}
                            placeholder="e.g. Ship authentication module" />
                          {validationErrors.accGoal && <p className={styles.formError}>{validationErrors.accGoal}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="acc-target">
                            Weekly Target <span className={styles.requiredStar}>*</span>
                          </label>
                          <input id="acc-target" type="text"
                            className={`${styles.formInput} ${validationErrors.accWeeklyTarget ? styles.formInputError : ''}`}
                            value={accWeeklyTarget}
                            onChange={e => { setAccWeeklyTarget(e.target.value); setValidationErrors(prev => ({ ...prev, accWeeklyTarget: undefined })); }}
                            placeholder="e.g. 10 PRs merged, 5 issues closed" />
                          {validationErrors.accWeeklyTarget && <p className={styles.formError}>{validationErrors.accWeeklyTarget}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel}>Status <span className={styles.requiredStar}>*</span></label>
                          <div className={styles.categoryGrid}>
                            {[{ id: 'in-progress', label: 'In Progress' }, { id: 'completed', label: 'Completed' },
                              { id: 'on-track', label: 'On Track' }, { id: 'needs-help', label: 'Needs Help' }].map(s => (
                              <button key={s.id} type="button"
                                className={`${styles.categoryChip} ${accStatus === s.id ? styles.categoryChipActive : ''}`}
                                onClick={() => setAccStatus(s.id)}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="acc-body">
                            Goal Description <span className={styles.requiredStar}>*</span>
                          </label>
                          <textarea id="acc-body"
                            className={`${styles.formTextarea} ${validationErrors.body ? styles.formInputError : ''}`}
                            rows={5} value={postBody}
                            onChange={e => { setPostBody(e.target.value); setValidationErrors(prev => ({ ...prev, body: undefined })); }}
                            placeholder="Share context about your goal, blockers, and progress so far..." />
                          {validationErrors.body && <p className={styles.formError}>{validationErrors.body}</p>}
                        </div>
                        <div>
                          <label className={styles.formLabel} htmlFor="acc-tags">Tags</label>
                          <input id="acc-tags" type="text" className={styles.formInput} value={postTags}
                            onChange={e => setPostTags(e.target.value)} placeholder="e.g. accountability, sprint (comma separated)" />
                        </div>
                      </>
                    )}

                    {/* === SHARED: Links Section === */}
                    <div className={styles.linksSection}>
                      <label className={styles.formLabel}>
                        Links <span className={styles.formLabelMuted}>(optional)</span>
                      </label>
                      {links.length > 0 && (
                        <div className={styles.linksList}>
                          {links.map((link, idx) => (
                            <div key={idx} className={styles.linkItem}>
                              <ExternalLink size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                              <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{link.name}</span>
                              <span style={{ color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</span>
                              <button type="button" onClick={() => removeLink(idx)} className={styles.linkRemoveBtn}>
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={styles.linkInputGroup}>
                        <div style={{ flex: 1 }}>
                          <input type="text" className={styles.formInput} value={newLinkName}
                            onChange={e => setNewLinkName(e.target.value)} placeholder="Name (e.g. GitHub Repo)" style={{ height: 36, fontSize: 12 }} />
                        </div>
                        <div style={{ flex: 2 }}>
                          <input type="url" className={styles.formInput} value={newLinkUrl}
                            onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{ height: 36, fontSize: 12 }} />
                        </div>
                        <button type="button" onClick={addLink} className={styles.linkAddBtn}>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}

            {/* Submit Footer */}
            {!postSubmitted && (
              <div className={styles.dialogFooter}>
                <button type="button" className={styles.btnCancel} onClick={closeCreate}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="createPostForm"
                  disabled={isSubmitting}
                  className={styles.createBtn}
                  style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? <><Loader2 size={14} className={styles.spinner} /> Publishing...</> : btnLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}