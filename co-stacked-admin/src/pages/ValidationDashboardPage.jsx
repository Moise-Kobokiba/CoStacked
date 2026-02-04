import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './ValidationDashboardPage.module.css'; // Reusing existing dashboard styles if possible or creating new
import { Eye, Trash2, ArrowUpRight } from 'lucide-react';

export const ValidationDashboardPage = () => {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch ideas directly from backend 
    // In a real app we'd have a specific admin endpoint or use the public one with admin token
    // For now assuming public endpoint relies on token for visibility, but allow admin to see all if implemented
    const fetchIdeas = async () => {
        try {
            // Using the same endpoint as frontend but maybe we filter differently?
            // Assuming admin token is attached by interceptor if configured, or we pass it manually
            // For MVP, just fetching all active/public ideas
            const token = localStorage.getItem('adminToken'); // Assuming admin uses a token stored here
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const response = await axios.get('http://localhost:5001/api/ideas', config);
            setIdeas(response.data);
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
            const token = localStorage.getItem('adminToken');
            await axios.delete(`http://localhost:5001/api/ideas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
                                                onClick={() => window.open(`http://localhost:5173/validation-board/${idea._id}`, '_blank')}
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
