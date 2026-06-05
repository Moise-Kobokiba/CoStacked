// src/pages/StackSuitePage.jsx

import { useState, useMemo } from 'react';
import {
  Search, Plus, MessageCircle, Rocket, GitBranch,
  ChevronDown, Sparkles, TrendingUp, Users, X, Send, Loader2,
  Zap, Hash, Image, ExternalLink, Briefcase, Grid3X3, List
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

// ─── Mock trending tags (would come from backend aggregator) ───
const TRENDING_TAGS = ['validation', 'saas', 'nextjs', 'react', 'startup', 'mvp', 'design', 'backend', 'api'];

export function StackSuitePage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('discussions');
  const [sortBy, setSortBy]       = useState('Latest First');
  const [sortOpen, setSortOpen]   = useState(false);
  const [tagFilter, setTagFilter] = useState('');

  // Shared modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [contentType, setContentType] = useState('discussion');

  // Discussions Form State
  const [postTitle, setPostTitle]       = useState('');
  const [postBody, setPostBody]         = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags]         = useState('');

  // Showcases Form State
  const [showcaseName, setShowcaseName]     = useState('');
  const [showcaseDesc, setShowcaseDesc]     = useState('');
  const [showcaseStage, setShowcaseStage]   = useState('Idea');
  const [showcaseTech, setShowcaseTech]     = useState('');
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
  const [links, setLinks] = useState([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl]   = useState('');

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

  const createPostMutation = useMutation({
    mutationFn: (data) => createStackPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stackPosts'] });
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createPostMutation')
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

  const handleCreateSubmit = (e) => {
    if (e) e.preventDefault();

    if (contentType === 'discussion') {
      if (!postTitle.trim() || !postBody.trim()) return;
      createPostMutation.mutate({
        title: postTitle, body: postBody, category: postCategory,
        boardType: 'stack-suite',
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean),
        links
      });
    } else if (contentType === 'showcase') {
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
    } else if (contentType === 'collaboration') {
      if (!collabProject.trim() || !collabMilestone.trim() || !collabDesc.trim()) return;
      createCollabMutation.mutate({
        project: collabProject, milestone: collabMilestone,
        description: collabDesc,
        roles: collabRoles.split(',').map(r => r.trim()).filter(Boolean),
        links
      });
    }
  };

  const isSubmitting = createPostMutation.isPending || createShowcaseMutation.isPending || createCollabMutation.isPending;

  const btnLabel = contentType === 'discussion' ? 'Create Post'
    : contentType === 'showcase' ? 'Launch Showcase'
    : 'New Milestone';

  const { data: stats } = useQuery({
    queryKey: ['stackSuiteStats'],
    queryFn: getStackSuiteStats,
  });

  // Tag click handler
  const handleTagClick = (tag) => {
    setTagFilter(prev => prev === tag ? '' : tag);
  };

  // Computed: unique tags from current data for trending

  const modalTitle = contentType === 'discussion' ? 'Create a New Post'
    : contentType === 'showcase' ? 'Launch Your Showcase'
    : 'Start a Collaboration Thread';

  const modalDesc = contentType === 'discussion'
    ? 'Share a question, insight, or update with the community.'
    : contentType === 'showcase'
    ? 'Share what you are building, get feedback, and find collaborators.'
    : 'Create a milestone for your project and find team members.';

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

            <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> + Create New Post
            </button>
          </div>
        </section>

        {/* ── Three-column layout ── */}
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
                {activeTab === 'discussions'   && <DiscussionsTab search={search} tagFilter={tagFilter} onTagClick={handleTagClick} />}
                {activeTab === 'showcases'     && <ShowcasesTab search={search} tagFilter={tagFilter} onTagClick={handleTagClick} />}
                {activeTab === 'collaboration' && <CollaborationTab search={search} tagFilter={tagFilter} onTagClick={handleTagClick} />}
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
                <button className={styles.sideActionBtn} onClick={() => { setContentType('discussion'); setCreateOpen(true); }}>
                  <MessageCircle size={15} /> Start Discussion
                </button>
                <button className={styles.sideActionBtn} onClick={() => { setContentType('showcase'); setCreateOpen(true); }}>
                  <Rocket size={15} /> Showcase Project
                </button>
                <button className={styles.sideActionBtn} onClick={() => { setContentType('collaboration'); setCreateOpen(true); }}>
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
                            <button key={cat} onClick={() => setPostCategory(cat)}
                              className={`${styles.categoryChip} ${postCategory === cat ? styles.categoryChipActive : ''}`} type="button">
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-body">Body</label>
                        <textarea id="post-body" className={styles.formTextarea} value={postBody}
                          onChange={e => setPostBody(e.target.value)}
                          placeholder="Share your thoughts, questions, or insights..." rows={5} />
                        <p className={styles.formHint}>Markdown supported</p>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-tags">Tags <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="post-tags" type="text" className={styles.formInput} value={postTags}
                          onChange={e => setPostTags(e.target.value)} placeholder="saas, mvp, validation" />
                      </div>
                    </>
                  )}

                  {/* === SHOWCASE FORM === */}
                  {contentType === 'showcase' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-name">Project Name</label>
                        <input id="showcase-name" type="text" className={styles.formInput} value={showcaseName}
                          onChange={e => setShowcaseName(e.target.value)} placeholder="e.g. Co-Stacked" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-desc">Description</label>
                        <textarea id="showcase-desc" className={styles.formTextarea} value={showcaseDesc}
                          onChange={e => setShowcaseDesc(e.target.value)} placeholder="Describe what you are building..." rows={3} />
                      </div>
                      <div>
                        <label className={styles.formLabel}>Stage at Launch</label>
                        <div className={styles.categoryGrid}>
                          {STAGES.map(stage => (
                            <button key={stage} onClick={() => setShowcaseStage(stage)}
                              className={`${styles.categoryChip} ${showcaseStage === stage ? styles.categoryChipActive : ''}`} type="button">
                              {stage}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-image">Image URL (optional)</label>
                        <input id="showcase-image" type="text" className={styles.formInput} value={showcaseImageUrl}
                          onChange={e => setShowcaseImageUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-live">Live Demo URL (optional)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ExternalLink size={14} style={{ color: 'var(--muted-foreground)' }} />
                          <input id="showcase-live" type="text" className={styles.formInput} value={showcaseLiveUrl}
                            onChange={e => setShowcaseLiveUrl(e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-github">GitHub URL (optional)</label>
                        <input id="showcase-github" type="text" className={styles.formInput} value={showcaseGithubUrl}
                          onChange={e => setShowcaseGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-tech">Tech Stack <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="showcase-tech" type="text" className={styles.formInput} value={showcaseTech}
                          onChange={e => setShowcaseTech(e.target.value)} placeholder="React, Node.js, NextJS" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-looking">Roles Looking For <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="showcase-looking" type="text" className={styles.formInput} value={showcaseLooking}
                          onChange={e => setShowcaseLooking(e.target.value)} placeholder="Backend Dev, UI/UX Designer, Marketing" />
                      </div>
                    </>
                  )}

                  {/* === COLLAB FORM === */}
                  {contentType === 'collaboration' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-project">Project Name</label>
                        <input id="collab-project" type="text" className={styles.formInput} value={collabProject}
                          onChange={e => setCollabProject(e.target.value)} placeholder="Project you belong to..." />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-milestone">Milestone / Thread Title</label>
                        <input id="collab-milestone" type="text" className={styles.formInput} value={collabMilestone}
                          onChange={e => setCollabMilestone(e.target.value)} placeholder="e.g. User onboarding flow redesigned" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-roles">Roles Needed <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="collab-roles" type="text" className={styles.formInput} value={collabRoles}
                          onChange={e => setCollabRoles(e.target.value)} placeholder="Next.js Expert, UI Designer, Backend Dev" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-desc">Description & Progress Updates</label>
                        <textarea id="collab-desc" className={styles.formTextarea} value={collabDesc}
                          onChange={e => setCollabDesc(e.target.value)}
                          placeholder="Summarize what your team accomplished or needs review on..." rows={4} />
                      </div>
                    </>
                  )}

                  {/* === SHARED LINKS SECTION === */}
                  <div className={styles.linksSection}>
                    <label className={styles.formLabel} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={14} color="var(--primary)" />
                      External Links <span className={styles.formLabelMuted}>(Websites, Demos, Docs)</span>
                    </label>
                    
                    <div className={styles.categoryGrid} style={{ marginBottom: 12 }}>
                      {links.map((link, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--card-background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
                          <span>{link.name}</span>
                          <button onClick={() => removeLink(idx)} style={{ color: 'var(--destructive)', marginLeft: 4, display: 'flex', alignItems: 'center' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" className={styles.formInput} style={{ flex: 1 }} placeholder="Label (e.g. GitHub)"
                        value={newLinkName} onChange={e => setNewLinkName(e.target.value)} />
                      <input type="text" className={styles.formInput} style={{ flex: 2 }} placeholder="URL (https://...)"
                        value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} />
                      <button type="button" onClick={addLink}
                        className={`${sharedStyles.btn} ${sharedStyles.btnOutline}`} style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.dialogFooter}>
                  <button className={`${sharedStyles.btn} ${sharedStyles.btnOutline}`} onClick={closeCreate}>
                    Cancel
                  </button>
                  <button
                    className={`${sharedStyles.btn} ${sharedStyles.btnPrimary}`}
                    onClick={handleCreateSubmit}
                    disabled={
                      isSubmitting ||
                      (contentType === 'discussion' && (!postTitle.trim() || !postBody.trim())) ||
                      (contentType === 'showcase' && (!showcaseName.trim() || !showcaseDesc.trim())) ||
                      (contentType === 'collaboration' && (!collabProject.trim() || !collabMilestone.trim() || !collabDesc.trim()))
                    }
                  >
                    {isSubmitting ? <Loader2 size={15} className={sharedStyles.spinner} /> : <Send size={15} />}
                    {isSubmitting ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}