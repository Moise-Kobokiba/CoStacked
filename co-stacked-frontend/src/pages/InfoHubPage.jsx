import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles, incrementViewCount } from '../api/articlesApi'; 
import { Search, Clock, Eye, ArrowRight, TrendingUp, Calendar, Plus, Mail, Zap } from 'lucide-react';
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

    // Increments view only on click
    const handleArticleNavigation = async (article) => {
        try {
            await incrementViewCount(article._id);
            navigate(`/info-hub/${article.slug}`);
        } catch (err) {
            navigate(`/info-hub/${article.slug}`);
        }
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    // Dynamic "Most Popular" sorting
    const popularArticles = useMemo(() => {
        return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    }, [articles]);

    if (loading) return <div className={styles.loading}>Syncing CoStacked Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.mainActionBtn}>
                        <Plus size={18} /> <span>Submit Resource</span>
                    </button>
                </div>
                <p className={styles.pageSubtitle}>
                    Expertly curated resources to scale your startup from zero to one.
                </p>
            </header>

            <section className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides, templates..." 
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
            </section>

            <main className={styles.mainLayout}>
                <div className={styles.contentArea}>
                    <div className={styles.articlesGrid}>
                        {filteredArticles.slice(0, visibleCount).map((article) => (
                            <article key={article._id} className={styles.card} onClick={() => handleArticleNavigation(article)}>
                                <div className={styles.cardImage}>
                                    <img src={article.coverImage} alt="" />
                                </div>
                                <div className={styles.cardInfo}>
                                    <span className={styles.subLabel}>{article.category?.toUpperCase() || 'FUNDAMENTALS'}</span>
                                    <div className={styles.metaRow}>
                                        <span><Calendar size={14} /> 19 Feb</span>
                                        <span><Eye size={14} /> {article.views || 0} views</span>
                                    </div>
                                    <h3>{article.title}</h3>
                                    <p>{article.description}</p>
                                    <div className={styles.readMore}>Read More <ArrowRight size={16} /></div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {visibleCount < filteredArticles.length && (
                        <button className={`${styles.mainActionBtn} ${styles.loadMoreCenter}`} onClick={() => setVisibleCount(v => v + 3)}>
                            <Plus size={18} /> <span>Load More Resources</span>
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.interactiveGlow} onClick={() => handleArticleNavigation(guide)}>
                                <div className={styles.sideThumb}><img src={guide.coverImage} alt="" /></div>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideSubLabel}>{guide.category || 'Fundamentals'}</span>
                                    <h5>{guide.title}</h5>
                                    <div className={styles.sideMeta}>
                                        <span><Eye size={12} /> {guide.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><Zap size={18} /> Most Popular</h4>
                        {popularArticles.map((pop, index) => (
                            <div key={pop._id} className={styles.popItem} onClick={() => handleArticleNavigation(pop)}>
                                <span className={styles.popRank}>0{index + 1}</span>
                                <div className={styles.popContent}>
                                    <h5>{pop.title}</h5>
                                </div>
                            </div>
                        ))}
                    </section>
                </aside>
            </main>
        </div>
    );
};
