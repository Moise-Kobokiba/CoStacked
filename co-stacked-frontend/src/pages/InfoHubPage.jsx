import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles, incrementArticleView } from '../api/articlesApi'; 
import { Search, Eye, ArrowRight, TrendingUp, Calendar, Plus, Zap, Share2, Mail, Clock } from 'lucide-react';
import styles from './InfoHubPage.module.css';

const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonInfo}>
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonLineLong} />
        </div>
    </div>
);

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
            // Increment view only when actually viewed
            await incrementArticleView(article._id); 
        } catch (err) {
            console.error("View count increment failed", err);
        }
        navigate(`/info-hub/${article.slug}`);
    };

    const handleShare = (e, article) => {
        e.stopPropagation();
        const url = `${window.location.origin}/info-hub/${article.slug}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.titleArea}>
                        <h1 className={styles.pageTitle}>Info Hub</h1>
                        <p className={styles.pageSubtitle}>Curated resources to scale your startup from zero to one.</p>
                    </div>
                    <button className={styles.mainActionBtn}>
                        <Plus size={18} /> <span>Submit Resource</span>
                    </button>
                </div>
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
                        {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : 
                            filteredArticles.slice(0, visibleCount).map((article) => (
                                <article key={article._id} className={styles.card} onClick={() => handleArticleClick(article)}>
                                    <div className={styles.cardImage}>
                                        <img src={article.coverImage} alt="" />
                                        <span className={styles.categoryBadge}>{article.category?.toUpperCase() || 'GUIDE'}</span>
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.metaRow}>
                                            <span><Calendar size={14} /> 19 Feb</span>
                                            <span><Eye size={14} /> {article.views || 0} views</span>
                                        </div>
                                        <h3 className={styles.cardTitle}>{article.title}</h3>
                                        <p className={styles.cardDesc}>{article.description}</p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.readMore}>Read More <ArrowRight size={16} /></span>
                                            <button className={styles.shareBtn} onClick={(e) => handleShare(e, article)}>
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))
                        }
                    </div>
                    {!loading && visibleCount < filteredArticles.length && (
                        <div className={styles.loadMoreWrapper}>
                            <button className={styles.mainActionBtn} onClick={() => setVisibleCount(v => v + 3)}>
                                <Plus size={18} /> Load More Resources
                            </button>
                        </div>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><TrendingUp size={18} /> Featured Guides</h4>
                        {articles.slice(0, 3).map(guide => (
                            <div key={guide._id} className={styles.sideGlowItem} onClick={() => handleArticleClick(guide)}>
                                <div className={styles.sideContent}>
                                    <span className={styles.sideTag}>{guide.category?.toUpperCase() || 'STRATEGY'}</span>
                                    <h5>{guide.title}</h5>
                                    <span className={styles.sideMeta}><Clock size={12} /> 8 min read</span>
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className={styles.sideSection}>
                        <h4 className={styles.sideTitle}><Zap size={18} /> Most Popular</h4>
                        {popularArticles.map((pop, i) => (
                            <div key={pop._id} className={styles.popGlowItem} onClick={() => handleArticleClick(pop)}>
                                <span className={styles.popNumber}>0{i+1}</span>
                                <p>{pop.title}</p>
                            </div>
                        ))}
                    </section>

                    <section className={styles.newsletterCard}>
                        <Mail className={styles.newsIcon} size={32} />
                        <h4>Weekly Founders Insights</h4>
                        <p>The best startup resources delivered every Monday.</p>
                        <input type="email" placeholder="email@startup.com" className={styles.newsInput} />
                        <button className={styles.newsBtn}>Subscribe</button>
                    </section>
                </aside>
            </main>
        </div>
    );
};
