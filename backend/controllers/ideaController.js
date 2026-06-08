const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification'); // If you want to notify on votes
const socketUtil = require('../utils/socket');
const { VALIDATION } = require('../config/validation');

// Helper: compute validation metadata for an idea doc
const computeValidationMeta = (idea) => {
    const upvoteCount = Array.isArray(idea.upvotes) ? idea.upvotes.length : (idea.upvoteCount || 0);
    const downvoteCount = Array.isArray(idea.downvotes) ? idea.downvotes.length : 0;
    const totalVotes = upvoteCount + downvoteCount;
    const upvotePercentage = totalVotes > 0 ? Math.round((upvoteCount / totalVotes) * 100) : 0;
    const downvotePercentage = totalVotes > 0 ? Math.round((downvoteCount / totalVotes) * 100) : 0;
    const createdAt = idea.createdAt ? new Date(idea.createdAt) : new Date();
    const daysOld = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Determine status per spec
    let validationStatus = 'Validating';

    if (daysOld >= VALIDATION.WEAK_VALIDATION_DAYS && downvotePercentage >= VALIDATION.WEAK_VALIDATION_DOWNVOTE_PERCENT) {
        validationStatus = 'Unsuccessful';
    } else if (upvoteCount >= VALIDATION.HIGHLY_VALIDATED_UPVOTE_THRESHOLD) {
        validationStatus = 'Highly Validated';
    } else if ((idea.validationScore || 0) >= 70) {
        validationStatus = 'Promising';
    } else {
        validationStatus = 'Validating';
    }

    const canConvert = (idea.validationScore || 0) >= VALIDATION.MIN_CONVERSION_SCORE || upvoteCount >= VALIDATION.HIGHLY_VALIDATED_UPVOTE_THRESHOLD;

    return {
        upvoteCount,
        downvoteCount,
        totalVotes,
        upvotePercentage,
        downvotePercentage,
        daysOld,
        validationStatus,
        canConvert,
    };
};

