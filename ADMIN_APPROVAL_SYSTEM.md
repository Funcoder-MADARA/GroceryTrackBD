# Admin Approval System

## Overview

The GroceryTrackBD application now includes a comprehensive admin approval system for new user registrations. This system ensures that all new users must be approved by an administrator before they can access the platform.

## Features

### 1. User Registration Flow
- New users register with their information
- Account status is set to `pending` by default
- Users are redirected to a pending approval page
- No authentication token is provided until approval

### 2. Admin Management Interface
- **Pending Users Dashboard**: View all users waiting for approval
- **User Details**: See complete user information including role-specific data
- **Approve/Reject Actions**: Approve or reject users with optional reasons
- **Real-time Count**: Display pending users count with notification badges

### 3. Notification System
- **Admin Notifications**: Admins receive notifications when new users register
- **User Notifications**: Users receive notifications when their account is approved/rejected
- **Email Integration Ready**: System is prepared for email notifications

### 4. Status Management
- **Pending**: New registrations awaiting approval
- **Active**: Approved users who can access the system
- **Suspended**: Rejected users with optional reason
- **Inactive**: Deactivated accounts

## API Endpoints

### Authentication Routes

#### `POST /api/auth/register`
- **Purpose**: Register a new user
- **Response**: Returns user data with `requiresApproval: true`
- **Status**: User created with `pending` status

#### `POST /api/auth/login`
- **Purpose**: User login
- **Behavior**: Blocks login for pending/suspended users
- **Error Messages**: Clear status-specific error messages

#### `GET /api/auth/check-approval/:email`
- **Purpose**: Check approval status for a user
- **Response**: Returns current status and message

### Admin Routes

#### `GET /api/auth/pending-users-count`
- **Purpose**: Get count of pending users
- **Access**: Admin only
- **Response**: `{ pendingCount: number }`

#### `GET /api/auth/pending-users`
- **Purpose**: Get list of all pending users
- **Access**: Admin only
- **Response**: Array of pending user objects

#### `PATCH /api/auth/approve-user/:userId`
- **Purpose**: Approve a pending user
- **Access**: Admin only
- **Actions**: 
  - Sets user status to `active`
  - Creates approval notification
  - Allows user to login

#### `PATCH /api/auth/reject-user/:userId`
- **Purpose**: Reject/suspend a pending user
- **Access**: Admin only
- **Body**: `{ reason?: string }`
- **Actions**:
  - Sets user status to `suspended`
  - Stores rejection reason
  - Creates rejection notification

## Frontend Components

### 1. Registration Flow
- **Register.tsx**: Updated to handle pending approval response
- **PendingApproval.tsx**: New page for users waiting for approval
- **AuthContext.tsx**: Enhanced to handle approval status checking

### 2. Admin Interface
- **Users.tsx**: Complete admin dashboard for user management
- **Sidebar.tsx**: Notification badge for pending users count
- **usePendingUsers.ts**: Custom hook for managing pending count

### 3. User Experience
- **Clear Messaging**: Users understand their account status
- **Status Checking**: Users can check their approval status
- **Automatic Redirects**: Proper navigation based on account status

## Database Schema Updates

### User Model (`models/User.js`)
```javascript
// Added fields
suspensionReason: {
  type: String,
  default: null
}
```

### Notification Model (`models/Notification.js`)
```javascript
// Added notification types
'user_registration',
'user_approved', 
'user_rejected'
```

## Security Features

### 1. Access Control
- Admin-only routes protected with role verification
- Pending users cannot access protected resources
- Suspended users are blocked from login

### 2. Data Validation
- Input validation for all registration fields
- Role-specific information validation
- Phone number format validation (Bangladeshi format)

### 3. Error Handling
- Graceful error handling for all operations
- Clear error messages for users
- Logging for debugging and monitoring

## Testing

### Manual Testing
1. Register a new user
2. Verify user status is `pending`
3. Try to login (should fail)
4. Login as admin
5. View pending users
6. Approve the user
7. Verify user can now login

### Automated Testing
Run the test script:
```bash
node test-admin-approval.js
```

## Configuration

### Environment Variables
- `JWT_SECRET`: For token generation
- `JWT_EXPIRE`: Token expiration time

### Default Settings
- New users: `status: 'pending'`
- Admin users: `status: 'active'` (bypass approval)
- Notification priority: `medium` for registrations, `high` for approvals/rejections

## Future Enhancements

### 1. Email Notifications
- Send approval/rejection emails to users
- Send notification emails to admins for new registrations
- Email templates for different scenarios

### 2. Bulk Operations
- Bulk approve/reject multiple users
- Import users from CSV/Excel
- Export user data

### 3. Advanced Features
- Approval workflows with multiple admin levels
- Automatic approval based on criteria
- User verification (email, phone, documents)
- Approval history and audit logs

### 4. Analytics
- Registration approval rates
- Time to approval metrics
- Rejection reason analytics
- User onboarding funnel

## Troubleshooting

### Common Issues

1. **User can't login after registration**
   - Check if user status is `pending`
   - Verify admin has approved the user

2. **Admin can't see pending users**
   - Verify admin role and permissions
   - Check authentication token

3. **Notifications not working**
   - Check notification model configuration
   - Verify admin user exists in database

### Debug Steps

1. Check user status in database
2. Verify admin permissions
3. Test API endpoints directly
4. Check server logs for errors
5. Verify frontend authentication state

## Support

For issues or questions about the admin approval system:
1. Check the troubleshooting section
2. Review server logs
3. Test with the provided test script
4. Contact the development team
