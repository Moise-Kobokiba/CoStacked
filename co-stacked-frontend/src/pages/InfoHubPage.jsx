import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles, incrementArticleView } from '../api/articlesApi'; 
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

    const handleArticleClick = async (article) => {
        try {
            await incrementArticleView(article._id); 
        } catch (err) {
            console.error("View increment failed:", err);
        }
        navigate(`/info-hub/${article.slug}`);
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All Resources' || article.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchQuery, activeCategory]);

    const popularArticles = useMemo(() => {
        return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    }, [articles]);

    if (loading) return <div className={styles.loading}>Preparing Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.primaryBtn}>
                        <Plus size={18} /> <span className={styles.btnText}>Submit Resource</span>
                    </button>
                </div>
                <p className={styles.pageSubtitle}>Expertly curated resources to help you scale your startup.</p>
            </header>

            <section className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input 
                        type="text" 
                        placeholder="Search for guides..." 
                        className={styles.searchInput}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.categoryBar}>
                    {['All Resources', 'Fundraising', 'Product Development', 'Legal', 'Marketing'].map(cat => (
                        <button 
                            key={cat}
                            className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            <main className={styles.mainLayout}>
                <div className={styles.contentArea}>
                    <div className={styles.articlesGrid}>
                        {filteredArticles.slice(0, visibleCount).map((article) => (
                            <article key={article._id} className={styles.card} onClick={() => handleArticleClick(article)}>
                                <div className={styles.cardImage}><img src={article.coverImage} alt="" /></div>
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
                        <div className={styles.loadMoreWrapper}>
                            <button className={styles.primaryBtn} onClick={() => setVisibleCount(v => v + 3)}>
                                <Plus size={18} /> Load More Resources
                            </button>
                        </div>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.sideItem} onClick={() => handleArticleClick(guide)}>
                                <div className={styles.sideThumb}><img src={guide.coverImage} alt="" /></div>
                                <div className={styles.sideContent}>
                                    <h5>{guide.title}</h5>
                                    <span className={styles.sideMeta}><Eye size={12} /> {guide.views || 0} views</span>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><Zap size={18} /> Most Popular</h4>
                        {popularArticles.map((pop, i) => (
                            <div key={pop._id} className={styles.popItem} onClick={() => handleArticleClick(pop)}>
                                <span className={styles.popNumber}>0{i+1}</span>
                                <p>{pop.title}</p>
                            </div>
                        ))}
                    </section>
                </aside>
            </main>
        </div>
    );
};
