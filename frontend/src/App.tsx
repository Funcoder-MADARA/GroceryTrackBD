import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PendingApproval from './pages/auth/PendingApproval';
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


  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
