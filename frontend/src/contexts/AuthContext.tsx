import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'shopkeeper' | 'company_rep' | 'delivery_worker' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  area: string;
  city: string;
  address: string;
  profileImage?: string;
  shopkeeperInfo?: {
    shopName: string;
    businessType: string;
    businessHours: string;
    shopSize: string;
  };
  companyInfo?: {
    companyName: string;
    companyType: string;
    businessLicense: string;
    taxId: string;
  };
  deliveryWorkerInfo?: {
    vehicleType: string;
    vehicleNumber: string;
    assignedAreas: string[];
    availability: 'available' | 'busy' | 'offline';
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ requiresApproval: boolean }>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateProfileImage: (profileImage: string) => Promise<void>;
  checkApprovalStatus: (email: string) => Promise<{ status: string; message: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'shopkeeper' | 'company_rep' | 'delivery_worker';
  area: string;
  city: string;
  address: string;
  shopkeeperInfo?: {
    shopName: string;
    businessType: string;
    businessHours: string;
    shopSize: string;
  };
  companyInfo?: {
    companyName: string;
    companyType: string;
    businessLicense: string;
    taxId: string;
  };
  deliveryWorkerInfo?: {
    vehicleType: string;
    vehicleNumber: string;
    assignedAreas: string[];
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: newToken } = response.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      console.error('Login error:', error?.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: userDataResponse, token: newToken, requiresApproval } = response.data;
      
      if (requiresApproval) {
        // Don't set user or token if approval is required
        return { requiresApproval: true };
      }
      
      setUser(userDataResponse);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { requiresApproval: false };
    } catch (error) {
      throw error;
    }
  };

  const checkApprovalStatus = async (email: string) => {
    try {
      const response = await api.get(`/auth/check-approval/${email}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put(`/profile/${user?._id}`, data);
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  // Add this function for updating profile image
  const updateProfileImage = async (profileImage: string) => {
    try {
      const response = await api.put(`/profile/${user?._id}/image`, { profileImage });
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    updateProfile,
    updateProfileImage,
    checkApprovalStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};