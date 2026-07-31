const { body, validationResult } = require('express-validator');

// Helper middleware to process validation results and return formatted HTTP 400 errors
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    return res.status(400).json({
      error: errorArray[0].msg,
      errors: errorArray.map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Signup validation rules
const signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateResult
];

// Login validation rules
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResult
];

// Listing creation / update validation rules
const listingRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Category must be a valid Mongo ObjectId'),
  body('condition')
    .optional()
    .isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition value'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  validateResult
];

// Message body validation rules
const messageRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required')
    .isLength({ max: 2000 }).withMessage('Message text cannot exceed 2000 characters'),
  validateResult
];

// Create conversation validation rules
const conversationRules = [
  body('listingId')
    .notEmpty().withMessage('listingId is required')
    .isMongoId().withMessage('listingId must be a valid Mongo ObjectId'),
  validateResult
];

module.exports = {
  validateResult,
  signupRules,
  loginRules,
  listingRules,
  messageRules,
  conversationRules
};
