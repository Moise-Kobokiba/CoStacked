import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles } from '../api/articlesApi';
import { 
  BookOpen, Search, Clock, Eye, ArrowRight, 
  TrendingUp, Calendar, Mail, Send 
} from 'lucide-react';
import styles from './InfoHubPage.module.css';

export const InfoHubPage = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Resources');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categories = ['All Resources', 'Fundraising', 'Product Development', 'Legal', 'Marketing', 'Hiring'];

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await getPublishedArticles();
            setArticles(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    // Mock data for Sidebar (from image reference)
    const featuredGuides = articles.slice(0, 2); 
    const mostPopular = articles.slice(2, 5);

    if (loading) return <div className={styles.loading}>Loading Hub...</div>;

    return (
        <div className={styles.container}>
            {/* 1. Header Section */}
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Info Hub</h1>
                <p className={styles.pageSubtitle}>
                    Expertly curated resources to help you scale your startup from zero to one. <br />
                    Templates, guides, and industry insights at your fingertips.
                </p>
            </header>

            {/* 2. Search & Filter Bar */}
            <div className={styles.controlsSection}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides, templates, or articles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.categoryBar}>
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className={styles.mainContent}>
                {/* 3. Main Grid */}
                <div className={styles.articlesGrid}>
                    {filteredArticles.map((article) => (
                        <article 
                            key={article._id} 
                            className={styles.articleCard}
                            onClick={() => navigate(`/info-hub/${article.slug}`)}
                        >
                            <div className={styles.imageContainer}>
                                <img src={article.coverImage} alt={article.title} />
                                <span className={styles.badge}>{article.category}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <h3 className={styles.articleTitle}>{article.title}</h3>
                                <p className={styles.articleSnippet}>{article.description}</p>
                                <div className={styles.cardFooter}>
                                    <button className={styles.readMore}>
                                        Read More <ArrowRight size={16} />
                                    </button>
                                    <div className={styles.metaInfo}>
                                       <span className={styles.date}>
                                           <Calendar size={12} /> {new Date(article.createdAt).toLocaleDateString()}
                                       </span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* 4. Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Featured Guides */}
                    <div className={styles.sidebarSection}>
                        <h4 className={styles.sidebarTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {featuredGuides.map(guide => (
                            <div key={guide._id} className={styles.sideItem}>
                                <span className={styles.sideBadge}>{guide.category}</span>
                                <h5>{guide.title}</h5>
                                <div className={styles.sideMeta}>
                                    <span><Clock size={12} /> {guide.readTime}</span>
                                    <span><Eye size={12} /> {guide.views || '1.2k'} views</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Most Popular */}
                    <div className={styles.sidebarSection}>
                        <h4 className={styles.sidebarTitle}>Most Popular</h4>
                        {mostPopular.map((pop, index) => (
                            <div key={pop._id} className={styles.popItem}>
                                <span className={styles.popIndex}>0{index + 1}</span>
                                <p>{pop.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* Newsletter Widget */}
                    <div className={styles.newsletterCard}>
                        <div className={styles.mailIcon}><Mail size={24} /></div>
                        <h4>Weekly Founders Insights</h4>
                        <p>Get the best startup resources delivered to your inbox every Monday.</p>
                        <div className={styles.newsInputWrapper}>
                            <input type="email" placeholder="email@startup.com" />
                            <button className={styles.subscribeBtn}>Subscribe</button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};
