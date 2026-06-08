import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Search, X, Loader2 } from 'lucide-react';
import API from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import styles from './ValidationDashboardPage.module.css';

export const ValidationDashboardPage = () => {
    const [ideas, setIdeas]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [isFetching, setIsFetching] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const fetchIdeas = async (searchTerm = '') => {
        setIsFetching(true);
        try {
            const response = await API.get(`/ideas?search=${encodeURIComponent(searchTerm)}`);
            setIdeas(response.data);
        } catch (error) {
            console.error('Error fetching validation ideas:', error);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchIdeas(debouncedSearch);
    }, [debouncedSearch]);


    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this validation idea?')) return;
        try {
            await API.delete(`/ideas/${id}`);
            setIdeas(ideas.filter(idea => idea._id !== id));
        } catch (error) {
            console.error('Error deleting validation idea:', error);
            alert('Failed to delete validation idea');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Validation Board Management</h1>
                <p>Monitor and moderate validation board ideas.</p>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchIcon}>
                        {isFetching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </div>
                    <input 
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by title, description or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className={styles.clearSearch} onClick={() => setSearch('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className={styles.stats}>
                    Total Ideas: {ideas.length}
                </div>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader2 size={40} className="animate-spin" />
                    <p>Loading validation board...</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Idea / Title</th>
                                <th>Author</th>
                                <th>Confidence</th>
                                <th>Phase</th>
                                <th>Engagements</th>
                                <th>Posted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ideas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        No ideas found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                ideas.map((idea) => (
                                    <tr key={idea._id}>
                                        <td>
                                            <div className={styles.ideaTitle}>{idea.title}</div>
                                            <div className={styles.ideaIndustry}>
                                                {idea.tags && idea.tags.length > 0 ? idea.tags.join(', ') : idea.industry || 'No tags'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.userCell}>
                                                {idea.founder?.avatarUrl ? (
                                                    <img src={idea.founder.avatarUrl} alt="" className={styles.avatar} />
                                                ) : (
                                                    <div className={styles.avatarPlaceholder}>
                                                        {idea.founder?.name?.slice(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                )}
                                                <span>{idea.founder?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.scoreBadge}>{idea.validationScore ?? 0}%</div>
                                        </td>
                                        <td>{idea.stage || 'Unknown'}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {(idea.upvotes?.length ?? 0)} Upvotes • {(idea.engagementCount ?? 0)} Engagements
                                            </div>
                                        </td>
                                        <td>{new Date(idea.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => window.open(`${window.location.origin}/validation-board/${idea._id}`, '_blank')}
                                                    title="View Public Page"
                                                    className={styles.actionBtn}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(idea._id)}
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};
