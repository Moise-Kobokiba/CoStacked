import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles } from '../api/articlesApi';
import { 
    Search, Clock, Eye, ArrowRight, 
    TrendingUp, Calendar, Plus 
} from 'lucide-react';
import styles from './InfoHubPage.module.css';

export const InfoHubPage = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Resources');
    const [visibleCount, setVisibleCount] = useState(4);
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

    const handleSubmitResource = () => {
        window.location.href = `mailto:collab@costacked.co.za?subject=Resource Submission`;
    };

    if (loading) return <div className={styles.loading}>Loading Resources...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.pageTitle}>Info Hub</h1>
                    <button className={styles.submitBtn} onClick={handleSubmitResource}>
                        <Plus size={18} /> <span className={styles.btnText}>Submit Resource</span>
                    </button>
                    <p className={styles.pageSubtitle}>
                        Expertly curated resources to help you scale your startup from zero to one.
                        Templates, guides, and industry insights at your fingertips.
                    </p>
                </div>
            </header>

            <div className={styles.controlsSection}>
                <div className={styles.searchWrapper}>
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

            <main className={styles.mainContent}>
                <div className={styles.leftCol}>
                    <div className={styles.articlesGrid}>
                        {filteredArticles.slice(0, visibleCount).map((article) => (
                            <article key={article._id} className={styles.articleCard} onClick={() => navigate(`/info-hub/${article.slug}`)}>
                                <div className={styles.imageContainer}>
                                    <img src={article.coverImage} alt="" />
                                </div>
                                <div className={styles.cardBody}>
                                    <span className={styles.articleSubLabel}>Fundamentals</span>
                                    <div className={styles.cardMeta}>
                                        <span><Calendar size={14} /> 19 Feb</span>
                                        <span><Eye size={14} /> {article.views || '0'} views</span>
                                    </div>
                                    <h3>{article.title}</h3>
                                    <p>{article.description}</p>
                                    <div className={styles.cardLink}>Read More <ArrowRight size={16} /></div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {visibleCount < filteredArticles.length && (
                        <button className={styles.loadMoreBtn} onClick={() => setVisibleCount(v => v + 4)}>
                            Load More Resources
                        </button>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideHeading}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.sideArticle} onClick={() => navigate(`/info-hub/${guide.slug}`)}>
                                <span className={styles.sideSubLabel}>Fundamentals</span>
                                <h5>{guide.title}</h5>
                                <div className={styles.sideMeta}>
                                    <span><Clock size={14} /> {guide.readTime || '8 min read'}</span>
                                    <span><Eye size={14} /> {guide.views || '1.2k'} views</span>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideHeading}>Most Popular</h4>
                        {articles.slice(3, 6).map((pop, i) => (
                            <div key={pop._id} className={styles.popItem} onClick={() => navigate(`/info-hub/${pop.slug}`)}>
                                <span className={styles.popIndex}>0{i+1}</span>
                                <p>{pop.title}</p>
                            </div>
                        ))}
                    </section>
                </aside>
            </main>
        </div>
    );
};
