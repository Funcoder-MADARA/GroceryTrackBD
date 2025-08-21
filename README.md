# GroceryTrackBD - Bangladeshi Grocery Shop Management System

A comprehensive web application designed to streamline the grocery supply chain in Bangladesh by connecting shopkeepers, product companies, and delivery workers through a unified digital platform.

## 🚀 Features

### Core Functionality
- **Multi-role User System**: Shopkeepers, Company Representatives, and Delivery Workers
- **Order Management**: Complete order lifecycle from placement to delivery
- **Area-based Analytics**: Data aggregation and insights by geographical areas
- **Delivery Tracking**: Real-time delivery status and route optimization
- **Notification System**: Email and SMS notifications for all user types
- **Profile Management**: Role-specific profile customization

### User Roles

#### 🏪 Shop Keeper
- Browse products from different companies
- Place orders with delivery preferences
- Track order status and delivery
- View area-based trending products
- Manage shop profile and preferences

#### 🏢 Company Representative
- Approve or reject shopkeeper orders
- Manage product catalog and inventory
- Track area-wise demand and sales
- Assign deliveries to workers
- Generate production planning reports

#### 🚚 Delivery Worker
- View assigned deliveries
- Update delivery status in real-time
- Report delivery issues
- Track performance metrics
- Manage availability status

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **nodemailer** for email notifications
- **Twilio** for SMS notifications

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **TailwindCSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GroceryTrackBD
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
# See Environment Variables section below

# Start the development server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
c

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Database Setup

Make sure MongoDB is running and accessible. The application will automatically create the necessary collections when it starts.

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/grocery-track-bd

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 📁 Project Structure

```
GroceryTrackBD/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Authentication & validation
│   ├── services/         # Business logic
│   └── server.js         # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── docs/                 # Documentation
└── README.md
```

## 🗄️ Database Models

### User Model
- Basic user information (name, email, phone)
- Role-based data (shopkeeper, company, delivery worker)
- Location and status information
- Profile images and verification status

### Product Model
- Product details and categorization
- Pricing and inventory management
- Company association and availability
- Analytics data (orders, sales)

### Order Model
- Order items and pricing
- Status tracking and approval workflow
- Delivery information and preferences
- Payment and cancellation handling

### Delivery Model
- Delivery assignment and tracking
- Status updates and proof of delivery
- Issue reporting and route optimization
- Performance metrics

### Notification Model
- Multi-channel notifications (email, SMS, push)
- Role-based notification targeting
- Read status and priority levels
- Delivery tracking and analytics

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Profile Management
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update profile
- `GET /api/profile` - Get all users (admin)
- `PUT /api/profile/:userId/status` - Update user status

### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders/shopkeeper` - Get shopkeeper orders
- `GET /api/orders/company` - Get company orders
- `PUT /api/orders/:orderId/status` - Update order status

### Delivery Management
- `POST /api/delivery` - Create delivery assignment
- `GET /api/delivery/worker` - Get worker deliveries
- `PUT /api/delivery/:deliveryId/status` - Update delivery status
- `PUT /api/delivery/:deliveryId/complete` - Complete delivery

### Analytics
- `GET /api/analytics/shopkeeper` - Shopkeeper analytics
- `GET /api/analytics/company` - Company analytics
- `GET /api/analytics/area/:area` - Area-based analytics
- `GET /api/analytics/system` - System-wide analytics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/stats` - Notification statistics

## 🧪 Testing

```bash
# Backend tests
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set up a MongoDB instance (local or cloud)
2. Configure environment variables
3. Install dependencies: `npm install`
4. Build the application: `npm run build`
5. Start the server: `npm start`

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure the API base URL in production

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and CORS protection
- Role-based access control
- Secure file upload handling

## 📊 Analytics & Reporting

- Area-based demand analysis
- Product performance tracking
- Delivery efficiency metrics
- User activity monitoring
- Financial reporting and insights

## 🔮 Future Enhancements

- **AI Integration**: Demand forecasting and route optimization
- **Mobile App**: React Native application
- **Payment Gateway**: Integration with local payment systems
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: Bengali and English
- **Offline Capabilities**: Service worker implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact:
- Email: support@grocerytrackbd.com
- Documentation: [Project Wiki](wiki-url)

## 📋 Changelog

### Changelog for 21st August 2025

#### 🚀 New Features
- **Complete Delivery Worker Assignment System**: Implemented full delivery worker assignment flow from order to delivery creation
- **Area-based Worker Selection**: Added intelligent worker filtering based on delivery area for optimal assignments
- **Enhanced Delivery Completion**: Replaced URL input with native file upload system for delivery proof photos
- **Multi-format Image Support**: Added support for JPEG, PNG, GIF, and WebP image formats for delivery proof
- **Comprehensive Issue Reporting**: Enhanced delivery issue reporting with resolution tracking and status updates
- **Smart Notification System**: Automated notifications to shopkeepers and companies on delivery events

#### 🏗️ Architecture Changes
- **Enhanced Delivery Routes**: Expanded delivery API endpoints for worker assignment and management
- **Improved Order-Delivery Flow**: Seamless integration between order assignment and delivery creation
- **Notification Integration**: Added delivery event notifications to shopkeepers and companies
- **Worker Availability System**: Implemented area-based worker filtering and availability tracking

#### 🔧 Technical Improvements
- **Delivery Worker Assignment**: Complete backend implementation for assigning workers to orders
- **File Upload Handling**: Added comprehensive file type and size validation for delivery photos
- **Base64 Conversion**: Automatic conversion of uploaded images to base64 for backend storage
- **Enhanced Error Handling**: Detailed error logging and user-friendly error messages
- **Data Validation**: Fixed missing required fields in delivery creation (paymentMethod, amountToCollect)
- **API Service Updates**: Enhanced frontend API services for delivery worker management

