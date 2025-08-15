const Product = require('../models/Product');
const User = require('../models/User');

// Get all products (with optional filtering)
exports.getProducts = async (req, res) => {
  try {
    const { 
      companyId, 
      category, 
      search, 
      inStock,
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'company_rep') {
      query.companyId = req.user._id;
    } else if (companyId) {
      query.companyId = companyId;
    }

    if (category) query.category = category;
    if (inStock === 'true') query.stockQuantity = { $gt: 0 };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch products
    const products = await Product.find(query)
      .populate('companyId', 'name companyInfo.companyName')
      .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate('companyId', 'name companyInfo.companyName phone');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check access permissions
    if (req.user.role === 'company_rep' && product.companyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Get products by company ID
exports.getProductsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { category, inStock } = req.query;

    // Verify company exists
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company_rep') {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Build query
    let query = { companyId, isActive: true };
    if (category) query.category = category;
    if (inStock === 'true') query.stockQuantity = { $gt: 0 };

    const products = await Product.find(query)
      .sort({ category: 1, name: 1 })
      .select('name description category unitPrice price unit stockQuantity minOrderQuantity maxOrderQuantity images');

    res.json({ 
      products,
      company: {
        name: company.name,
        companyName: company.companyInfo?.companyName || company.name
      }
    });
  } catch (error) {
    console.error('Get company products error:', error);
    res.status(500).json({ error: 'Failed to fetch company products' });
  }
};

// Create new product (company reps only)
exports.createProduct = async (req, res) => {
  try {
    // Only company reps can create products
    if (req.user.role !== 'company_rep') {
      return res.status(403).json({ error: 'Only company representatives can create products' });
    }

    const {
      name,
      description,
      category,
      unitPrice,
      unit,
      stockQuantity,
      minOrderQuantity,
      maxOrderQuantity,
      images,
      tags,
      nutritionInfo,
      expiryDate,
      manufacturingDate,
      brand,
      barcode
    } = req.body;

    // Validate required fields
    if (!name || !category || unitPrice === undefined) {
      return res.status(400).json({ error: 'Name, category, and unit price are required' });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({ error: 'Product with this barcode already exists' });
      }
    }

    const product = new Product({
      name,
      description,
      category,
      unitPrice: Number(unitPrice),
      unit: unit || 'piece',
      stockQuantity: Number(stockQuantity) || 0,
      minOrderQuantity: Number(minOrderQuantity) || 1,
      maxOrderQuantity: maxOrderQuantity ? Number(maxOrderQuantity) : null,
      companyId: req.user._id,
      images: images || [],
      tags: tags || [],
      nutritionInfo,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
      brand,
      barcode
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product (company reps only)
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role !== 'company_rep' || product.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'category', 'unitPrice', 'unit', 
      'stockQuantity', 'minOrderQuantity', 'maxOrderQuantity',
      'images', 'tags', 'nutritionInfo', 'expiryDate', 
      'manufacturingDate', 'brand', 'barcode', 'isActive'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle date fields
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);
    if (updates.manufacturingDate) updates.manufacturingDate = new Date(updates.manufacturingDate);

    // Handle numeric fields
    ['unitPrice', 'stockQuantity', 'minOrderQuantity', 'maxOrderQuantity'].forEach(field => {
      if (updates[field] !== undefined) {
        updates[field] = Number(updates[field]);
      }
    });

    Object.assign(product, updates);
    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (company reps only)
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role !== 'company_rep' || product.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'dairy', 'meat', 'seafood', 'fruits', 'vegetables',
      'grains', 'bakery', 'beverages', 'snacks',
      'frozen', 'canned', 'condiments', 'other'
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Update stock quantity
exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role !== 'company_rep' || product.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    if (operation === 'add') {
      product.stockQuantity += Number(quantity);
    } else if (operation === 'subtract') {
      product.stockQuantity = Math.max(0, product.stockQuantity - Number(quantity));
    } else {
      product.stockQuantity = Number(quantity);
    }

    await product.save();

    res.json({
      message: 'Stock updated successfully',
      product: {
        id: product._id,
        name: product.name,
        stockQuantity: product.stockQuantity
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};
