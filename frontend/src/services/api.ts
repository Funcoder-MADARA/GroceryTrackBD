import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:1591/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/me'),
    
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
};

// Order API
export const orderAPI = {
  getOrders: (page = 1, limit = 10, filters?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get('/orders/history', { params: { page, limit, ...filters } }),
    
  getOrderById: (orderId: string) =>
    api.get(`/orders/${orderId}`),
    
  updateOrderStatus: (orderId: string, status: string, notes?: string) =>
    api.patch(`/orders/${orderId}/status`, { status, notes }),
    
  createOrder: (orderData: any) =>
    api.post('/orders', orderData),
};

// Profile API
export const profileAPI = {
  getProfile: (userId: string) =>
    api.get(`/profile/${userId}`),
  
  updateProfile: (userId: string, data: any) =>
    api.put(`/profile/${userId}`, data),
  
  updateProfileImage: (userId: string, profileImage: string) =>
    api.put(`/profile/${userId}/image`, { profileImage }),
  
  getUsers: (params?: any) =>
    api.get('/profile', { params }),
  
  updateUserStatus: (userId: string, status: string) =>
    api.put(`/profile/${userId}/status`, { status }),
  
  assignAreas: (userId: string, assignedAreas: string[]) =>
    api.put(`/profile/${userId}/assign-areas`, { assignedAreas }),
  
  updateAvailability: (userId: string, availability: string) =>
    api.put(`/profile/${userId}/availability`, { availability }),
  
  getUsersByRole: (role: string, params?: any) =>
    api.get(`/profile/role/${role}`, { params }),
  
  deleteUser: (userId: string) =>
    api.delete(`/profile/${userId}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData: any) =>
    api.post('/orders', orderData),
  
  getShopkeeperOrders: (params?: any) =>
    api.get('/orders/shopkeeper', { params }),
  
  getCompanyOrders: (params?: any) =>
    api.get('/orders/company', { params }),
  
  getOrder: (orderId: string) =>
    api.get(`/orders/${orderId}`),
  
  updateOrderStatus: (orderId: string, status: string, rejectionReason?: string) =>
    api.put(`/orders/${orderId}/status`, { status, rejectionReason }),
  
  cancelOrder: (orderId: string, cancellationReason: string) =>
    api.put(`/orders/${orderId}/cancel`, { cancellationReason }),
  
  getOrdersByArea: (area: string, params?: any) =>
    api.get(`/orders/area/${area}`, { params }),
  
  getAllOrders: (params?: any) =>
    api.get('/orders', { params }),
    
  getOrderHistory: (params?: any) =>
    api.get('/orders/history', { params }),
    
  getOrderTimeline: (orderId: string) =>
    api.get(`/orders/${orderId}/timeline`),
    
  getCompanyProducts: (companyId: string) =>
    api.get(`/products/company/${companyId}`),
};

// Deliveries API
export const deliveriesAPI = {
  createDelivery: (deliveryData: any) =>
    api.post('/delivery', deliveryData),
  
  getWorkerDeliveries: (params?: any) =>
    api.get('/delivery/worker', { params }),
  
  getCompanyDeliveries: (params?: any) =>
    api.get('/delivery/company', { params }),
  
  getDelivery: (deliveryId: string) =>
    api.get(`/delivery/${deliveryId}`),
  
  updateDeliveryStatus: (deliveryId: string, status: string, issues?: any[]) =>
    api.put(`/delivery/${deliveryId}/status`, { status, issues }),
  
  completeDelivery: (deliveryId: string, proof: any) =>
    api.put(`/delivery/${deliveryId}/complete`, proof),
  
  getAvailableWorkers: (area: string) =>
    api.get(`/delivery/workers/available/${area}`),
  
  getDeliveriesByArea: (area: string, params?: any) =>
    api.get(`/delivery/area/${area}`, { params }),
  
  getAllDeliveries: (params?: any) =>
    api.get('/delivery', { params }),
};

// Analytics API
export const analyticsAPI = {
  // Company Analytics
  getCompanyPerformanceSummary: (companyId: string, params?: any) =>
    api.get(`/analytics/company/${companyId}/summary`, { params }),
  
  getCompanyRiskAssessment: (companyId: string) =>
    api.get(`/analytics/company/${companyId}/risk`),
  
  getCompanyWeeklyAnalytics: (companyId: string, params?: any) =>
    api.get(`/analytics/company/${companyId}/weekly`, { params }),
  
  getCompanyQuarterlyAnalytics: (companyId: string, params?: any) =>
    api.get(`/analytics/company/${companyId}/quarterly`, { params }),
  
  getCompanyPerformance: (companyId: string, params?: any) =>
    api.get(`/analytics/company/${companyId}/performance`, { params }),
  
  getCompanyAnalyticsByRange: (companyId: string, params?: any) =>
    api.get(`/analytics/company/${companyId}/range`, { params }),
  
  getCompanyDashboard: (companyId: string) =>
    api.get(`/analytics/dashboard/${companyId}`),
  
  // Product Analytics
  getProductPerformanceTrends: (productId: string, params?: any) =>
    api.get(`/analytics/product/${productId}/trends`, { params }),
  
  // Shopkeeper Analytics
  getShopkeeperAnalytics: (shopkeeperId: string, params?: any) =>
    api.get(`/analytics/shopkeeper/${shopkeeperId}`, { params }),
  
  // Legacy endpoints for backward compatibility
  getShopkeeperAnalyticsLegacy: (params?: any) =>
    api.get('/analytics/shopkeeper', { params }),
  
  getCompanyAnalyticsLegacy: (params?: any) =>
    api.get('/analytics/company', { params }),
  
  getAreaAnalytics: (area: string, params?: any) =>
    api.get(`/analytics/area/${area}`, { params }),
  
  getWorkerAnalytics: (workerId: string, params?: any) =>
    api.get(`/analytics/delivery-worker/${workerId}`, { params }),
  
  getSystemAnalytics: (params?: any) =>
    api.get('/analytics/system', { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),
  
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
  
  getNotificationStats: () =>
    api.get('/notifications/stats'),
  
  getNotificationsByType: (type: string, params?: any) =>
    api.get(`/notifications/type/${type}`, { params }),
  
  getAllNotifications: (params?: any) =>
    api.get('/notifications/all', { params }),
  
  bulkDeleteNotifications: (notificationIds: string[]) =>
    api.delete('/notifications/bulk', { data: { notificationIds } }),
  
  createNotification: (notificationData: any) =>
    api.post('/notifications', notificationData),
};

// Products API (for future use)
export const productsAPI = {
  getProducts: (params?: any) =>
    api.get('/products', { params }),
  
  getProduct: (productId: string) =>
    api.get(`/products/${productId}`),
  
  createProduct: (productData: any) =>
    api.post('/products', productData),
  
  updateProduct: (productId: string, productData: any) =>
    api.put(`/products/${productId}`, productData),
  
  deleteProduct: (productId: string) =>
    api.delete(`/products/${productId}`),
};

// Flags API
export const flagsAPI = {
  createFlag: (flagData: FormData) =>
    api.post('/flags', flagData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getMyFlags: () =>
    api.get('/flags/mine'),
};

export default api;