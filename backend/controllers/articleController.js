// backend/controllers/articleController.js

const Article = require("../models/Article");

// @desc    Get all published articles (public)
// @route   GET /api/articles
// @access  Public
const getPublishedArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isPublished: true })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error("Error fetching published articles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
};

// @desc    Get all articles including drafts (admin only)
// @route   GET /api/articles/admin/all
// @access  Private/Admin
const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({})
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error("Error fetching all articles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
};

// @desc    Get single article by slug
// @route   GET /api/articles/:slug
// @access  Public
const getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(
      "author",
      "name email avatarUrl"
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // Only return published articles to non-admin users
    if (!article.isPublished && !req.user?.isAdmin) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
      error: error.message,
    });
  }
};

// @desc    Create new article
// @route   POST /api/articles
// @access  Private/Admin
const createArticle = async (req, res) => {
  try {
    const { title, slug, description, category, icon, readTime, content, resources } = req.body;

    // Validate required fields
    if (!title || !description || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, category, and content",
      });
    }

    // Check if slug already exists
    const existingArticle = await Article.findOne({ slug: slug || title });
    if (existingArticle) {
      return res.status(400).json({
        success: false,
        message: "An article with this slug already exists",
      });
    }

    // Handle cover image - use uploaded file or URL from body
    let coverImage = '';
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      // File was uploaded via multer/cloudinary
      coverImage = req.files.coverImage[0].path;
    } else if (req.body.coverImage) {
      // URL was provided directly
      coverImage = req.body.coverImage;
    }

    // Collect all resource files from req.files
    const resourceFiles = [];
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        if (key.startsWith('resourceFile_') && req.files[key][0]) {
          resourceFiles.push(req.files[key][0]);
        }
      });
    }

    // Parse content if it's a JSON string (from FormData)
    let parsedContent = content;
    if (content && typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
        });
      }
    }

    // Parse resources if it's a JSON string
    let parsedResources = [];
    if (resources) {
      if (typeof resources === 'string') {
        try {
          parsedResources = JSON.parse(resources);
        } catch (e) {
          console.warn("Invalid resources format, using empty array");
        }
      } else if (Array.isArray(resources)) {
        parsedResources = resources;
      }
    }

    // Handle resource files - look for files with names starting with 'resourceFile_'
    const resourceFiles = req.files || [];
    if (resourceFiles.length > 0) {
      // Match uploaded files with resource entries
      let fileIndex = 0;
      parsedResources = parsedResources.map(resource => {
        if (resource.type === 'file' && !resource.fileUrl && resourceFiles[fileIndex]) {
          const uploadedFile = resourceFiles[fileIndex];
          fileIndex++;
          return {
            ...resource,
            fileUrl: uploadedFile.path,
          };
        }
        return resource;
      });
    }

    const article = await Article.create({
      title,
      slug,
      description,
      category,
      icon,
      readTime,
      content: parsedContent,
      coverImage,
      resources: parsedResources,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: article,
      message: "Article created successfully",
    });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create article",
      error: error.message,
    });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // If slug is being updated, check if it already exists
    if (req.body.slug && req.body.slug !== article.slug) {
      const existingArticle = await Article.findOne({ slug: req.body.slug });
      if (existingArticle) {
        return res.status(400).json({
          success: false,
          message: "An article with this slug already exists",
        });
      }
    }

    // Handle cover image update
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      // New file uploaded
      req.body.coverImage = req.files.coverImage[0].path;
    }
    // If no file uploaded but body has coverImage, it will be used as-is
    // If neither, the existing coverImage remains unchanged

    // Parse content if it's a JSON string (from FormData)
    if (req.body.content && typeof req.body.content === 'string') {
      try {
        req.body.content = JSON.parse(req.body.content);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
        });
      }
    }

    // Parse resources if it's a JSON string
    let parsedResources = [];
    if (req.body.resources) {
      if (typeof req.body.resources === 'string') {
        try {
          parsedResources = JSON.parse(req.body.resources);
        } catch (e) {
          console.warn("Invalid resources format, using existing");
          delete req.body.resources;
        }
      } else if (Array.isArray(req.body.resources)) {
        parsedResources = req.body.resources;
      }
    }

    // Collect all resource files from req.files and match with resources
    if (req.files && parsedResources.length > 0) {
      const resourceFiles = [];
      Object.keys(req.files).forEach(key => {
        if (key.startsWith('resourceFile_') && req.files[key][0]) {
          resourceFiles.push(req.files[key][0]);
        }
      });

      // Match uploaded files with resource entries that don't have fileUrl yet
      let fileIndex = 0;
      parsedResources = parsedResources.map(resource => {
        if (resource.type === 'file' && !resource.fileUrl && resourceFiles[fileIndex]) {
          const uploadedFile = resourceFiles[fileIndex];
          fileIndex++;
          return {
            ...resource,
            fileUrl: uploadedFile.path,
          };
        }
        return resource;
      });

      req.body.resources = parsedResources;
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("author", "name email");

    res.status(200).json({
      success: true,
      data: updatedArticle,
      message: "Article updated successfully",
    });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update article",
      error: error.message,
    });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    await article.deleteOne();

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete article",
      error: error.message,
    });
  }
};

// @desc    Toggle publish status
// @route   POST /api/articles/:id/publish
// @access  Private/Admin
const togglePublishStatus = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.isPublished = !article.isPublished;
    await article.save();

    res.status(200).json({
      success: true,
      data: article,
      message: `Article ${article.isPublished ? "published" : "unpublished"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling publish status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle publish status",
      error: error.message,
    });
  }
};

module.exports = {
  getPublishedArticles,
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublishStatus,
};
