const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ---------------------------------------------------------------------------
// Cloudinary storage — streams uploads directly to Cloudinary (no disk I/O)
// ---------------------------------------------------------------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus-listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// ---------------------------------------------------------------------------
// File filter — reject anything that isn't an image
// ---------------------------------------------------------------------------
function fileFilter(_req, file, cb) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }
}

// ---------------------------------------------------------------------------
// Multer instance — 5 MB per file, max 6 files per request
// ---------------------------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 6,
  },
});

module.exports = upload;
