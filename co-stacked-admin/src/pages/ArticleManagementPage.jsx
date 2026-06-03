// src/pages/ArticleManagementPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import { getAllArticles, deleteArticle, togglePublishStatus } from '../api/articleService';
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import styles from './ArticleManagementPage.module.css';

export const ArticleManagementPage = () => {
    const navigate = useNavigate();
    const { setTitle } = usePageTitle();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft

    useEffect(() => {
        setTitle('Article Management');
        fetchArticles();
    }, [setTitle]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await getAllArticles();
            setArticles(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching articles:', err);
            setError(err.message || 'Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                await deleteArticle(id);
                fetchArticles();
            } catch (err) {
                console.error('Error deleting article:', err);
                alert('Failed to delete article');
            }
        }
    };

    const handleTogglePublish = async (id) => {
        try {
            await togglePublishStatus(id);
            fetchArticles();
        } catch (err) {
            console.error('Error toggling publish status:', err);
            alert('Failed to toggle publish status');
        }
    };

    // Filter articles based on search and status
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'published' && article.isPublished) ||
            (filterStatus === 'draft' && !article.isPublished);

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className={styles.loading}>Loading articles...</div>;
    }

    if (error) {
        return <div className={styles.error}>Error: {error}</div>;
    }

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.titleSection}>
                        <BookOpen size={32} />
                        <div>
                            <h1>Article Management</h1>
                            <p>Create and manage Info Hub articles</p>
                        </div>
                    </div>
                    <button
                        className={styles.createButton}
                        onClick={() => navigate('/articles/create')}
                    >
                        <Plus size={20} />
                        Create Article
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.statusFilters}>
                    <button
                        className={filterStatus === 'all' ? styles.activeFilter : ''}
                        onClick={() => setFilterStatus('all')}
                    >
                        All ({articles.length})
                    </button>
                    <button
                        className={filterStatus === 'published' ? styles.activeFilter : ''}
                        onClick={() => setFilterStatus('published')}
                    >
                        Published ({articles.filter(a => a.isPublished).length})
                    </button>
                    <button
                        className={filterStatus === 'draft' ? styles.activeFilter : ''}
                        onClick={() => setFilterStatus('draft')}
                    >
                        Drafts ({articles.filter(a => !a.isPublished).length})
                    </button>
                </div>
            </div>

            {/* Articles Table */}
            {filteredArticles.length === 0 ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h3>No articles found</h3>
                    <p>Get started by creating your first article</p>
                    <button
                        className={styles.createButton}
                        onClick={() => navigate('/articles/create')}
                    >
                        <Plus size={20} />
                        Create Article
                    </button>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.articlesTable}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Read Time</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArticles.map((article) => (
                                <tr key={article._id}>
                                    <td>
                                        <div className={styles.titleCell}>
                                            <strong>{article.title}</strong>
                                            <span className={styles.slug}>{article.slug}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge}>
                                            {article.category}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${article.isPublished ? styles.published : styles.draft}`}>
                                            {article.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>{article.readTime}</td>
                                    <td>{new Date(article.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.iconButton}
                                                onClick={() => navigate(`/articles/edit/${article._id}`)}
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className={`${styles.iconButton} ${article.isPublished ? styles.unpublish : styles.publish}`}
                                                onClick={() => handleTogglePublish(article._id)}
                                                title={article.isPublished ? 'Unpublish' : 'Publish'}
                                            >
                                                {article.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                className={`${styles.iconButton} ${styles.delete}`}
                                                onClick={() => handleDelete(article._id, article.title)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
