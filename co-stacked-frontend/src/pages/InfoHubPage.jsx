import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles } from '../api/articlesApi';
import { 
    Search, Clock, Eye, ArrowRight, 
    TrendingUp, Calendar, Plus, BookOpen 
} from 'lucide-react';
import styles from './InfoHubPage.module.css';

export const InfoHubPage = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Resources');
    const [visibleCount, setVisibleCount] = useState(4);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categories = ['All Resources', 'Fundraising', 'Product Development', 'Legal', 'Marketing', 'Hiring'];

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const response = await getPublishedArticles();
                setArticles(response.data || []);
            } catch (err) {
                console.error('Error fetching articles:', err);
                setError('Failed to load resources.');
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    // Interactive Logic: Search & Category Filter
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 article.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    const handleLoadMore = () => setVisibleCount(prev => prev + 4);

    if (loading) return <div className={styles.loading}>Loading Info Hub...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            {/* Header with Submit Action */}
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.submitBtn} onClick={() => window.open('mailto:collab@costacked.co.za')}>
                        <Plus size={18} /> Submit Resource
                    </button>
                </div>
                <p className={styles.pageSubtitle}>
                    Expertly curated resources to help you scale your startup from zero to one. 
                    Templates, guides, and industry insights at your fingertips.
                </p>
            </header>

            {/* Interactive Controls: Search & Tabs */}
            <div className={styles.controlsSection}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides, templates, or articles..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setVisibleCount(4);
                        }}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.categoryBar}>
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
                            onClick={() => {
                                setActiveCategory(cat);
                                setVisibleCount(4);
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className={styles.mainContent}>
                {/* Main Article Grid */}
                <div className={styles.leftCol}>
                    {filteredArticles.length === 0 ? (
                        <div className={styles.emptyState}>No resources found matching your criteria.</div>
                    ) : (
                        <div className={styles.articlesGrid}>
                            {filteredArticles.slice(0, visibleCount).map((article) => (
                                <article 
                                    key={article._id} 
                                    className={styles.articleCard} 
                                    onClick={() => navigate(`/info-hub/${article.slug}`)}
                                >
                                    <div className={styles.imageContainer}>
                                        <img src={article.coverImage || '/api/placeholder/400/250'} alt="" />
                                        <span className={styles.cardBadge}>{article.category}</span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <h3>{article.title}</h3>
                                        <p>{article.description}</p>
                                        <div className={styles.cardLink}>Read More <ArrowRight size={16} /></div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    
                    {visibleCount < filteredArticles.length && (
                        <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
                            Load More Resources
                        </button>
                    )}
                </div>

                {/* Sidebar: Featured & Popular (All Interactive) */}
                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideHeading}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div 
                                key={guide._id} 
                                className={styles.sideArticle}
                                onClick={() => navigate(`/info-hub/${guide.slug}`)}
                            >
                                <span className={styles.sideCategory}>{guide.category}</span>
                                <h5>{guide.title}</h5>
                                <div className={styles.sideMeta}>
                                    <span><Clock size={14} /> {guide.readTime || '10 min'}</span>
                                    <span><Eye size={14} /> {guide.views || '1.2k'} views</span>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideHeading}>Most Popular</h4>
                        {articles.slice(3, 6).map((pop, i) => (
                            <div 
                                key={pop._id} 
                                className={styles.popItem}
                                onClick={() => navigate(`/info-hub/${pop.slug}`)}
                            >
                                <span className={styles.popIndex}>0{i+1}</span>
                                <p>{pop.title}</p>
                            </div>
                        ))}
                    </section>

                    <div className={styles.newsletterCard}>
                        <h4>Weekly Insights</h4>
                        <p>Get the best startup resources delivered weekly.</p>
                        <input type="email" placeholder="email@startup.com" className={styles.newsInput} />
                        <button className={styles.subscribeBtn}>Subscribe</button>
                    </div>
                </aside>
            </main>
        </div>
    );
};
