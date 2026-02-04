const Idea = require('../models/Idea');
const Project = require('../models/Project');
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

// @desc    Vote / Validate Idea
// @route   POST /api/ideas/:id/vote
// @access  Private
const voteIdea = async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id);

        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        // Check if already voted
        if (idea.votes.includes(req.user._id)) {
             // Undo vote? Or just return? Let's toggle.
             idea.votes = idea.votes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            idea.votes.push(req.user._id);
            
            // Create notification for founder
            if (idea.founder.toString() !== req.user._id.toString()) {
                // Assuming Notification model exists
                 await Notification.create({
                    recipient: idea.founder,
                    sender: req.user._id,
                    type: 'IDEA_VOTE', // Make sure to handle this type in frontend
                    message: `voted on your idea: ${idea.title}`,
                    read: false,
                    // valid data needed for link
                    relatedId: idea._id, 
                    onModel: 'Idea'
                 });
            }
        }

        idea.voteCount = idea.votes.length;
        // Simple score: votes * 10 
        idea.validationScore = idea.voteCount * 10;
        // engagement could include comment count too
        idea.engagementCount = idea.voteCount; // + comments count if we had it

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

        if (idea.founder.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Optional: Check threshold
        // if (idea.validationScore < 50) { return res.status(400).json({message: 'Not enough validation'}); }

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


module.exports = {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  voteIdea,
  convertIdeaToProject,
  deleteIdea
};
