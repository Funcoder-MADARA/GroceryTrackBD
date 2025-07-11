const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found or token is invalid'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account not active',
        message: 'Your account is not active. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Middleware to check specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Middleware for shopkeepers only
const authorizeShopkeeper = authorizeRoles('shopkeeper');

// Middleware for company representatives only
const authorizeCompanyRep = authorizeRoles('company_rep');

// Middleware for delivery workers only
const authorizeDeliveryWorker = authorizeRoles('delivery_worker');

// Middleware for admins only
const authorizeAdmin = authorizeRoles('admin');

// Middleware to check if user can access their own data or admin
const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  const requestedUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user._id.toString() === requestedUserId) {
    return next();
  }

  return res.status(403).json({ 
    error: 'Access denied',
    message: 'You can only access your own data'
  });
};

// Middleware to check if user is active
const checkActiveStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({ 
      error: 'Account not active',
      message: 'Your account is not active. Please contact support.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeShopkeeper,
  authorizeCompanyRep,
  authorizeDeliveryWorker,
  authorizeAdmin,
  authorizeSelfOrAdmin,
  checkActiveStatus
};
