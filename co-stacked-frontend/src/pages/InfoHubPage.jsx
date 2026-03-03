import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Replace with your actual increment function in articlesApi
import { getPublishedArticles, incrementArticleViews } from '../api/articlesApi'; 
import { Search, Clock, Eye, ArrowRight, TrendingUp, Calendar, Plus, Mail } from 'lucide-react';
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

    // Logic: Only increments when clicked
    const handleArticleClick = async (articleId, slug) => {
        try {
            await incrementArticleViews(articleId);
            navigate(`/info-hub/${slug}`);
        } catch (err) {
            console.error("View count failed, navigating anyway", err);
            navigate(`/info-hub/${slug}`);
        }
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    const popularArticles = useMemo(() => {
        return [...articles].sort((a, b) => b.views - a.views).slice(0, 3);
    }, [articles]);

    if (loading) return <div className={styles.loading}>Loading CoStacked Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.primaryActionBtn}>
                        <Plus size={18} /> <span>Submit Resource</span>
                    </button>
                </div>
                <p className={styles.pageSubtitle}>
                    Curated resources to scale your startup. Templates, guides, and insights.
                </p>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides..." 
                        className={styles.searchInput}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.categoryWrapper}>
                    <div className={styles.categoryBar}>
                        {['All Resources', 'Fundraising', 'Product Development', 'Legal', 'Marketing', 'Hiring'].map(cat => (
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
            </div>

            <main className={styles.mainLayout}>
                <div className={styles.contentArea}>
                    <div className={styles.articlesGrid}>
                        {filteredArticles.slice(0, visibleCount).map((article) => (
                            <article key={article._id} className={styles.card} onClick={() => handleArticleClick(article._id, article.slug)}>
                                <div className={styles.cardImage}>
                                    <img src={article.coverImage} alt="" />
                                </div>
                                <div className={styles.cardInfo}>
                                    <span className={styles.subLabel}>{article.category?.toUpperCase()}</span>
                                    <div className={styles.metaRow}>
                                        <span><Calendar size={14} /> 19 Feb</span>
                                        <span><Eye size={14} /> {article.views || 0}</span>
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
                    {visibleCount < filteredArticles.length && (
                        <button className={`${styles.primaryActionBtn} ${styles.loadMoreBtn}`} onClick={() => setVisibleCount(v => v + 3)}>
                            <Plus size={18} /> Load More Resources
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.sideItemGlow} onClick={() => handleArticleClick(guide._id, guide.slug)}>
                                <div className={styles.sideThumb}>
                                    <img src={guide.coverImage} alt="" />
                                </div>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideSubLabel}>Fundamentals</span>
                                    <h5>{guide.title}</h5>
                                    <div className={styles.sideMeta}>
                                        <span><Eye size={12} /> {guide.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}>Most Popular</h4>
                        {popularArticles.map((pop, i) => (
                            <div key={pop._id} className={styles.popItemGlow} onClick={() => handleArticleClick(pop._id, pop.slug)}>
                                <span className={styles.popNumber}>0{i+1}</span>
                                <div className={styles.popContent}>
                                    <p>{pop.title}</p>
                                    <span className={styles.popViews}>{pop.views || 0} views</span>
                                </div>
                            </div>
                        ))}
                    </section>
                </aside>
            </main>
        </div>
    );
};
