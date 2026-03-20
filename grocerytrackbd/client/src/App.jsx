import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from 'notistack';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            
            {/* Admin Protected Route */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            
            <Route path="/" element={<HomePage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </SnackbarProvider>
  );
}

export default App;