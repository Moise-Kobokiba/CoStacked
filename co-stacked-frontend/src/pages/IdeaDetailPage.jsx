import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getIdeaById, voteIdea, convertIdeaToProject } from '../api/ideasApi';

import styles from './IdeaDetailPage.module.css';

export const IdeaDetailPage = () => {
    const { id } = useParams();
    const { user, token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [converting, setConverting] = useState(false);

    // Tab state: 'public' or 'private'
    const [activeTab, setActiveTab] = useState('public');

    useEffect(() => {
        const fetchIdea = async () => {
            try {
                const data = await getIdeaById(id, token);
                setIdea(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load idea');
            } finally {
                setLoading(false);
            }
        };
        fetchIdea();
    }, [id, token]);

    const handleVote = async () => {
        if (!user) {
            alert('Please login to vote');
            return;
        }
        try {
            const updatedIdea = await voteIdea(id, token);
            setIdea(updatedIdea); // Update the local state with new vote count
        } catch (err) {
            console.error('Vote failed', err);
            alert('Failed to register vote');
        }
    };

    const handleConvert = async () => {
        if (!window.confirm('Are you sure you want to convert this idea to a Live Project? This will create a new Project entry.')) {
            return;
        }
        setConverting(true);
        try {
            const response = await convertIdeaToProject(id, token);
            alert('Success! Redirecting to your new project...');
            navigate(`/projects/${response.projectId}`); // Assuming this route exists
        } catch (err) {
            console.error(err);
            alert('Conversion failed: ' + (err.response?.data?.message || 'Unknown error'));
        } finally {
            setConverting(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading idea details...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!idea) return <div className={styles.error}>Idea not found</div>;

    const isFounder = user?._id === idea.founder?._id;
    // Check if user has already voted
    const hasVoted = user && idea.votes && idea.votes.includes(user._id);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <span className={styles.stageTag}>{idea.stage}</span>
                    <h1>{idea.title}</h1>
                    <div className={styles.meta}>
                        <span className={styles.author}>By {idea.founder?.name || 'Unknown'}</span>
                        <span className={styles.date}>Posted on {new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className={styles.actionSection}>
                    <div className={styles.scoreBadge}>
                        <span className={styles.scoreLabel}>Validation Score</span>
                        <span className={styles.scoreValue}>{idea.validationScore}</span>
                    </div>

                    <button
                        className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''}`}
                        onClick={handleVote}
                        disabled={!user}
                    >
                        {hasVoted ? '✓ Supported' : '▲ Upvote Idea'}
                    </button>

                    {isFounder && idea.status !== 'converted' && (
                        <button
                            className={styles.convertBtn}
                            onClick={handleConvert}
                            disabled={converting || idea.validationScore < 10} // Simple threshold e.g. 10
                            title={idea.validationScore < 10 ? 'Need more validation (10 score) to convert' : ''}
                        >
                            {converting ? 'Converting...' : 'Convert to Project'}
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'public' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('public')}
                >
                    Public Validation
                </button>
                {(isFounder || idea.visibility === 'public') && ( // Logic for private can be extended
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'private' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('private')}
                    >
                        Private Strategy
                    </button>
                )}
            </div>

            <div className={styles.content}>
                {activeTab === 'public' ? (
                    <div className={styles.publicContent}>
                        <section className={styles.section}>
                            <h2>The Problem</h2>
                            <p>{idea.problemStatement}</p>
                        </section>
                        <section className={styles.section}>
                            <h2>Value Proposition</h2>
                            <p>{idea.valueProposition}</p>
                        </section>
                        <section className={styles.section}>
                            <h2>Target Audience</h2>
                            <p>{idea.targetAudience}</p>
                        </section>

                        {/* Placeholder for engagement/comments */}
                        <div className={styles.placeholderSection}>
                            <h3>Market Feedback</h3>
                            <p className={styles.hint}>Comments and Polls coming soon...</p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.privateContent}>
                        {/* Only visible if allowed */}
                        <div className={styles.alert}>
                            🔒 This section contains sensitive strategic details.
                        </div>
                        <div className={styles.grid}>
                            <div className={styles.card}>
                                <h3>Monetization Model</h3>
                                <p>{idea.monetizationModel || 'Not specified'}</p>
                            </div>
                            <div className={styles.card}>
                                <h3>Key Risks</h3>
                                <p>{idea.risks || 'Not specified'}</p>
                            </div>
                            <div className={styles.card}>
                                <h3>Core Assumptions</h3>
                                <p>{idea.assumptions || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
