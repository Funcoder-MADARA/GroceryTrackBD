import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const ProtectedRoute = ({ roles = [] }) => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    enqueueSnackbar('You do not have permission to view this page', { variant: 'error' });
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;