#### 🎨 UI/UX Enhancements
- **Modern Upload Interface**: Beautiful dashed border upload area with camera icon for delivery photos
- **Interactive Elements**: Add/remove photo functionality with visual feedback
- **File Information Display**: Shows file name, size, and format details
- **Mobile Optimization**: Optimized for both desktop and mobile device usage
- **Enhanced Worker Selection**: Comprehensive modal for selecting delivery workers with area and vehicle info
- **Responsive Image Preview**: Mobile-friendly image preview with aspect ratio preservation

#### 📁 Files Modified
- `frontend/src/pages/delivery/Deliveries.tsx` - Enhanced delivery completion modal with image upload
- `frontend/src/pages/orders/OrderDetails.tsx` - Added comprehensive delivery worker assignment modal
- `frontend/src/services/api.ts` - Enhanced deliveries API with worker assignment and issue reporting
- `GroceryTrackBD/routes/delivery.js` - Implemented complete delivery worker assignment system
- `GroceryTrackBD/README.md` - Updated documentation with today's changes

#### 🔒 Backend Compatibility
- **Existing API Support**: Backend already supports base64 image storage in `deliveryProof.photo` field
- **Enhanced Delivery System**: Complete delivery worker assignment and management workflow
- **Notification System**: Automated notifications for delivery events (assigned, completed, issues)
- **Data Integrity**: Maintains existing delivery proof structure while enhancing user experience

#### 🐛 Bug Fixes
- **Fixed Delivery Worker Assignment**: Resolved "Failed to update order status" error during worker assignment
- **Corrected Property Names**: Fixed `_id` vs `id` property mismatch between frontend and backend
- **Added Required Fields**: Fixed "paymentMethod required" validation error in delivery creation
- **Enhanced Error Logging**: Added detailed error logging for better debugging and user feedback

#### 🧪 Testing & Development
- **Created Test Data**: Added `seedDeliveryTest.js` script for testing delivery features
- **Enhanced Error Handling**: Improved error messages and validation feedback
- **Comprehensive Testing**: Tested complete workflow from assignment to completion

### Changelog for 15th August 2025

#### 🚀 New Features
- **Flagging System**: Implemented complete flagging feature for shopkeepers to report unpopular products
- **Searchable Company Dropdown**: Enhanced company selection with integrated search functionality
- **Dynamic Product Filtering**: Products automatically filter based on selected company

#### 🏗️ Architecture Changes
- **Dedicated Products Route**: Created `/api/products` endpoint for product management
- **Separate Database Collections**: Established clear separation between companies and products
- **File Upload System**: Added PDF receipt upload functionality for flags
- **Advanced Analytics System**: Implemented comprehensive loss analytics tracking with real-time updates

#### ⚠️ Critical Database Structure Information

**IMPORTANT**: When working with this application, be aware of the following database architecture:

##### **Separate Collections for Companies and Products:**

1. **`Users` Collection**: 
   - Contains company representatives with `role: 'company_rep'`
   - Each company user has `companyInfo.companyName`, `name`, and `email` fields
   - **NOT** the same as products

2. **`Products` Collection**: 
   - **SEPARATE** collection that stores all products
   - Each product has a `companyId` field that references the company user
   - Products are linked to companies through this `companyId` relationship
   - **NOT** stored within the user document

##### **Key Points:**
- **Companies ≠ Products** - They are in different collections
- **Relationship**: `Product.companyId` → `User._id` (where User.role = 'company_rep')
- **API Endpoints**: 
  - Companies: `/api/profile/role/company_rep`
  - Products: `/api/products` (with `companyId` query parameter)
- **Frontend**: Use `profileAPI.getUsersByRole('company_rep')` for companies and `productsAPI.getProducts({ companyId })` for products

##### **Why This Matters:**
- The flagging feature depends on this separation
- Products are dynamically loaded based on selected company
- Don't assume products are embedded in company documents
- Always check both collections when working with company-product relationships

This architecture ensures scalability and proper data relationships between companies and their manufactured products.

#### 🔧 Technical Improvements
- **TypeScript Interface Updates**: Fixed Company interface to include `name` and `email` properties
- **API Service Integration**: Added flags API service with proper multipart/form-data handling
- **Static File Serving**: Configured uploads directory for PDF receipt storage

#### 📁 New Files Added
- `routes/flags.js` - Backend flag management endpoints
- `routes/products.js` - Dedicated product management endpoints
- `models/Flag.js` - Flag data model with virtual fields
- `models/Analytics.js` - Advanced analytics data model with risk assessment
- `services/analyticsService.js` - Analytics calculation and aggregation service
- `frontend/src/pages/Flags.tsx` - Frontend flagging interface
- `frontend/src/components/AnalyticsDashboard.tsx` - Comprehensive analytics dashboard
- `uploads/` - Directory for file uploads

#### 🐛 Bug Fixes
- Resolved 404 errors in product fetching API calls
- Fixed TypeScript compilation errors in Company interface
- Corrected API endpoint routing for products
- **Fixed Loss Percentage Calculation**: Corrected the loss calculation from incorrect 5% to proper 95% when 100 bought and 5 sold
- **Added Time-based Loss Calculation**: Implemented automatic 2% additional loss per month for products older than 6 months

## 🙏 Acknowledgments

- React and Node.js communities
- TailwindCSS for the beautiful UI framework
- MongoDB for the database solution
- All contributors and testers

---

**GroceryTrackBD** - Connecting Bangladesh's grocery ecosystem through technology.
