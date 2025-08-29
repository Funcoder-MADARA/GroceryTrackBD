# 🚀 GROCERYTRACKBD - COMPLETE PROJECT DOCUMENTATION

## 📋 TABLE OF CONTENTS
1. [Business Analysis](#business-analysis)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Feature Documentation](#feature-documentation)
5. [Code Flow & Syntax](#code-flow--syntax)
6. [Viva Preparation Guide](#viva-preparation-guide)

---

## 🏢 BUSINESS ANALYSIS

### Business Need
GroceryTrackBD addresses inefficiencies in Bangladesh's grocery supply chain by providing a digital platform connecting shopkeepers, manufacturers, and delivery workers.

### Business Requirements
- Digital Order Management
- Real-time Delivery Tracking
- Quality Control
- Analytics
- Role-based Access

### Business Value
- Cost Reduction
- Efficiency
- Transparency
- Quality Improvement
- Data-Driven Decisions

### Special Issues & Constraints
- Internet Connectivity
- Digital Literacy
- Mobile-First Design
- Security
- Scalability

---

## 🎯 PROJECT OVERVIEW

### Core Modules
1. User & Profile Management
2. Order & Inventory Management
3. Delivery Management
4. Area-Based Analytics
5. Notifications & History

### User Roles
- Shopkeeper
- Company Manager
- Delivery Worker
- Admin

---

## 🛠 TECHNOLOGY STACK

### Frontend
- React 18, TypeScript, Tailwind CSS
- React Router, React Hook Form
- React Query, React Hot Toast

### Backend
- Node.js, Express.js, MongoDB
- Mongoose, JWT, Multer, Bcrypt

---

## 🔥 FEATURE DOCUMENTATION

### FEATURE 1: PROFILE VIEW & EDIT

#### Files Involved:
- `frontend/src/pages/Profile.tsx` - Frontend form
- `frontend/src/services/api.ts` - API service
- `routes/profile.js` - Backend route
- `models/User.js` - Database model
- `middleware/auth.js` - Authentication

#### Code Flow:
1. User fills form in Profile.tsx
2. Form calls profileAPI.updateProfile()
3. API makes PUT request to /profile/:userId
4. Backend validates and updates database
5. Updated data sent back to frontend

---

### FEATURE 2: PRODUCT FLAGGING

#### Files Involved:
- `frontend/src/pages/Flags.tsx` - Frontend form
- `frontend/src/services/api.ts` - API service
- `routes/flags.js` - Backend route
- `models/Flag.js` - Database model

#### Code Flow:
1. Shopkeeper selects company/product
2. Enters reason and uploads receipt
3. Form calls flagsAPI.createFlag()
4. Backend creates Flag document
5. Success response sent back

---

### FEATURE 3: DELIVERY COMPLETION

#### Files Involved:
- `frontend/src/pages/delivery/Deliveries.tsx` - Main interface
- `frontend/src/components/CompletionModal.tsx` - Form
- `frontend/src/services/api.ts` - API service
- `routes/delivery.js` - Backend route
- `models/Delivery.js` - Database model

#### Code Flow:
1. Worker clicks "Complete Delivery"
2. CompletionModal opens with form
3. Form calls deliveriesAPI.completeDelivery()
4. Backend updates delivery status
5. Related order status updated
6. Success response sent back

---

### FEATURE 4: NOTIFICATIONS

#### Files Involved:
- `frontend/src/pages/Notifications.tsx` - Interface
- `frontend/src/services/api.ts` - API service
- `routes/notifications.js` - Backend route
- `models/Notification.js` - Database model

#### Code Flow:
1. User opens Notifications page
2. Component calls getNotifications()
3. API makes GET request with filters
4. Backend queries database
5. Notifications returned with pagination
6. User can mark as read/delete

---

## 🔄 CODE FLOW & SYNTAX

### FRONTEND → API → BACKEND → DATABASE FLOW

#### React/TypeScript Syntax:
```typescript
const [formData, setFormData] = useState({
  name: user?.name || '',
  email: user?.email || ''
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await profileAPI.updateProfile(user._id, formData);
    updateUser(response.data);
    toast.success('Profile updated!');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Update failed');
  }
};
```

#### Express.js Syntax:
```javascript
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, updateData, { new: true, runValidators: true }
    );
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});
```

#### Mongoose Syntax:
```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  }
});
```

---

## 🎯 VIVA PREPARATION GUIDE

### CRITICAL SYNTAX PATTERNS:

#### State Management:
```typescript
const [state, setState] = useState<Type>(initialValue);
```

#### Event Handling:
```typescript
const handleClick = (e: React.MouseEvent) => {};
```

#### Async Functions:
```typescript
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    setData(response.data);
  } catch (error) {
    console.error(error);
  }
};
```

#### API Calls:
```typescript
// GET
const response = await api.get('/endpoint', { params: { key: value } });

// POST
const response = await api.post('/endpoint', data);

// PUT
const response = await api.put('/endpoint/id', data);

// DELETE
const response = await api.delete('/endpoint/id');
```

### VIVA SUCCESS FORMULA:
1. Know the EXACT syntax
2. Understand the data flow
3. Memorize file names
4. Practice code modification
5. Explain error handling

### COMMON VIVA QUESTIONS:

**Q: "How would you add a new field to the user profile?"**
**A:** "Modify models/User.js to add the field with validation, update routes/profile.js to handle it, and modify frontend/src/pages/Profile.tsx to include the new input."

**Q: "What happens when a delivery is marked complete?"**
**A:** "Frontend sends PUT request, backend updates delivery status to 'delivered', stores proof, updates order status, and sends notifications."

**Q: "How do you handle file uploads?"**
**A:** "Use Multer middleware, store files in uploads directory, convert images to base64 for database storage."

**Q: "Explain the authentication flow."**
**A:** "Users login, backend returns JWT token, frontend stores token, includes it in API requests, backend middleware validates token."

---

## 📚 KEY FILES TO STUDY:
- `server.js` - Main server configuration
- `middleware/auth.js` - Authentication logic
- `middleware/validation.js` - Input validation
- `services/analyticsService.js` - Business logic
- `controllers/` - Business logic controllers

## 🔗 DATABASE RELATIONSHIPS:
- User → Order (one-to-many)
- Order → Delivery (one-to-one)
- User → Flag (one-to-many)
- Product → Flag (one-to-many)
- User → Notification (one-to-many)

## 🌐 API ENDPOINTS:
- `/auth/*` - Authentication
- `/profile/*` - User profile
- `/products/*` - Product management
- `/orders/*` - Order management
- `/delivery/*` - Delivery management
- `/flags/*` - Product flagging
- `/notifications/*` - Notifications
- `/analytics/*` - Analytics

---

**🎯 REMEMBER: Your faculty wants you to UNDERSTAND the code structure and be able to MODIFY it. Focus on syntax patterns and data flow!**
