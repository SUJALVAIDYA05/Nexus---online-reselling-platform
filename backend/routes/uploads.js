const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// POST /api/uploads — upload up to 6 images to Cloudinary
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, (req, res, next) => {
  upload.array('images', 6)(req, res, (err) => {
    // Handle multer / Cloudinary errors with user-friendly messages
    if (err) {
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: 'File too large. Maximum size is 5 MB per image.',
          LIMIT_FILE_COUNT: 'Too many files. Maximum is 6 images per upload.',
          LIMIT_UNEXPECTED_FILE: err.field || 'Invalid file type.',
        };
        return res
          .status(400)
          .json({ error: messages[err.code] || err.message });
      }
      return next(err);
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: 'No images provided. Upload at least one image.' });
    }

    // Map Cloudinary response to a clean shape
    const urls = req.files.map((file) => ({
      url: file.path,          // Cloudinary public URL
      publicId: file.filename,  // Cloudinary public_id (for future deletion)
    }));

    res.status(201).json({ urls });
  });
});

module.exports = router;
