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

// Public routes
router.get("/", getPublishedArticles);
router.get("/:slug", getArticleBySlug);

// Admin-only routes
router.get("/admin/all", protect, requireAdmin, getAllArticles);
router.post("/", protect, requireAdmin, uploadArticleImage.single('coverImage'), createArticle);
router.put("/:id", protect, requireAdmin, uploadArticleImage.single('coverImage'), updateArticle);
router.delete("/:id", protect, requireAdmin, deleteArticle);
router.post("/:id/publish", protect, requireAdmin, togglePublishStatus);

module.exports = router;
