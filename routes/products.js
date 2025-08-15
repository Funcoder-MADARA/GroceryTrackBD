const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const { authenticateToken, authorizeShopkeeper } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Get products (optionally filtered by companyId)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { companyId, category, isActive, isAvailable } = req.query;
    
    const filter = {};
    
    if (companyId) {
      filter.companyId = companyId;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }
    
    const products = await Product.find(filter)
      .select('_id name description category price unit stockQuantity brand')
      .sort({ name: 1 });
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by company (for flags feature)
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    const products = await Product.find({
      companyId: companyId,
      isActive: true,
      isAvailable: true
    })
    .select('_id name description category price unit stockQuantity')
    .sort({ name: 1 });

    res.json(products);

  } catch (error) {
    console.error('Get products by company error:', error);
    res.status(500).json({
      error: 'Failed to get products',
      message: 'An error occurred while fetching products'
    });
  }
});

// Get a single product
router.get('/:productId', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product (company representatives only)
router.post('/', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      companyId: req.user.id // Set companyId from authenticated user
    };
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product (company representatives only)
router.put('/:productId', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user owns this product
    if (product.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product (company representatives only)
router.delete('/:productId', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user owns this product
    if (product.companyId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(req.params.productId);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
