// backend/models/Article.js

const mongoose = require("mongoose");

const contentBlockSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["paragraph", "heading", "list", "callout"],
  },
  content: {
    type: String,
    required: false,
  },
  items: {
    type: [String],
    required: false,
  },
  variant: {
    type: String,
    enum: ["warning", "info", "success"],
    required: false,
  },
});

const resourceSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["file", "link"],
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  url: {
    type: String,
    required: function() {
      return this.type === "link";
    },
  },
  fileUrl: {
    type: String,
    required: function() {
      return this.type === "file";
    },
  },
  fileName: {
    type: String,
    required: function() {
      return this.type === "file";
    },
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileType: {
    type: String,
    default: "",
  },
});

const articleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "book-open",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    views: {
      type: Number,
      default: 0,
    },
    content: {
      type: [contentBlockSchema],
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving if slug is not provided
articleSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

module.exports = mongoose.models.Article || mongoose.model("Article", articleSchema);
