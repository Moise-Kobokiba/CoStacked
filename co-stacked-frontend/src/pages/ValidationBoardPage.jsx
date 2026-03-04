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
            const sort = filter === 'popular' ? 'popular' : 'newest';
            const data = await getIdeas({ sort });

            // Enhance ideas with placeholder tags and likes to match the design
            const enhanced = data.map(idea => ({
                ...idea,
                likes: idea.likes || Math.floor(idea.validationScore / 2) + 5,
                tags: idea.tags || (idea.industry ? [idea.industry] : ['SaaS']),
                phase: idea.phase || 'PROBLEM PHASE', // default phase if missing
            }));

            setIdeas(enhanced);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Validation Board</h1>
                    <p className={styles.subtitle}>
                        Validate your ideas with the community and build something people want. Get feedback from experienced builders.
                    </p>
                </div>
                <Link to="/validation-board/create" className={styles.createBtn}>
                    <span className={styles.plusIcon}>+</span> Post Your Idea
                </Link>
            </div>

            {/* Main Content + Sidebar */}
            <div className={styles.mainLayout}>
                <div className={styles.contentColumn}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        {['All Ideas', 'Problem Validation', 'Solution Validation', 'MVP/Landing Page', 'My Posts'].map(tab => (
                            <button
                                key={tab}
                                className={`${styles.tabBtn} ${tab === 'All Ideas' ? styles.tabActive : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Cards Grid */}
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
                                            <span className={styles.phaseBadge}>{idea.phase}</span>
                                            <div className={styles.confidence}>
                                                <span className={styles.confValue}>{idea.validationScore}%</span>
                                                <span className={styles.confLabel}>CONFIDENCE</span>
                                            </div>
                                        </div>

                                        <h3 className={styles.cardTitle}>{idea.title}</h3>
                                        <p className={styles.description}>
                                            {idea.problemStatement.substring(0, 120)}...
                                        </p>

                                        <div className={styles.tagList}>
                                            {idea.tags.map(tag => (
                                                <span key={tag} className={styles.tag}>{tag}</span>
                                            ))}
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.author}>
                                                <img
                                                    src={idea.founder?.avatarUrl || '/default-avatar.png'}
                                                    alt="avatar"
                                                />
                                                <span className={styles.authorName}>
                                                    {idea.founder?.name || 'Anonymous'}
                                                </span>
                                            </div>
                                            <div className={styles.cardStats}>
                                                <span>👍 {idea.likes}</span>
                                                <span>💬 {idea.engagementCount || 0}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarCard}>
                        <h4>COMMUNITY STATS</h4>
                        <div className={styles.statLarge}>1,240</div>
                        <p>Total Ideas Validated</p>
                        <div className={styles.progressBar}>
                            <div style={{ width: '75%' }}></div>
                        </div>
                        <p className={styles.sidebarFooter}>Join 5,000+ founders active this month.</p>
                    </div>

                    <div className={styles.tipsCard}>
                        <h4>💡 VALIDATION TIPS</h4>
                        <ol>
                            <li><strong>Define your ICP.</strong> Be specific about who has the problem.</li>
                            <li><strong>Ask open questions.</strong> Don't lead the witness.</li>
                            <li><strong>Iterate quickly.</strong> If people aren’t excited, tweak the pitch and repost.</li>
                        </ol>
                        <a href="#">Read full guide →</a>
                    </div>
                </aside>
            </div>
        </div>
    );
};