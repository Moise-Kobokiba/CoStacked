import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIdeas } from '../api/ideasApi';
import styles from './ValidationBoardPage.module.css';

export const ValidationBoardPage = () => {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active, newest, popular

    useEffect(() => {
        fetchIdeas();
    }, [filter]);

    const fetchIdeas = async () => {
        setLoading(true);
        try {
            // Pass sort param based on filter
            const sort = filter === 'popular' ? 'popular' : 'newest';
            // filter == 'active' is default status in backend
            const data = await getIdeas({ sort });
            setIdeas(data);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerBadge}>
                        <span className={styles.badgeDot}></span>
                        Community Driven
                    </div>
                    <h1 className={styles.title}>Validation Board</h1>
                    <p className={styles.subtitle}>
                        Get real feedback from founders and entrepreneurs before you build.
                    </p>
                </div>
                <Link to="/validation-board/create" className={styles.createBtn}>
                    <svg className={styles.createIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Post an Idea
                </Link>
            </div>

            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Recent
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'popular' ? styles.active : ''}`}
                    onClick={() => setFilter('popular')}
                >
                    Most Popular
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading ideas...</div>
            ) : (
                <div className={styles.grid}>
                    {ideas.length === 0 ? (
                        <div className={styles.empty}>No ideas found. Be the first to post!</div>
                    ) : (
                        ideas.map((idea) => (
                            <Link to={`/validation-board/${idea._id}`} key={idea._id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.industry}>{idea.industry || 'General'}</span>
                                    <span className={styles.score}>
                                        🔥 {idea.validationScore}
                                    </span>
                                </div>
                                <h3>{idea.title}</h3>
                                <p className={styles.problem}>{idea.problemStatement.substring(0, 100)}...</p>

                                <div className={styles.cardFooter}>
                                    <div className={styles.author}>
                                        {idea.founder?.avatarUrl ? (
                                            <img src={idea.founder.avatarUrl} alt="avatar" />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>{idea.founder?.name?.charAt(0) || 'U'}</div>
                                        )}
                                        <span>{idea.founder?.name || 'Anonymous'}</span>
                                    </div>
                                    <div className={styles.stats}>
                                        <span>💬 {idea.engagementCount || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
