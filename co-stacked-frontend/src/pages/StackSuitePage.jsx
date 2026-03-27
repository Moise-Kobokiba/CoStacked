// src/pages/StackSuitePage.jsx

import { useState } from 'react';
import {
  Search, Plus, MessageCircle, Rocket, GitBranch,
  ChevronDown, Sparkles, TrendingUp, Users, X, Send, Loader2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStackPost, createShowcase, createCollabThread } from '../api/stackSuiteApi';
import { DiscussionsTab }   from '../components/stack-suite/DiscussionsTab';
import { ShowcasesTab }     from '../components/stack-suite/ShowcasesTab';
import { CollaborationTab } from '../components/stack-suite/CollaborationTab';
import styles from './StackSuitePage.module.css';
import sharedStyles from '../components/stack-suite/StackSuite.module.css';

const CATEGORIES = ['Validation', 'Tech', 'Equity', 'Growth', 'Legal', 'General'];
const STAGES = ['Idea', 'MVP', 'Beta', 'Launched'];

const TABS = [
  { id: 'discussions',   label: 'Discussions',   shortLabel: 'Chat',   Icon: MessageCircle },
  { id: 'showcases',     label: 'Showcases',     shortLabel: 'Show',   Icon: Rocket        },
  { id: 'collaboration', label: 'Collaboration', shortLabel: 'Collab', Icon: GitBranch     },
];

