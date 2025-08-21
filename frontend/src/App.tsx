import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Orders from './pages/orders/Orders';
import OrderDetails from './pages/orders/OrderDetails';
import CreateOrder from './pages/orders/CreateOrder';
import OrderHistory from './pages/orders/OrderHistory';
import Products from './pages/products/Products';
import ProductDetails from './pages/products/ProductDetails';
import Deliveries from './pages/delivery/Deliveries';
import DeliveryDetails from './pages/delivery/DeliveryDetails';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Flags from './pages/Flags';
import Users from './pages/admin/Users';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/create" element={<CreateOrder />} />
        <Route path="/orders/history" element={<OrderHistory />} />
        <Route path="/orders/:orderNumber" element={<OrderDetails />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetails />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/deliveries/:deliveryId" element={<DeliveryDetails />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/flags" element={<Flags />} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
