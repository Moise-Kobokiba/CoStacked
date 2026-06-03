// backend/config/cloudinaryArticles.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for article cover images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'costacked_articles', // Separate folder for articles
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 630, crop: 'fill' }], // OG image size
  },
});

const uploadArticleImage = multer({ storage: storage });

// Configure storage for resource files (PDFs, DOCs, etc.)
const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'costacked_resources', // Separate folder for resources
    resource_type: 'auto', // Allow any file type
  },
});

const uploadResourceFile = multer({ 
  storage: resourceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = uploadArticleImage;
module.exports.uploadResourceFile = uploadResourceFile;
