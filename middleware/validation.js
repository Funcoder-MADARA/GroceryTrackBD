const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

// Validation rules for user registration
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .matches(/^(\+880|880|0)?1[3456789]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['shopkeeper', 'company_rep', 'delivery_worker'])
    .withMessage('Invalid user role'),
  
  body('area')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area must be between 2 and 100 characters'),
  
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  handleValidationErrors
];

// Validation rules for user login
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation rules for product creation
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['groceries', 'beverages', 'snacks', 'household', 'personal_care', 'frozen_foods', 'dairy', 'bakery', 'others'])
    .withMessage('Invalid product category'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('unit')
    .isIn(['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'dozen', 'bottle', 'can', 'box'])
    .withMessage('Invalid unit'),
  
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  body('minOrderQuantity')
    .isInt({ min: 1 })
    .withMessage('Minimum order quantity must be at least 1'),
  
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one product image is required'),
  
  handleValidationErrors
];

// Validation rules for order creation
const validateOrderCreation = [
  body('companyId')
    .isMongoId()
    .withMessage('Invalid company ID'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('deliveryArea')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Delivery area must be between 2 and 100 characters'),
  
  body('deliveryAddress')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Delivery address must be between 5 and 200 characters'),
  
  body('deliveryCity')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Delivery city must be between 2 and 50 characters'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash_on_delivery', 'bank_transfer', 'mobile_banking'])
    .withMessage('Invalid payment method'),
  
  handleValidationErrors
];

// Validation rules for order status update
const validateOrderStatusUpdate = [
  body('status')
    .isIn(['approved', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Rejection reason must be between 5 and 200 characters'),
  
  handleValidationErrors
];

// Validation rules for delivery assignment
const validateDeliveryAssignment = [
  body('deliveryWorkerId')
    .isMongoId()
    .withMessage('Invalid delivery worker ID'),
  
  handleValidationErrors
];

// Validation rules for delivery status update
const validateDeliveryStatusUpdate = [
  body('status')
    .isIn(['picked_up', 'in_transit', 'delivered', 'failed', 'returned'])
    .withMessage('Invalid delivery status'),
  
  body('issues')
    .optional()
    .isArray()
    .withMessage('Issues must be an array'),
  
  body('issues.*.type')
    .optional()
    .isIn(['damaged_goods', 'wrong_items', 'customer_unavailable', 'address_incorrect', 'other'])
    .withMessage('Invalid issue type'),
  
  body('issues.*.description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Issue description must be between 5 and 200 characters'),
  
  handleValidationErrors
];

// Validation rules for profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^(\+880|880|0)?1[3456789]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('area')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area must be between 2 and 100 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  handleValidationErrors
];

// Validation rules for MongoDB ObjectId parameters
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Validation rules for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProductCreation,
  validateOrderCreation,
  validateOrderStatusUpdate,
  validateDeliveryAssignment,
  validateDeliveryStatusUpdate,
  validateProfileUpdate,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};