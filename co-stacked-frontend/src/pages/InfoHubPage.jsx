import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles } from '../api/articlesApi';
import { 
    Search, Clock, Eye, ArrowRight, 
    TrendingUp, Calendar, Plus, Mail 
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

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    if (loading) return <div className={styles.loading}>Loading Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.submitBtn}>
                        <Plus size={18} /> <span className={styles.btnText}>Submit Resource</span>
                    </button>
                </div>
                <p className={styles.pageSubtitle}>
                    Expertly curated resources to help you scale your startup from zero to one.
                    Templates, guides, and industry insights at your fingertips.
                </p>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides, templates, or articles..." 
                        className={styles.searchInput}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
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

            <main className={styles.mainLayout}>
                <div className={styles.contentArea}>
                    <div className={styles.articlesGrid}>
                        {filteredArticles.slice(0, visibleCount).map((article) => (
                            <article key={article._id} className={styles.card} onClick={() => navigate(`/info-hub/${article.slug}`)}>
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
                                    <div className={styles.readMore}>
                                        Read More <ArrowRight size={16} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {visibleCount < filteredArticles.length && (
                        <button className={styles.loadMore} onClick={() => setVisibleCount(v => v + 3)}>
                            Load More Resources
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.sideItem} onClick={() => navigate(`/info-hub/${guide.slug}`)}>
                                <div className={styles.sideThumb}>
                                    <img src={guide.coverImage} alt="" />
                                </div>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideSubLabel}>Fundamentals</span>
                                    <h5>{guide.title}</h5>
                                    <div className={styles.sideMeta}>
                                        <span><Clock size={14} /> {guide.readTime || '8 min'}</span>
                                        <span><Eye size={14} /> {guide.views || '1.2k'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}>Most Popular</h4>
                        {articles.slice(3, 6).map((pop, i) => (
                            <div key={pop._id} className={styles.popItem} onClick={() => navigate(`/info-hub/${pop.slug}`)}>
                                <span className={styles.popNumber}>0{i+1}</span>
                                <div className={styles.popContent}>
                                    <p>{pop.title}</p>
                                    <span className={styles.popViews}>{pop.views || '1.2k'} views</span>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Newsletter Card from Reference */}
                    <section className={styles.newsletterCard}>
                        <div className={styles.newsHeader}>
                            <div className={styles.newsIcon}><Mail size={20} /></div>
                            <h4>Weekly Founders Insights</h4>
                        </div>
                        <p>Get the best startup resources delivered to your inbox every Monday.</p>
                        <input type="email" placeholder="email@startup.com" className={styles.newsInput} />
                        <button className={styles.newsSubmit}>Subscribe</button>
                    </section>
                </aside>
            </main>
        </div>
    );
};