// @desc    Get all ideas
// @route   GET /api/ideas
// @access  Public (with filters)
const getIdeas = async (req, res) => {
  try {
    const { visibility, status, sort, search, stage } = req.query;
    
    const query = {};
    if (!status || status === 'active') {
      query.status = 'active';
    } else if (status !== 'all') {
      query.status = status;
    }

    // If viewing public board, only show public ideas unless specific filter logic applied
    if (visibility) {
        query.visibility = visibility;
    } else {
        query.visibility = 'public';
    }

    if (stage && stage !== 'all') {
      query.stage = stage;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problemStatement: { $regex: search, $options: 'i' } },
        { valueProposition: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let ideas = Idea.find(query).populate('founder', 'name avatarUrl headline');

    // Sorting
    if (sort === 'popular') {
        ideas = ideas.sort({ validationScore: -1 });
    } else if (sort === 'newest') {
        ideas = ideas.sort({ createdAt: -1 });
    } else {
        ideas = ideas.sort({ createdAt: -1 });
    }

        let results = await ideas.exec();
        // Augment results with computed validation metadata to keep frontend simple and consistent
        results = results.map((idea) => {
            try {
                const meta = computeValidationMeta(idea);
                return { ...idea.toObject(), ...meta };
            } catch (e) {
                return idea;
            }
        });

        res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single idea
// @route   GET /api/ideas/:id
// @access  Public/Private
const getIdeaById = async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id).populate('founder', 'name avatarUrl headline');
        
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        
        // Visibility check logic could go here (e.g. if private, check if req.user is connected)
        // Augment idea with computed validation metadata so frontend doesn't re-implement rules
        const meta = computeValidationMeta(idea);
        res.status(200).json({ ...idea.toObject(), ...meta });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new idea
// @route   POST /api/ideas
// @access  Private
const createIdea = async (req, res) => {
  try {
    const { 
        title, problemStatement, targetAudience, valueProposition, 
        monetizationModel, risks, assumptions, visibility, industry,
        tags, stage, validationScore
    } = req.body;

    const idea = await Idea.create({
      founder: req.user._id,
      title,
      problemStatement,
      targetAudience,
      valueProposition,
      monetizationModel,
      risks,
      assumptions,
      visibility,
      industry,
      tags: Array.isArray(tags) ? tags : [],
      stage: stage || 'Concept',
      validationScore: validationScore ?? 0,
    });

    try {
      const io = socketUtil.getIo();
      if (io) {
        io.to('validation_feed').emit('idea_created', { ideaId: idea._id, idea });
      }
    } catch (e) {
      console.error('Socket emit error (idea create):', e);
    }

    res.status(201).json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update idea
// @route   PUT /api/ideas/:id
// @access  Private (Owner only)
const updateIdea = async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id);

        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        if (idea.founder.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedIdea = await Idea.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        res.status(200).json(updatedIdea);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Upvote / Downvote Idea
// @route   POST /api/ideas/:id/vote
// @access  Private
const voteIdea = async (req, res) => {
    try {
        const { voteType } = req.body; // 'up' or 'down'
        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ message: 'Invalid voteType. Use "up" or "down".' });
        }
        const idea = await Idea.findById(req.params.id);

        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        const userId = req.user._id.toString();
        const hasUpvoted = idea.upvotes.includes(req.user._id);
        const hasDownvoted = idea.downvotes.includes(req.user._id);

        if (voteType === 'up') {
            if (hasUpvoted) {
                // Remove upvote (toggle off)
                idea.upvotes = idea.upvotes.filter(id => id.toString() !== userId);
            } else {
                // Add upvote and remove downvote if exists
                idea.upvotes.push(req.user._id);
                idea.downvotes = idea.downvotes.filter(id => id.toString() !== userId);
                
                // Create notification for founder (only on new upvote)
                if (idea.founder.toString() !== userId) {
                    const notif = await Notification.create({
                        recipient: idea.founder,
                        sender: req.user._id,
                        type: 'IDEA_VOTE',
                        message: `upvoted your idea: ${idea.title}`,
                        read: false,
                        relatedId: idea._id,
                        onModel: 'Idea'
                    });
                    try {
                        const io = socketUtil.getIo();
                        if (io) io.to(idea.founder.toString()).emit('notification_created', notif);
                    } catch (e) { console.error('Socket emit error (notification vote):', e); }
                }
            }
        } else if (voteType === 'down') {
            if (hasDownvoted) {
                // Remove downvote (toggle off)
                idea.downvotes = idea.downvotes.filter(id => id.toString() !== userId);
            } else {
                // Add downvote and remove upvote if exists
                idea.downvotes.push(req.user._id);
                idea.upvotes = idea.upvotes.filter(id => id.toString() !== userId);
            }
        }

        // Calculate totals
        const upvoteCount = idea.upvotes.length;
        const downvoteCount = idea.downvotes.length;
        idea.voteCount = upvoteCount + downvoteCount;

        // Weighted score: upvotes * 15 (10 + 5 bonus) - downvotes * 5
        let score = (upvoteCount * 15) - (downvoteCount * 5);
        // Cap score between 0 and 100
        score = Math.max(0, Math.min(100, score));
        idea.validationScore = score;
        
        // Update engagement
        const commentCount = await Comment.countDocuments({ idea: req.params.id, isDeleted: false });
        idea.engagementCount = idea.voteCount + commentCount;

        await idea.save();

                // Emit real-time update for votes/validation score
                try {
                    const io = socketUtil.getIo();
                    if (io) {
                        // Emit to the idea-specific room to avoid broadcasting to everyone
                        io.to(`idea:${idea._id}`).emit('idea_vote_update', {
                            ideaId: idea._id,
                            validationScore: idea.validationScore,
                            upvoteCount: upvoteCount,
                            downvoteCount: downvoteCount,
                            voteCount: idea.voteCount
                        });
                        io.to('validation_feed').emit('idea_vote_update', {
                            ideaId: idea._id,
                            validationScore: idea.validationScore,
                            upvoteCount: upvoteCount,
                            downvoteCount: downvoteCount,
                            voteCount: idea.voteCount
                        });
                    }
                } catch (e) {
                    console.error('Socket emit error (vote):', e);
                }

                res.status(200).json(idea);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Convert Idea to Project
// @route   POST /api/ideas/:id/convert
// @access  Private (Owner only)
const convertIdeaToProject = async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id);

        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        // Allow founder or admins to convert an idea
        if (idea.founder.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Optional: Check threshold
        // if (idea.validationScore < 50) { return res.status(400).json({message: 'Not enough validation'}); }

                const MIN_CONVERSION_SCORE = VALIDATION.MIN_CONVERSION_SCORE || 60;
                if (idea.validationScore < MIN_CONVERSION_SCORE) {
                    return res.status(400).json({ message: `Idea must reach a validation score of ${MIN_CONVERSION_SCORE} before conversion.` });
                }

        // Create Project
        const projectData = {
            founderId: req.user._id,
            founder: req.user.name || "Founder", // Project model asks for this string
            title: idea.title,
            description: `${idea.problemStatement}\n\nSolution: ${idea.valueProposition}`,
            skillsNeeded: [], // User will have to fill this later
            compensation: 'Equity', // Default
            stage: 'Concept',
            location: 'Remote', // Default
            // We could add a field 'originIdeaId': idea._id
        };

        const project = await Project.create(projectData);

        // Update Idea status
        idea.status = 'converted';
        await idea.save();

                // Emit real-time conversion and new project event
                try {
                    const io = socketUtil.getIo();
                    if (io) {
                        // Notify viewers of the idea that it was converted
                        io.to(`idea:${idea._id}`).emit('idea_converted', { ideaId: idea._id, projectId: project._id, project });
                        io.to('validation_feed').emit('idea_converted', { ideaId: idea._id, projectId: project._id, project });
                        // Notify clients that subscribe to project listings
                        io.to('projects').emit('project_created', { projectId: project._id, project });
                    }
                } catch (e) {
                    console.error('Socket emit error (convert):', e);
                }

                res.status(201).json({ message: 'Idea converted to Project', projectId: project._id, project });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Idea
// @route   DELETE /api/ideas/:id
// @access  Private (Owner or Admin)
const deleteIdea = async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id);

        if (!idea) {
             return res.status(404).json({ message: 'Idea not found' });
        }
        
        // Check ownership
        if (idea.founder.toString() !== req.user._id.toString()) {
            // Need to check if admin, assuming req.user.role exists if admin
            // if (req.user.role !== 'admin') ...
            return res.status(401).json({ message: 'Not authorized' });
        }

        await idea.deleteOne();
        res.status(200).json({ message: 'Idea removed' });

    } catch (error) {
         res.status(500).json({ message: error.message });
    }
}


