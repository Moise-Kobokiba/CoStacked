// backend/routes/articleRoutes.js

const express = require("express");
const router = express.Router();
const {
  getPublishedArticles,
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublishStatus,
} = require("../controllers/articleController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const uploadArticleImage = require("../config/cloudinaryArticles");
const { uploadResourceFile } = require("../config/cloudinaryArticles");

// Public routes
router.get("/", getPublishedArticles);
router.get("/:slug", getArticleBySlug);

// Admin-only routes
router.get("/admin/all", protect, requireAdmin, getAllArticles);
router.post("/", protect, requireAdmin, uploadArticleImage.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'resourceFile_0', maxCount: 1 },
  { name: 'resourceFile_1', maxCount: 1 },
  { name: 'resourceFile_2', maxCount: 1 },
  { name: 'resourceFile_3', maxCount: 1 },
  { name: 'resourceFile_4', maxCount: 1 },
  { name: 'resourceFile_5', maxCount: 1 },
  { name: 'resourceFile_6', maxCount: 1 },
  { name: 'resourceFile_7', maxCount: 1 },
  { name: 'resourceFile_8', maxCount: 1 },
  { name: 'resourceFile_9', maxCount: 1 },
]), createArticle);
router.put("/:id", protect, requireAdmin, uploadArticleImage.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'resourceFile_0', maxCount: 1 },
  { name: 'resourceFile_1', maxCount: 1 },
  { name: 'resourceFile_2', maxCount: 1 },
  { name: 'resourceFile_3', maxCount: 1 },
  { name: 'resourceFile_4', maxCount: 1 },
  { name: 'resourceFile_5', maxCount: 1 },
  { name: 'resourceFile_6', maxCount: 1 },
  { name: 'resourceFile_7', maxCount: 1 },
  { name: 'resourceFile_8', maxCount: 1 },
  { name: 'resourceFile_9', maxCount: 1 },
]), updateArticle);
router.delete("/:id", protect, requireAdmin, deleteArticle);
router.post("/:id/publish", protect, requireAdmin, togglePublishStatus);

module.exports = router;
