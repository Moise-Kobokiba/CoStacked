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
import { MessageCircle, Trash2, Send, Reply, Share2, Copy, Check, X, ArrowLeft } from 'lucide-react';

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
    
    // Reply state
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [postingReply, setPostingReply] = useState(false);

    // Share state
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

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
            const commentWithReplies = { ...comment, replies: [] };
            setComments([commentWithReplies, ...comments]);
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

    const handlePostReply = async (parentCommentId) => {
        if (!user) {
            alert('Please login to reply');
            return;
        }
        if (!replyContent.trim()) return;

        setPostingReply(true);
        try {
            const reply = await addIdeaComment(id, replyContent, token, parentCommentId);
            
            // Update comments state with new reply
            setComments(comments.map(comment => {
                if (comment._id === parentCommentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), reply]
                    };
                }
                return comment;
            }));
            
            setReplyContent('');
            setReplyingTo(null);
            // Update engagement count in idea
            setIdea(prev => ({ ...prev, engagementCount: prev.engagementCount + 1 }));
        } catch (err) {
            console.error('Failed to post reply:', err);
            alert('Failed to post reply');
        } finally {
            setPostingReply(false);
        }
    };

    const handleDeleteComment = async (commentId, parentCommentId = null) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        
        try {
            await deleteIdeaComment(id, commentId, token);
            
            if (parentCommentId) {
                // Delete a reply
                setComments(comments.map(comment => {
                    if (comment._id === parentCommentId) {
                        return {
                            ...comment,
                            replies: comment.replies.filter(r => r._id !== commentId)
                        };
                    }
                    return comment;
                }));
            } else {
                // Delete a top-level comment
                setComments(comments.filter(c => c._id !== commentId));
            }
            
            // Update engagement count in idea
            setIdea(prev => ({ ...prev, engagementCount: prev.engagementCount - 1 }));
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert('Failed to delete comment');
        }
    };

    const toggleReplyForm = (commentId) => {
        if (replyingTo === commentId) {
            setReplyingTo(null);
            setReplyContent('');
        } else {
            setReplyingTo(commentId);
            setReplyContent('');
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
            <button className={styles.backButton} onClick={() => navigate('/validation-board')}>
                <ArrowLeft size={18} />
                Back to Validation Board
            </button>
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
                            <span className={styles.voteArrow}>▲</span>
                            <span className={styles.voteLabel}>Upvote</span>
                            <span className={styles.voteCount}>{upvoteCount}</span>
                        </button>
                        
                        <button
                            className={`${styles.voteBtn} ${styles.downvoteBtn} ${hasDownvoted ? styles.voted : ''}`}
                            onClick={() => handleVote('down')}
                            disabled={!user}
                            title="Downvote this idea"
                        >
                            <span className={styles.voteArrow}>▼</span>
                            <span className={styles.voteLabel}>Downvote</span>
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

                    {/* Share Button */}
                    <button
                        className={styles.shareBtn}
                        onClick={() => setShowShareModal(true)}
                        title="Share this idea"
                    >
                        <Share2 size={18} />
                        Share Idea
                    </button>
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
                                                <div className={styles.commentActions}>
                                                    {user && (
                                                        <button 
                                                            onClick={() => toggleReplyForm(comment._id)}
                                                            className={`${styles.replyBtn} ${replyingTo === comment._id ? styles.replying : ''}`}
                                                            title="Reply to this comment"
                                                        >
                                                            <Reply size={16} />
                                                            Reply
                                                        </button>
                                                    )}
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
                                            </div>
                                            <p className={styles.commentContent}>{comment.content}</p>
                                            
                                            {/* Reply Form */}
                                            {replyingTo === comment._id && (
                                                <div className={styles.replyForm}>
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder={`Reply to ${comment.author?.name || 'Unknown'}...`}
                                                        rows={2}
                                                        maxLength={1000}
                                                        disabled={postingReply}
                                                        autoFocus
                                                    />
                                                    <div className={styles.replyFormFooter}>
                                                        <span className={styles.charCount}>{replyContent.length}/1000</span>
                                                        <div className={styles.replyFormButtons}>
                                                            <button 
                                                                onClick={() => toggleReplyForm(comment._id)}
                                                                className={styles.cancelReplyBtn}
                                                                disabled={postingReply}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={() => handlePostReply(comment._id)}
                                                                disabled={!replyContent.trim() || postingReply}
                                                                className={styles.postReplyBtn}
                                                            >
                                                                {postingReply ? 'Posting...' : <><Send size={14} /> Post Reply</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className={styles.repliesContainer}>
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply._id} className={styles.reply}>
                                                            <div className={styles.commentHeader}>
                                                                <div className={styles.commentAuthor}>
                                                                    {reply.author?.avatarUrl ? (
                                                                        <img 
                                                                            src={reply.author.avatarUrl} 
                                                                            alt={reply.author.name}
                                                                            className={styles.replyAvatar}
                                                                        />
                                                                    ) : (
                                                                        <div className={styles.replyAvatarPlaceholder}>
                                                                            {reply.author?.name?.charAt(0) || 'U'}
                                                                        </div>
                                                                    )}
                                                                    <div className={styles.commentMeta}>
                                                                        <span className={styles.commentAuthorName}>
                                                                            {reply.author?.name || 'Unknown'}
                                                                        </span>
                                                                        <span className={styles.commentDate}>
                                                                            {formatDate(reply.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {(user?._id === reply.author?._id || user?.role === 'admin') && (
                                                                    <button 
                                                                        onClick={() => handleDeleteComment(reply._id, comment._id)}
                                                                        className={styles.deleteCommentBtn}
                                                                        title="Delete reply"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className={styles.replyContent}>{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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

            {/* Share Modal */}
            {showShareModal && (
                <div className={styles.shareModalOverlay} onClick={() => setShowShareModal(false)}>
                    <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.shareModalHeader}>
                            <h3>Share This Idea</h3>
                            <button 
                                className={styles.closeShareModal}
                                onClick={() => setShowShareModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.shareModalContent}>
                            <p className={styles.shareDescription}>
                                Help validate this idea by sharing it with your network!
                            </p>
                            
                            {/* Copy Link Section */}
                            <div className={styles.copyLinkSection}>
                                <div className={styles.linkDisplay}>
                                    <input 
                                        type="text" 
                                        value={window.location.href}
                                        readOnly
                                    />
                                    <button 
                                        className={styles.copyBtn}
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Social Share Buttons */}
                            <div className={styles.socialShareButtons}>
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this idea: ${idea.title}`)}&url=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.socialBtn} ${styles.twitterBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                    Share on X
                                </a>
                                
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.socialBtn} ${styles.linkedinBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                    Share on LinkedIn
                                </a>
                                
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.socialBtn} ${styles.facebookBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Share on Facebook
                                </a>
                                
                                <a
                                    href={`mailto:?subject=${encodeURIComponent(`Check out this idea: ${idea.title}`)}&body=${encodeURIComponent(`I found this interesting idea on CoStacked:\n\n${idea.title}\n\n${idea.description || idea.problemStatement}\n\n${window.location.href}`)}`}
                                    className={`${styles.socialBtn} ${styles.emailBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                    Share via Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
