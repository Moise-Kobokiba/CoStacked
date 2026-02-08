import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    getIdeaById, 
    voteIdea, 
    convertIdeaToProject,
    getIdeaComments,
    addIdeaComment,
    deleteIdeaComment
} from '../api/ideasApi';
import { MessageCircle, Trash2, Send } from 'lucide-react';

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

    // Comments state
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

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

    // Fetch comments when on public tab
    useEffect(() => {
        if (activeTab === 'public' && id) {
            fetchComments();
        }
    }, [activeTab, id]);

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const data = await getIdeaComments(id);
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleVote = async (voteType) => {
        if (!user) {
            alert('Please login to vote');
            return;
        }
        try {
            const updatedIdea = await voteIdea(id, voteType, token);
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

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to comment');
            return;
        }
        if (!newComment.trim()) return;

        setPostingComment(true);
        try {
            const comment = await addIdeaComment(id, newComment, token);
            setComments([comment, ...comments]);
            setNewComment('');
            // Update engagement count in idea
            setIdea(prev => ({ ...prev, engagementCount: prev.engagementCount + 1 }));
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert('Failed to post comment');
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        
        try {
            await deleteIdeaComment(id, commentId, token);
            setComments(comments.filter(c => c._id !== commentId));
            // Update engagement count in idea
            setIdea(prev => ({ ...prev, engagementCount: prev.engagementCount - 1 }));
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert('Failed to delete comment');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className={styles.loading}>Loading idea details...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!idea) return <div className={styles.error}>Idea not found</div>;

    const isFounder = user?._id === idea.founder?._id;
    // Check if user has already voted
    const hasUpvoted = user && idea.upvotes && idea.upvotes.includes(user._id);
    const hasDownvoted = user && idea.downvotes && idea.downvotes.includes(user._id);
    const upvoteCount = idea.upvotes?.length || 0;
    const downvoteCount = idea.downvotes?.length || 0;

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
                    <div className={styles.voteContainer}>
                        <button
                            className={`${styles.voteBtn} ${styles.upvoteBtn} ${hasUpvoted ? styles.voted : ''}`}
                            onClick={() => handleVote('up')}
                            disabled={!user}
                            title="Upvote this idea"
                        >
                            ▲
                            <span className={styles.voteCount}>{upvoteCount}</span>
                        </button>
                        
                        <button
                            className={`${styles.voteBtn} ${styles.downvoteBtn} ${hasDownvoted ? styles.voted : ''}`}
                            onClick={() => handleVote('down')}
                            disabled={!user}
                            title="Downvote this idea"
                        >
                            ▼
                            <span className={styles.voteCount}>{downvoteCount}</span>
                        </button>
                    </div>

                    <div className={styles.scoreBadge}>
                        <span className={styles.scoreLabel}>Validation Score</span>
                        <span className={styles.scoreValue}>{idea.validationScore}</span>
                    </div>

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

                        {/* Comments Section */}
                        <section className={styles.commentsSection}>
                            <h2>
                                <MessageCircle size={24} />
                                Market Feedback
                                <span className={styles.commentCount}>{comments.length}</span>
                            </h2>

                            {/* Comment Form */}
                            {user ? (
                                <form onSubmit={handlePostComment} className={styles.commentForm}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Share your thoughts on this idea..."
                                        rows={3}
                                        maxLength={1000}
                                        disabled={postingComment}
                                    />
                                    <div className={styles.commentFormFooter}>
                                        <span className={styles.charCount}>{newComment.length}/1000</span>
                                        <button 
                                            type="submit" 
                                            disabled={!newComment.trim() || postingComment}
                                            className={styles.postCommentBtn}
                                        >
                                            {postingComment ? 'Posting...' : <><Send size={16} /> Post Comment</>}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className={styles.loginPrompt}>
                                    <p>Please <button onClick={() => navigate('/login')} className={styles.loginLink}>login</button> to leave a comment</p>
                                </div>
                            )}

                            {/* Comments List */}
                            <div className={styles.commentsList}>
                                {commentsLoading ? (
                                    <div className={styles.commentsLoading}>Loading comments...</div>
                                ) : comments.length === 0 ? (
                                    <div className={styles.noComments}>
                                        <MessageCircle size={48} />
                                        <p>No comments yet. Be the first to share your feedback!</p>
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment._id} className={styles.comment}>
                                            <div className={styles.commentHeader}>
                                                <div className={styles.commentAuthor}>
                                                    {comment.author?.avatarUrl ? (
                                                        <img 
                                                            src={comment.author.avatarUrl} 
                                                            alt={comment.author.name}
                                                            className={styles.commentAvatar}
                                                        />
                                                    ) : (
                                                        <div className={styles.commentAvatarPlaceholder}>
                                                            {comment.author?.name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    <div className={styles.commentMeta}>
                                                        <span className={styles.commentAuthorName}>
                                                            {comment.author?.name || 'Unknown'}
                                                        </span>
                                                        <span className={styles.commentDate}>
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(user?._id === comment.author?._id || user?.role === 'admin') && (
                                                    <button 
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className={styles.deleteCommentBtn}
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className={styles.commentContent}>{comment.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
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
