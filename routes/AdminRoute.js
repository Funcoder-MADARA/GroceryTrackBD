import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // Example: retrieving user info from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (user && user.role === 'admin') {
    return children;
  }

  // Redirect to login if not admin
  return <Navigate to="/login" />;
};

export default AdminRoute;