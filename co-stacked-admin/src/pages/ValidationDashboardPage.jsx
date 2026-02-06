import { useEffect, useState } from 'react';
import API from '../api/axios'; // Use the configured axios instance
import styles from './ValidationDashboardPage.module.css'; // Reusing existing dashboard styles if possible or creating new
import { Eye, Trash2, ArrowUpRight } from 'lucide-react';

export const ValidationDashboardPage = () => {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch ideas directly from backend 
    // Using the configured API instance which handles baseURL and auth automatically
    const fetchIdeas = async () => {
        try {
            const response = await API.get('/ideas');
            setIdeas(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIdeas();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this idea?')) return;
        try {
            await API.delete(`/ideas/${id}`);
            setIdeas(ideas.filter(idea => idea._id !== id));
        } catch (error) {
            console.error('Error deleting idea:', error);
            alert('Failed to delete idea');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Validation Board Management</h1>
                <p>Monitor and moderate validation board ideas.</p>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Founder</th>
                                <th>Score</th>
                                <th>Stage</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ideas.map((idea) => (
                                <tr key={idea._id}>
                                    <td>
                                        <div className={styles.ideaTitle}>{idea.title}</div>
                                        <div className={styles.ideaIndustry}>{idea.industry}</div>
                                    </td>
                                    <td>
                                        <div className={styles.userCell}>
                                            {idea.founder?.avatarUrl && <img src={idea.founder.avatarUrl} alt="" className={styles.avatar} />}
                                            <span>{idea.founder?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.scoreBadge}>{idea.validationScore}</div>
                                    </td>
                                    <td>{idea.stage}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[idea.status]}`}>
                                            {idea.status}
                                        </span>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