export function StackSuitePage() {
  const queryClient = useQueryClient();

  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [activeTab, setActiveTab]       = useState('discussions');
  
  // Shared modal state
  const [createOpen, setCreateOpen]     = useState(false);
  const [postSubmitted, setPostSubmitted] = useState(false);

  // Discussions Form State
  const [postTitle, setPostTitle]       = useState('');
  const [postBody, setPostBody]         = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags]         = useState('');

  // Showcases Form State
  const [showcaseName, setShowcaseName] = useState('');
  const [showcaseDesc, setShowcaseDesc] = useState('');
  const [showcaseStage, setShowcaseStage] = useState('Idea');
  const [showcaseTech, setShowcaseTech] = useState('');
  const [showcaseLooking, setShowcaseLooking] = useState('');

  // Collab Form State
  const [collabProject, setCollabProject] = useState('');
  const [collabMilestone, setCollabMilestone] = useState('');
  const [collabDesc, setCollabDesc] = useState('');

  const filterLabel = filter === 'founder' ? 'Founders' : filter === 'developer' ? 'Developers' : 'All Roles';

  const closeCreate = () => {
    setCreateOpen(false);
    setPostSubmitted(false);
    
    // Reset posts
    setPostTitle('');
    setPostBody('');
    setPostCategory('General');
    setPostTags('');

    // Reset showcases
    setShowcaseName('');
    setShowcaseDesc('');
    setShowcaseStage('Idea');
    setShowcaseTech('');
    setShowcaseLooking('');

    // Reset collab
    setCollabProject('');
    setCollabMilestone('');
    setCollabDesc('');
  };

  const handleError = (error, contextAction) => {
    console.error(`[${contextAction}] Mutation ERROR!`, error);
    alert(`Failed to publish: ${error.response?.data?.message || error.message}`);
  };

  const createPostMutation = useMutation({
    mutationFn: (data) => {
      console.log("[createPostMutation] Calling API with data:", data);
      return createStackPost(data);
    },
    onMutate: () => console.log("[createPostMutation] Starting..."),
    onSuccess: (res) => {
      console.log("[createPostMutation] SUCCESS!", res);
      queryClient.invalidateQueries(['stackPosts']);
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createPostMutation')
  });

  const createShowcaseMutation = useMutation({
    mutationFn: (data) => {
      console.log("[createShowcaseMutation] Calling API with data:", data);
      return createShowcase(data);
    },
    onMutate: () => console.log("[createShowcaseMutation] Starting..."),
    onSuccess: (res) => {
      console.log("[createShowcaseMutation] SUCCESS!", res);
      queryClient.invalidateQueries(['showcases']);
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createShowcaseMutation')
  });

  const createCollabMutation = useMutation({
    mutationFn: (data) => {
      console.log("[createCollabMutation] Calling API with data:", data);
      return createCollabThread(data);
    },
    onMutate: () => console.log("[createCollabMutation] Starting..."),
    onSuccess: (res) => {
      console.log("[createCollabMutation] SUCCESS!", res);
      queryClient.invalidateQueries(['threads']);
      setPostSubmitted(true);
      setTimeout(closeCreate, 1500);
    },
    onError: (err) => handleError(err, 'createCollabMutation')
  });

  const handleCreateSubmit = (e) => {
    if (e) e.preventDefault();
    console.log("=== SUBMIT INITIATED ===", { activeTab });

    if (activeTab === 'discussions') {
      console.log("Checking discussion validation...", { postTitle, postBody });
      if (!postTitle.trim() || !postBody.trim()) {
        console.warn("Validation failed: Title or body is empty");
        return;
      }
      const payload = {
        title: postTitle,
        body: postBody,
        category: postCategory,
        tags: postTags.split(',').map(t => t.trim()).filter(Boolean)
      };
      console.log("Dispatching Discussion Payload:", payload);
      createPostMutation.mutate(payload);

    } else if (activeTab === 'showcases') {
      console.log("Checking showcase validation...");
      if (!showcaseName.trim() || !showcaseDesc.trim()) return;
      const payload = {
        name: showcaseName,
        description: showcaseDesc,
        stage: showcaseStage,
        techStack: showcaseTech.split(',').map(t => t.trim()).filter(Boolean),
        looking: showcaseLooking.split(',').map(t => t.trim()).filter(Boolean)
      };
      console.log("Dispatching Showcase Payload:", payload);
      createShowcaseMutation.mutate(payload);

    } else if (activeTab === 'collaboration') {
      console.log("Checking collaboration validation...");
      if (!collabProject.trim() || !collabMilestone.trim() || !collabDesc.trim()) return;
      const payload = {
        project: collabProject,
        milestone: collabMilestone,
        description: collabDesc
      };
      console.log("Dispatching Collab Payload:", payload);
      createCollabMutation.mutate(payload);
    }
  };

  const isSubmitting = createPostMutation.isLoading || createShowcaseMutation.isLoading || createCollabMutation.isLoading;

  const btnLabel = activeTab === 'discussions' ? 'Create Post' : activeTab === 'showcases' ? 'Launch Showcase' : 'New Milestone';
  const modalTitle = activeTab === 'discussions' ? 'Create a New Post' : activeTab === 'showcases' ? 'Launch Your Showcase' : 'Start a Collaboration Thread';
  const modalDesc = activeTab === 'discussions' ? 'Share a question, insight, or update with the community.' : activeTab === 'showcases' ? 'Share what you are building, get feedback, and find collaborators.' : 'Create a milestone for your project and discuss progress with your team.';

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
                  <p className={styles.statValue}>2.4k</p>
                  <p className={styles.statLabel}>Active Posts</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statIcon} ${styles.statIconEmerald}`}>
                  <Users size={20} />
                </div>
                <div>
                  <p className={styles.statValue}>890</p>
                  <p className={styles.statLabel}>Members</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={`${styles.statIcon} ${styles.statIconSky}`}>
                  <Rocket size={20} />
                </div>
                <div>
                  <p className={styles.statValue}>156</p>
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
              onChange={e => setSearch(e.target.value)}
              aria-label="Search StackSuite"
            />
          </div>

          <div className={styles.toolbarRight}>
            {/* Filter dropdown */}
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
              <Plus size={16} /> {btnLabel}
            </button>
          </div>
        </section>

        {/* ── Tabs ── */}
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
            {activeTab === 'discussions'   && <DiscussionsTab search={search} />}
            {activeTab === 'showcases'     && <ShowcasesTab search={search} />}
            {activeTab === 'collaboration' && <CollaborationTab search={search} />}
          </div>
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
                <div className={styles.formGroup} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                  
                  {/* === DISCUSSIONS FORM === */}
                  {activeTab === 'discussions' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-title">Title</label>
                        <input id="post-title" type="text" className={styles.formInput} value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="What do you want to discuss?" />
                      </div>
                      <div>
                        <label className={styles.formLabel}>Category</label>
                        <div className={styles.categoryGrid}>
                          {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setPostCategory(cat)} className={`${styles.categoryChip} ${postCategory === cat ? styles.categoryChipActive : ''}`} type="button">
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-body">Body</label>
                        <textarea id="post-body" className={styles.formTextarea} value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="Share your thoughts, questions, or insights..." rows={6} />
                        <p className={styles.formHint}>Markdown supported</p>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="post-tags">Tags <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="post-tags" type="text" className={styles.formInput} value={postTags} onChange={e => setPostTags(e.target.value)} placeholder="saas, mvp, validation" />
                      </div>
                    </>
                  )}

                  {/* === SHOWCASES FORM === */}
                  {activeTab === 'showcases' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-name">Project Name</label>
                        <input id="showcase-name" type="text" className={styles.formInput} value={showcaseName} onChange={e => setShowcaseName(e.target.value)} placeholder="e.g. Co-Stacked" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-desc">Description</label>
                        <textarea id="showcase-desc" className={styles.formTextarea} value={showcaseDesc} onChange={e => setShowcaseDesc(e.target.value)} placeholder="Describe what you are building..." rows={4} />
                      </div>
                      <div>
                        <label className={styles.formLabel}>Stage at Launch</label>
                        <div className={styles.categoryGrid}>
                          {STAGES.map(stage => (
                            <button key={stage} onClick={() => setShowcaseStage(stage)} className={`${styles.categoryChip} ${showcaseStage === stage ? styles.categoryChipActive : ''}`} type="button">
                              {stage}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-tech">Tech Stack <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="showcase-tech" type="text" className={styles.formInput} value={showcaseTech} onChange={e => setShowcaseTech(e.target.value)} placeholder="React, Node.js, NextJS" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="showcase-looking">Roles Looking For <span className={styles.formLabelMuted}>(comma separated)</span></label>
                        <input id="showcase-looking" type="text" className={styles.formInput} value={showcaseLooking} onChange={e => setShowcaseLooking(e.target.value)} placeholder="Backend Dev, UI/UX Designer, Marketing" />
                      </div>
                    </>
                  )}

                  {/* === COLLAB FORM === */}
                  {activeTab === 'collaboration' && (
                    <>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-project">Project Name</label>
                        <input id="collab-project" type="text" className={styles.formInput} value={collabProject} onChange={e => setCollabProject(e.target.value)} placeholder="Project you belong to..." />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-milestone">Milestone / Thread Title</label>
                        <input id="collab-milestone" type="text" className={styles.formInput} value={collabMilestone} onChange={e => setCollabMilestone(e.target.value)} placeholder="e.g. User onboarding flow redesigned" />
                      </div>
                      <div>
                        <label className={styles.formLabel} htmlFor="collab-desc">Description & Progress Updates</label>
                        <textarea id="collab-desc" className={styles.formTextarea} value={collabDesc} onChange={e => setCollabDesc(e.target.value)} placeholder="Summarize what your team accomplished or needs review on..." rows={5} />
                      </div>
                    </>
                  )}

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
                      (activeTab === 'discussions' && (!postTitle.trim() || !postBody.trim())) ||
                      (activeTab === 'showcases' && (!showcaseName.trim() || !showcaseDesc.trim())) ||
                      (activeTab === 'collaboration' && (!collabProject.trim() || !collabMilestone.trim() || !collabDesc.trim()))
                    }
                  >
                    {isSubmitting ? <Loader2 size={15} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
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
