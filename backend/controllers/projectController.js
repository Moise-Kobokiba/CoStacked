// backend/controllers/projectController.js

const Project = require('../models/Project');
const AdminNotification = require('../models/AdminNotification'); // For admin panel notifications

/**
 * @desc    Fetch all projects from the database
 * @route   GET /api/projects
 * @access  Public
 */
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .populate('founderId', 'name isVerified'); // Populate to show badge
    res.json(projects);
  } catch (error) {
    console.error(`Error fetching projects: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching projects.' });
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (requires authentication)
 */
const createProject = async (req, res) => {
  try {
    const { title, description, skills, compensation, stage, location } = req.body;

    if (!title || !description || !skills || !compensation || !stage || !location) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (!req.user || req.user.role !== 'founder') {
        return res.status(403).json({ message: 'Forbidden. Only founders can post projects.' });
    }
    
    const project = await Project.create({
      title,
      description,
      skillsNeeded: skills.split(',').map(skill => skill.trim()),
      compensation,
      stage,
      location,
      founder: req.user.name,
      founderId: req.user._id,
    });

    // --- CREATE ADMIN NOTIFICATION ---
    await AdminNotification.create({
      type: 'NEW_PROJECT_POSTED',
      message: `A new project "${project.title}" was posted by ${req.user.name}.`,
      link: `/projects`, // Links to the project management page in the admin dashboard
      refId: project._id
    });
    
    if (project) {
        res.status(201).json(project);
    } else {
        res.status(400).json({ message: 'Invalid project data.' });
    }
  } catch (error) {
    console.error(`Error in createProject: ${error.message}`);
    res.status(500).json({ message: 'Server error during project creation.' });
  }
};

/**
 * @desc    Get projects for the logged-in user
 * @route   GET /api/projects/myprojects
 * @access  Private
 */
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ founderId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('founderId', 'name isVerified');
    res.json(projects);
  } catch (error) {
    console.error(`Error in getMyProjects: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching user projects.' });
  }
};

/**
 * @desc    Get single project by id
 * @route   GET /api/projects/:id
 * @access  Private (per spec: require auth to view full project)
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('founderId', 'name isVerified avatarUrl');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // If project is private in future, enforce visibility here.
    res.json(project);
  } catch (error) {
    console.error(`Error fetching project by id: ${error.message}`);
    res.status(500).json({ message: 'Server error while fetching project.' });
  }
};


/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res) => {
  try {
    const { title, description, skills, compensation, stage, location } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.founderId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to edit this project' });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.compensation = compensation || project.compensation;
    project.stage = stage || project.stage;
    project.location = location || project.location;
    if (skills) {
      project.skillsNeeded = skills.split(',').map(skill => skill.trim());
    }

    const updatedProject = await project.save();
    res.json(updatedProject);

  } catch (error) {
    console.error(`Error in updateProject: ${error.message}`);
    res.status(500).json({ message: 'Server error while updating project.' });
  }
};


/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.founderId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to delete this project' });
    }

    await Project.deleteOne({ _id: req.params.id });
    res.json({ message: 'Project removed successfully' });

  } catch (error) {
    console.error(`Error in deleteProject: ${error.message}`);
    res.status(500).json({ message: 'Server error while deleting project.' });
  }
};


module.exports = {
  getProjects,
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
};