// src/pages/ArticleDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleBySlug } from '../api/articlesApi';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import styles from './ArticleDetailPage.module.css';

export const ArticleDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticle();
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await getArticleBySlug(slug);
            setArticle(response.data);
        } catch (err) {
            console.error('Error fetching article:', err);
            setError(err.message || 'Article not found');
        } finally {
            setLoading(false);
        }
    };

    const renderContentBlock = (block, index) => {
        switch (block.type) {
            case 'paragraph':
                return <p key={index} className={styles.paragraph}>{block.content}</p>;

            case 'heading':
                return <h3 key={index} className={styles.heading}>{block.content}</h3>;

            case 'list':
                return (
                    <ul key={index} className={styles.list}>
                        {block.items?.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                );

            case 'callout':
                return (
                    <div key={index} className={`${styles.callout} ${styles[block.variant || 'info']}`}>
                        <p>{block.content}</p>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading article...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>Article not found</p>
                    <button onClick={() => navigate('/info-hub')} className={styles.backButton}>
                        Back to Info Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.articleWrapper}>
                <button className={styles.backButton} onClick={() => navigate('/info-hub')}>
                    <ArrowLeft size={18} />
                    Back to Info Hub
                </button>

                <article className={styles.article}>
                    <header className={styles.articleHeader}>
                        <div className={styles.articleMeta}>
                            <span className={styles.category}>
                                <Tag size={14} />
                                {article.category}
                            </span>
                            <span className={styles.readTime}>
                                <Clock size={14} />
                                {article.readTime}
                            </span>
                        </div>
                        <h1 className={styles.articleTitle}>{article.title}</h1>
                        <p className={styles.articleDescription}>{article.description}</p>
                    </header>

                    <div className={styles.articleContent}>
                        {article.content?.map((block, index) => renderContentBlock(block, index))}
                    </div>
                </article>

                <div className={styles.ctaBox}>
                    <h3>Ready to start your project?</h3>
                    <p>Join CoStacked and connect with developers and founders.</p>
                    <button onClick={() => navigate('/signup')} className={styles.ctaButton}>
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};
