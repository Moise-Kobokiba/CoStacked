const Idea = require('../models/Idea');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification'); // If you want to notify on votes

// @desc    Get all ideas
// @route   GET /api/ideas
// @access  Public (with filters)
const getIdeas = async (req, res) => {
  try {
    const { visibility, status, sort } = req.query;
    
    let query = { status: status || 'active' };

    // If viewing public board, only show public ideas unless specific filter logic applied
    if (visibility) {
        query.visibility = visibility;
    } else {
        // Default to public active ideas?
        // Or if user is logged in, show public + their own + connections (complex logic omitted for MVP)
        query.visibility = 'public';
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

    const results = await ideas.exec();

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

        res.status(200).json(idea);
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
        monetizationModel, risks, assumptions, visibility, industry 
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
      industry
    });

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
                    await Notification.create({
                        recipient: idea.founder,
                        sender: req.user._id,
                        type: 'IDEA_VOTE',
                        message: `upvoted your idea: ${idea.title}`,
                        read: false,
                        relatedId: idea._id,
                        onModel: 'Idea'
                    });
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

        const MIN_CONVERSION_SCORE = 60;
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
                await Notification.create({
                    recipient: parentComment.author._id,
                    sender: req.user._id,
                    type: 'IDEA_COMMENT',
                    message: `replied to your comment on: ${idea.title}`,
                    read: false,
                    relatedId: idea._id,
                    onModel: 'Idea'
                });
            }
        } else if (idea.founder.toString() !== req.user._id.toString()) {
            // Notify idea founder about new comment
            await Notification.create({
                recipient: idea.founder,
                sender: req.user._id,
                type: 'IDEA_COMMENT',
                message: `commented on your idea: ${idea.title}`,
                read: false,
                relatedId: idea._id,
                onModel: 'Idea'
            });
        }

        res.status(201).json(comment);
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