// @desc    Get comments for an idea
// @route   GET /api/ideas/:id/comments
// @access  Public
const getIdeaComments = async (req, res) => {
    try {
        // Get top-level comments (no parent)
        const comments = await Comment.find({ 
            idea: req.params.id, 
            isDeleted: false,
            parentComment: null
        })
            .populate('author', 'name avatarUrl')
            .sort({ createdAt: -1 });
        
        // Get all replies for this idea
        const replies = await Comment.find({ 
            idea: req.params.id, 
            isDeleted: false,
            parentComment: { $ne: null }
        })
            .populate('author', 'name avatarUrl')
            .sort({ createdAt: 1 });
        
        // Organize replies by parent comment
        const commentsWithReplies = comments.map(comment => {
            const commentReplies = replies.filter(reply => 
                reply.parentComment.toString() === comment._id.toString()
            );
            return {
                ...comment.toObject(),
                replies: commentReplies
            };
        });
        
        res.status(200).json(commentsWithReplies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to idea
// @route   POST /api/ideas/:id/comments
// @access  Private
const addIdeaComment = async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const idea = await Idea.findById(req.params.id);
        
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        // If it's a reply, verify parent comment exists
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment || parentComment.idea.toString() !== req.params.id) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        const comment = await Comment.create({
            idea: req.params.id,
            author: req.user._id,
            content: content.trim(),
            parentComment: parentCommentId || null,
        });

        // Populate author info for response
        await comment.populate('author', 'name avatarUrl');

        // Update engagement count
        const commentCount = await Comment.countDocuments({ idea: req.params.id, isDeleted: false });
        idea.engagementCount = idea.voteCount + commentCount;
        await idea.save();

        // Create notification
        if (parentCommentId) {
            // Notify parent comment author about reply
            const parentComment = await Comment.findById(parentCommentId).populate('author');
            if (parentComment && parentComment.author._id.toString() !== req.user._id.toString()) {
                const notif = await Notification.create({
                    recipient: parentComment.author._id,
                    sender: req.user._id,
                    type: 'IDEA_COMMENT',
                    message: `replied to your comment on: ${idea.title}`,
                    read: false,
                    relatedId: idea._id,
                    onModel: 'Idea'
                });
                try {
                    const io = socketUtil.getIo();
                    if (io) io.to(parentComment.author._id.toString()).emit('notification_created', notif);
                } catch (e) { console.error('Socket emit error (notification reply):', e); }
            }
        } else if (idea.founder.toString() !== req.user._id.toString()) {
            // Notify idea founder about new comment
            const notif = await Notification.create({
                recipient: idea.founder,
                sender: req.user._id,
                type: 'IDEA_COMMENT',
                message: `commented on your idea: ${idea.title}`,
                read: false,
                relatedId: idea._id,
                onModel: 'Idea'
            });
            try {
                const io = socketUtil.getIo();
                if (io) io.to(idea.founder.toString()).emit('notification_created', notif);
            } catch (e) { console.error('Socket emit error (notification comment):', e); }
        }

        res.status(201).json(comment);
        
                // Emit real-time comment event
                try {
                    const io = socketUtil.getIo();
                    if (io) {
                        io.to(`idea:${idea._id}`).emit('idea_comment_added', {
                            ideaId: idea._id,
                            comment,
                            engagementCount: idea.engagementCount
                        });
                        io.to('validation_feed').emit('idea_comment_added', {
                            ideaId: idea._id,
                            comment,
                            engagementCount: idea.engagementCount
                        });
                    }
                } catch (e) {
                    console.error('Socket emit error (comment):', e);
                }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete comment
// @route   DELETE /api/ideas/:id/comments/:commentId
// @access  Private (Comment author or Admin)
const deleteIdeaComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is comment author or admin
        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this comment' });
        }

        // Soft delete
        comment.isDeleted = true;
        await comment.save();

        // Update engagement count
        const idea = await Idea.findById(req.params.id);
        if (idea) {
            const commentCount = await Comment.countDocuments({ idea: req.params.id, isDeleted: false });
            idea.engagementCount = idea.voteCount + commentCount;
            await idea.save();
        }

        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a comment
// @route   PUT /api/ideas/:id/comments/:commentId
// @access  Private (Comment author)
const editIdeaComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this comment' });
        }

        comment.content = content.trim();
        await comment.save();

        await comment.populate('author', 'name avatarUrl');

        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  voteIdea,
  convertIdeaToProject,
  deleteIdea,
  getIdeaComments,
  addIdeaComment,
  deleteIdeaComment,
  editIdeaComment
};
