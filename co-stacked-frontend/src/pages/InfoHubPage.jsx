import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles, incrementViewCount } from '../api/articlesApi'; // Added API for views
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

    // Logic: Increase view count only on click
    const handleArticleClick = async (article) => {
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

    if (loading) return <div className={styles.loading}>Loading CoStacked Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.primaryBtn}>
                        <Plus size={18} /> <span>Submit Resource</span>
                    </button>
                </div>
                <p className={styles.pageSubtitle}>
                    Expertly curated resources to help you scale your startup from zero to one.
                </p>
            </header>

            <section className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides, templates, or articles..." 
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
                            <article key={article._id} className={styles.card} onClick={() => handleArticleClick(article)}>
                                <div className={styles.cardImage}>
                                    <img src={article.coverImage} alt="" />
                                </div>
                                <div className={styles.cardInfo}>
                                    <span className={styles.subLabel}>{article.category || 'FUNDAMENTALS'}</span>
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
                        <button className={styles.primaryBtn} style={{margin: '3rem auto'}} onClick={() => setVisibleCount(v => v + 3)}>
                            <Plus size={18} /> Load More Resources
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.glowItem} onClick={() => handleArticleClick(guide)}>
                                <div className={styles.sideThumb}><img src={guide.coverImage} alt="" /></div>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideSubLabel}>{guide.category || 'GROWTH'}</span>
                                    <h5>{guide.title}</h5>
                                    <div className={styles.sideMeta}>
                                        <span><Clock size={12} /> {guide.readTime || '5 min'}</span>
                                        <span><Eye size={12} /> {guide.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.newsletterCard}>
                        <div className={styles.newsHeader}>
                            <Mail size={20} /> <h4>Weekly Founders Insights</h4>
                        </div>
                        <p>The best startup resources delivered every Monday.</p>
                        <input type="email" placeholder="email@startup.com" className={styles.newsInput} />
                        <button className={styles.newsSubmit}>Subscribe</button>
                    </section>
                </aside>
            </main>
        </div>
    );
};
