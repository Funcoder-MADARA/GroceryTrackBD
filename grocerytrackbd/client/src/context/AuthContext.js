import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/user`, {
        headers: {
          'x-auth-token': token
        }
      })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    setCurrentUser(user);
    // Navigation will be handled by the component that calls login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    // Navigation will be handled by the component that calls logout
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}