// src/pages/InfoHubPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedArticles } from '../api/articlesApi';
import { BookOpen, Users, Rocket, ArrowRight, Layers, Coins, CheckCircle } from 'lucide-react';
import styles from './InfoHubPage.module.css';

const iconMap = {
    'book-open': BookOpen,
    'layers': Layers,
    'coins': Coins,
    'check-circle': CheckCircle,
};

export const InfoHubPage = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await getPublishedArticles();
            setArticles(response.data || []);
        } catch (err) {
            console.error('Error fetching articles:', err);
            setError(err.message || 'Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    const handleArticleClick = (slug) => {
        navigate(`/info-hub/${slug}`);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading articles...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Failed to load articles. Please try again later.</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroIcon}>
                    <BookOpen size={40} />
                </div>
                <h1 className={styles.heroTitle}>Info Hub</h1>
                <p className={styles.heroDescription}>
                    Learn the fundamentals of startup collaboration. Real knowledge for founders and
                    developers building together.
                </p>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statCard}>
                    <Users size={24} />
                    <div>
                        <p className={styles.statLabel}>Founder-First</p>
                        <p className={styles.statDescription}>Built for early-stage teams</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <BookOpen size={24} />
                    <div>
                        <p className={styles.statLabel}>No Jargon</p>
                        <p className={styles.statDescription}>Clear, actionable guides</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Rocket size={24} />
                    <div>
                        <p className={styles.statLabel}>Real Knowledge</p>
                        <p className={styles.statDescription}>From the trenches</p>
                    </div>
                </div>
            </section>

            {/* Articles Section */}
            <section className={styles.articlesSection}>
                <h2 className={styles.sectionTitle}>Guides</h2>
                {articles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} />
                        <p>No articles available yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className={styles.articlesList}>
                        {articles.map((article) => {
                            const IconComponent = iconMap[article.icon] || BookOpen;
                            return (
                                <article
                                    key={article._id}
                                    className={styles.articleCard}
                                    onClick={() => handleArticleClick(article.slug)}
                                >
                                    <div className={styles.articleHeader}>
                                        <div className={styles.articleIcon}>
                                            <IconComponent size={20} />
                                        </div>
                                        <span className={styles.articleCategory}>{article.category}</span>
                                    </div>
                                    <h3 className={styles.articleTitle}>{article.title}</h3>
                                    <p className={styles.articleDescription}>{article.description}</p>
                                    <div className={styles.articleFooter}>
                                        <span className={styles.readTime}>{article.readTime}</span>
                                        <ArrowRight className={styles.articleArrow} size={20} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <h2>Ready to collaborate?</h2>
                <p>Join CoStacked and find your next co-founder, developer, or startup project.</p>
                <button className={styles.ctaButton} onClick={() => navigate('/signup')}>
                    <span>Get Started</span>
                    <Rocket size={18} />
                </button>
            </section>
        </div>
    );
};
