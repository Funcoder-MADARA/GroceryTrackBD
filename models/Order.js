const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getProductsByCompany,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock
} = require('../controllers/productController');

const router = express.Router();

// Get all products (with optional filtering)
router.get('/', authenticateToken, getProducts);

// Get product categories
router.get('/categories', authenticateToken, getCategories);

// Get products by company ID
router.get('/company/:companyId', authenticateToken, getProductsByCompany);

// Get single product by ID
router.get('/:productId', authenticateToken, getProduct);

// Create new product (company reps only)
router.post('/', authenticateToken, createProduct);

// Update product (company reps only)
router.put('/:productId', authenticateToken, updateProduct);

// Update stock quantity
router.put('/:productId/stock', authenticateToken, updateStock);

// Delete product (company reps only)
router.delete('/:productId', authenticateToken, deleteProduct);
module.exports = router;