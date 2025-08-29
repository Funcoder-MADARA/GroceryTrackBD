import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useQuery } from 'react-query';
import { notificationsAPI } from '../services/api';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Get notification count
  const { data: notificationStatsResponse } = useQuery(
    'notificationStats',
    () => notificationsAPI.getNotificationStats(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
  const notificationStats = notificationStatsResponse?.data || notificationStatsResponse;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user?.role === 'shopkeeper' && user?.shopkeeperInfo?.shopName) {
      return user.shopkeeperInfo.shopName;
    }
    if (user?.role === 'company_rep' && user?.companyInfo?.companyName) {
      return user.companyInfo.companyName;
    }
    return user?.name || 'User';
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'shopkeeper':
        return 'Shop Keeper';
      case 'company_rep':
        return 'Company Representative';
      case 'delivery_worker':
        return 'Delivery Worker';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">
              GroceryTrackBD
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Bell className="h-6 w-6" />
            {notificationStats?.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-error-500 text-white text-xs flex items-center justify-center">
                {notificationStats.unreadCount > 99 ? '99+' : notificationStats.unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <div className="flex items-center space-x-3">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName()}
                  </p>
                </div>
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    navigate('/analytics');
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Analytics
                               </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;