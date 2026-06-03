// backend/config/cloudinaryChat.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials from your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // The name of the folder on Cloudinary where chat files will be stored
    folder: 'costacked_chat_media',
    
    // This function is crucial for handling different file types.
    // It tells Cloudinary to treat audio files as 'video' resources,
    // which makes them streamable and provides playable URLs.
    // All other files (images, PDFs, etc.) will be handled automatically.
    resource_type: (req, file) => {
      if (file.mimetype.startsWith('audio/')) {
        return 'video';
      }
      return 'auto';
    },
  },
});

// Create the Multer upload instance with the configured storage
const chatUpload = multer({ storage: storage });

// Export the configured middleware to be used in your message routes
module.exports = chatUpload;