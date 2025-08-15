const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Flag = require('../models/Flag');
const { authenticateToken, authorizeShopkeeper } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const AnalyticsService = require('../services/analyticsService');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `receipt_${Date.now()}${ext}`);
  },
});

const pdfOnly = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter: pdfOnly, limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 } });

// Validation rules for creating a flag
const validateCreateFlag = [
  body('companyId').isMongoId().withMessage('Invalid companyId'),
  body('productId').isMongoId().withMessage('Invalid productId'),
  body('quantityBought').isInt({ min: 0 }).withMessage('quantityBought must be >= 0'),
  body('quantitySold').isInt({ min: 0 }).withMessage('quantitySold must be >= 0'),
  body('date').isISO8601().toDate().withMessage('Invalid date'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5'),
  body('remarks').optional().isString().isLength({ max: 1000 }).withMessage('remarks too long'),
  handleValidationErrors,
];

// Create a new flag (shopkeeper)
router.post('/', authenticateToken, authorizeShopkeeper, upload.single('receipt'), validateCreateFlag, async (req, res) => {
  try {
    const receiptPath = req.file ? `/uploads/${path.basename(req.file.path)}` : null;
    const flag = new Flag({
      shopkeeperId: req.user._id,
      companyId: req.body.companyId,
      productId: req.body.productId,
      quantityBought: Number(req.body.quantityBought),
      quantitySold: Number(req.body.quantitySold),
      date: req.body.date,
      receiptPath,
      rating: Number(req.body.rating),
      remarks: req.body.remarks || '',
    });
    
    await flag.save();
    
    // Automatically update analytics
    try {
      await AnalyticsService.updateAnalyticsFromFlag({
        companyId: req.body.companyId,
        productId: req.body.productId,
        quantityBought: Number(req.body.quantityBought),
        quantitySold: Number(req.body.quantitySold),
        date: req.body.date
      });
    } catch (analyticsError) {
      console.error('Analytics update error (non-blocking):', analyticsError);
      // Analytics error shouldn't block flag creation
    }
    
    res.status(201).json({ message: 'Flag created', flag });
  } catch (error) {
    console.error('Create flag error:', error);
    res.status(500).json({ error: 'Failed to create flag' });
  }
});

// Get flags for current shopkeeper
router.get('/mine', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const flags = await Flag.find({ shopkeeperId: req.user._id })
      .populate('companyId', 'companyInfo.companyName')
      .populate('productId', 'name')
      .sort({ createdAt: -1 });
    res.json(flags);
  } catch (error) {
    console.error('Get my flags error:', error);
    res.status(500).json({ error: 'Failed to get flags' });
  }
});

module.exports = router;
