// src/pages/StackSuitePage.jsx

import { useState } from 'react';
import {
  Search, Plus, MessageCircle, Rocket, GitBranch,
  ChevronDown, Sparkles, TrendingUp, Users, X, Send,
} from 'lucide-react';
import { DiscussionsTab }   from '../components/stack-suite/DiscussionsTab';
import { ShowcasesTab }     from '../components/stack-suite/ShowcasesTab';
import { CollaborationTab } from '../components/stack-suite/CollaborationTab';
import styles from './StackSuitePage.module.css';
import sharedStyles from '../components/stack-suite/StackSuite.module.css';

const CATEGORIES = ['Validation', 'Tech', 'Equity', 'Growth', 'Legal', 'General'];
const TABS = [
  { id: 'discussions',   label: 'Discussions',   shortLabel: 'Chat',   Icon: MessageCircle },
  { id: 'showcases',     label: 'Showcases',     shortLabel: 'Show',   Icon: Rocket        },
  { id: 'collaboration', label: 'Collaboration', shortLabel: 'Collab', Icon: GitBranch     },
];

export function StackSuitePage() {
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [activeTab, setActiveTab]       = useState('discussions');
  const [createOpen, setCreateOpen]     = useState(false);
  const [postTitle, setPostTitle]       = useState('');
  const [postBody, setPostBody]         = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags]         = useState('');
  const [postSubmitted, setPostSubmitted] = useState(false);

  const filterLabel =
    filter === 'founder' ? 'Founders' : filter === 'developer' ? 'Developers' : 'All Roles';

  const handleCreatePost = () => {
    if (postTitle.trim() && postBody.trim()) {
      setPostSubmitted(true);
      setTimeout(() => {
        setCreateOpen(false);
        setPostTitle('');
        setPostBody('');
        setPostCategory('General');
        setPostTags('');
        setPostSubmitted(false);
      }, 1500);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setPostTitle('');
    setPostBody('');
    setPostCategory('General');
    setPostTags('');
    setPostSubmitted(false);
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
              <Plus size={16} /> Create Post
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
            {activeTab === 'discussions'   && <DiscussionsTab />}
            {activeTab === 'showcases'     && <ShowcasesTab />}
            {activeTab === 'collaboration' && <CollaborationTab />}
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

      {/* ── Create Post Dialog ── */}
      {createOpen && (
        <div className={styles.dialogOverlay} onClick={closeCreate}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <h2 className={styles.dialogTitle}>Create a New Post</h2>
                <p className={styles.dialogDesc}>Share a question, insight, or update with the community.</p>
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
                <h3 className={styles.successTitle}>Post Published!</h3>
                <p className={styles.successDesc}>Your post is now live in the community.</p>
              </div>
            ) : (
              <>
                <div className={styles.formGroup}>
                  {/* Title */}
                  <div>
                    <label className={styles.formLabel} htmlFor="post-title">Title</label>
                    <input
                      id="post-title"
                      type="text"
                      className={styles.formInput}
                      value={postTitle}
                      onChange={e => setPostTitle(e.target.value)}
                      placeholder="What do you want to discuss?"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className={styles.formLabel}>Category</label>
                    <div className={styles.categoryGrid}>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setPostCategory(cat)}
                          className={`${styles.categoryChip} ${postCategory === cat ? styles.categoryChipActive : ''}`}
                          type="button"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <label className={styles.formLabel} htmlFor="post-body">Body</label>
                    <textarea
                      id="post-body"
                      className={styles.formTextarea}
                      value={postBody}
                      onChange={e => setPostBody(e.target.value)}
                      placeholder="Share your thoughts, questions, or insights..."
                      rows={6}
                    />
                    <p className={styles.formHint}>Markdown supported</p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className={styles.formLabel} htmlFor="post-tags">
                      Tags <span className={styles.formLabelMuted}>(comma separated)</span>
                    </label>
                    <input
                      id="post-tags"
                      type="text"
                      className={styles.formInput}
                      value={postTags}
                      onChange={e => setPostTags(e.target.value)}
                      placeholder="saas, mvp, validation"
                    />
                  </div>
                </div>

                <div className={styles.dialogFooter}>
                  <button className={`${sharedStyles.btn} ${sharedStyles.btnOutline}`} onClick={closeCreate}>
                    Cancel
                  </button>
                  <button
                    className={`${sharedStyles.btn} ${sharedStyles.btnPrimary}`}
                    onClick={handleCreatePost}
                    disabled={!postTitle.trim() || !postBody.trim()}
                  >
                    <Send size={15} /> Publish Post
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
