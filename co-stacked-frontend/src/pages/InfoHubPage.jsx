// InfoHubPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles, incrementViewCount } from '../api/articlesApi';
import {
  Search,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  Calendar,
  Plus,
  Mail,
  Zap,
  Sparkles,
} from 'lucide-react';
import styles from './InfoHubPage.module.css';

export const InfoHubPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Resources');
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await getPublishedArticles();
        setArticles(response.data || []);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Increment view count only when user clicks an article
  const handleArticleNavigation = async (article) => {
    try {
      await incrementViewCount(article._id);
      navigate(`/info-hub/${article.slug}`);
    } catch (err) {
      navigate(`/info-hub/${article.slug}`);
    }
  };

  // Handle Submit Resource button click
  const handleSubmitResource = () => {
    // You can replace this with a modal or navigate to a form page
    navigate('/submit-resource');
  };

  // Filter articles by search + category
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch = article.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All Resources' || article.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, activeCategory]);

  // Top 3 most viewed articles
  const popularArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);
  }, [articles]);

  // First 3 articles for "Featured Guides"
  const featuredGuides = useMemo(() => articles.slice(0, 3), [articles]);

  if (loading) {
    return <div className={styles.loading}>Syncing CoStacked Resources...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header with Submit Resource button */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.pageTitle}>Info Hub</h1>
          <button
            className={styles.mainActionBtn}
            onClick={handleSubmitResource}   // 👈 interactive now
          >
            <Plus size={18} />
            <span>Submit Resource</span>
          </button>
        </div>
        <p className={styles.pageSubtitle}>
          Expertly curated resources to help you scale your startup from zero to one.
          Templates, guides, and industry insights at your fingertips.
        </p>
      </header>

      {/* Search & Categories */}
      <section className={styles.controls}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search for guides, templates, or articles..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.categoryWrapper}>
          <div className={styles.categoryBar}>
            {[
              'All Resources',
              'Fundraising',
              'Product Development',
              'Legal',
              'Marketing',
              'Hiring',
            ].map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryBtn} ${
                  activeCategory === cat ? styles.active : ''
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main content: grid + sidebar */}
      <div className={styles.mainLayout}>
        {/* Left column – article grid */}
        <div className={styles.contentArea}>
          <div className={styles.articlesGrid}>
            {filteredArticles.slice(0, visibleCount).map((article) => (
              <article
                key={article._id}
                className={styles.card}
                onClick={() => handleArticleNavigation(article)} // 👈 interactive
              >
                <div className={styles.cardImage}>
                  <img src={article.coverImage} alt="" />
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.subLabel}>
                    {article.category?.toUpperCase() || 'FUNDAMENTALS'}
                  </span>
                  <div className={styles.metaRow}>
                    <span>
                      <Calendar size={14} />{' '}
                      {new Date(article.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span>
                      <Eye size={14} /> {article.views || 0} views
                    </span>
                    {article.readTime && (
                      <span>
                        <Clock size={14} /> {article.readTime} min read
                      </span>
                    )}
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <div className={styles.readMore}>
                    Read More <ArrowRight size={16} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More button – identical to Submit Resource */}
          {visibleCount < filteredArticles.length && (
            <button
              className={`${styles.mainActionBtn} ${styles.loadMoreCenter}`}
              onClick={() => setVisibleCount((v) => v + 3)}
            >
              <Plus size={18} />
              <span>Load More Resources</span>
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <aside className={styles.sidebar}>
          {/* Featured Guides */}
          <section className={styles.sideSection}>
            <h4 className={styles.sideTitle}>
              <Sparkles size={18} /> Featured Guides
            </h4>
            {featuredGuides.map((guide) => (
              <div
                key={guide._id}
                className={styles.interactiveGlow}
                onClick={() => handleArticleNavigation(guide)} // 👈 interactive
              >
                <div className={styles.sideThumb}>
                  <img src={guide.coverImage} alt="" />
                </div>
                <div className={styles.sideContent}>
                  <span className={styles.sideSubLabel}>
                    {guide.category || 'Fundamentals'}
                  </span>
                  <h5>{guide.title}</h5>
                  <div className={styles.sideMeta}>
                    {guide.readTime && (
                      <span>
                        <Clock size={12} /> {guide.readTime} min read
                      </span>
                    )}
                    <span>
                      <Eye size={12} /> {guide.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Most Popular */}
          <section className={styles.sideSection}>
            <h4 className={styles.sideTitle}>
              <Zap size={18} /> Most Popular
            </h4>
            {popularArticles.map((pop, index) => (
              <div
                key={pop._id}
                className={styles.popItem}
                onClick={() => handleArticleNavigation(pop)} // 👈 interactive
              >
                <span className={styles.popRank}>0{index + 1}</span>
                <div className={styles.popContent}>
                  <h5>{pop.title}</h5>
                </div>
              </div>
            ))}
          </section>

          {/* Weekly Newsletter */}
          <section className={styles.sideSection}>
            <h4 className={styles.sideTitle}>
              <Mail size={18} /> Weekly Founders Insights
            </h4>
            <p className={styles.newsletterText}>
              Get the best startup resources delivered to your inbox every Monday.
            </p>
            <div className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="email@startup.com"
                className={styles.newsletterInput}
              />
              <button className={styles.newsletterBtn}>Subscribe</button>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <span>© 2024 CoStacked Platform. All rights reserved.</span>
          <span>Professional resources for high-growth startups.</span>
        </div>
        <div className={styles.footerAddress}>
          123 Tech Innovation Way, San Francisco, CA 94105
        </div>
        <div className={styles.footerMeta}>
          You received this email because you are a member of the CoStacked network.
          <a href="#">Manage Preferences</a> | <a href="#">Unsubscribe</a>
        </div>
      </footer>
    </div>
  );
};