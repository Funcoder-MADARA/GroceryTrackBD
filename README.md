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

## 🙏 Acknowledgments

- React and Node.js communities
- TailwindCSS for the beautiful UI framework
- MongoDB for the database solution
- All contributors and testers

---

**GroceryTrackBD** - Connecting Bangladesh's grocery ecosystem through technology.

## Order & Profile API (Express + MongoDB)

- Start the server on your student ID last 4 digits by setting `PORT` in `.env`.
- MongoDB via Docker: `docker compose up -d`.

### Setup
1. Copy `.env.example` to `.env` and set `PORT` to your student ID last 4 digits.
2. Start MongoDB: `docker compose up -d`.
3. Seed sample data: `npm run seed`.
4. Start server: `npm run dev` or `npm start`.

### Endpoints
Base URL: `http://localhost:PORT/api/v1`

- GET `/users/:userId` — Get profile.
- PUT `/users/:userId` — Update profile.
- POST `/orders` — Place an order.
- GET `/orders?userId=...` — Order history for a user.
- POST `/orders/:orderId/reorder` — Duplicate a previous order.

### Example cURL

- Get profile:
```
curl -s http://localhost:1234/api/v1/users/<USER_ID>
```

- Update profile:
```
curl -s -X PUT http://localhost:1234/api/v1/users/<USER_ID> \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"New Name","shopType":"Large"}'
```

- Place order:
```
curl -s -X POST http://localhost:1234/api/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{"userId":"<USER_ID>","companyName":"Jamuna Export Limited","items":[{"productId":"<PRODUCT_ID>","quantity":12}]}'
```

- Get order history:
```
curl -s "http://localhost:1234/api/v1/orders?userId=<USER_ID>"
```

### Postman
A Postman collection is available in `docs/Postman_collection.json`. Import it, set the `PORT`, `USER_ID`, and `PRODUCT_ID` variables, send requests, and capture screenshots.
