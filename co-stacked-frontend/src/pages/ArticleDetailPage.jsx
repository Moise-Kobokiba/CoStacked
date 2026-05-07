// src/pages/ArticleDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleBySlug, trackArticleView } from '../api/articlesApi';
import { ArrowLeft, Clock, Tag, FileText, Link, ExternalLink, Download, Eye } from 'lucide-react';
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
            
            // Track view after article is loaded
            try {
                await trackArticleView(slug);
            } catch (vErr) {
                console.warn('Failed to track view:', vErr);
            }
        } catch (err) {
            console.error('Error fetching article:', err);
            setError(err.message || 'Article not found');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
                    {article.coverImage && (
                        <div className={styles.coverImageContainer}>
                            <img 
                                src={article.coverImage} 
                                alt={article.title}
                                className={styles.coverImage}
                            />
                        </div>
                    )}
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
                            <span className={styles.views}>
                                <Eye size={14} />
                                {article.views || 0} views
                            </span>
                        </div>
                        <h1 className={styles.articleTitle}>{article.title}</h1>
                        <p className={styles.articleDescription}>{article.description}</p>
                    </header>

                    <div className={styles.articleContent}>
                        {article.content?.map((block, index) => renderContentBlock(block, index))}
                    </div>
                </article>

                {/* Resources Section */}
                {article.resources && article.resources.length > 0 && (
                    <div className={styles.resourcesSection}>
                        <h2 className={styles.resourcesTitle}>
                            <FileText size={24} />
                            Resources & References
                        </h2>
                        <div className={styles.resourcesList}>
                            {article.resources.map((resource, index) => (
                                <div key={index} className={styles.resourceCard}>
                                    <div className={styles.resourceIcon}>
                                        {resource.type === 'link' ? (
                                            <Link size={20} />
                                        ) : (
                                            <FileText size={20} />
                                        )}
                                    </div>
                                    <div className={styles.resourceContent}>
                                        <h3 className={styles.resourceName}>{resource.title}</h3>
                                        {resource.description && (
                                            <p className={styles.resourceDesc}>{resource.description}</p>
                                        )}
                                        {resource.type === 'file' && resource.fileSize && (
                                            <span className={styles.resourceSize}>
                                                {formatFileSize(resource.fileSize)}
                                            </span>
                                        )}
                                    </div>
                                    {resource.type === 'link' ? (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.resourceAction}
                                        >
                                            <ExternalLink size={18} />
                                            Open
                                        </a>
                                    ) : (
                                        <a
                                            href={resource.fileUrl}
                                            download={resource.fileName}
                                            className={styles.resourceAction}
                                        >
                                            <Download size={18} />
                                            Download
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.ctaBox}>
                    <h3>Ready to start your project?</h3>
                    <p>Join CoStacked and connect with developers and founders.</p>
                    <button onClick={() => navigate('/signup')} className={styles.ctaButton}>
                        Get Started
                    </button>
                </div>

                {/* Structured Data for AI */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        "headline": article.title,
                        "description": article.description,
                        "articleSection": article.category,
                        "author": {
                            "@type": "Person",
                            "name": article.author?.name || "CoStacked Team"
                        },
                        "datePublished": article.createdAt,
                        "image": article.coverImage,
                        "publisher": {
                            "@type": "Organization",
                            "name": "CoStacked",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://www.costacked.co.za/android-chrome-512x512.png"
                            }
                        }
                    })}
                </script>
            </div>
        </div>
    );
};
