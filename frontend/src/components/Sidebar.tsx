import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Package,
  Truck,
  BarChart3,
  Bell,
  Users,
  ShoppingCart,
  Building,
  User,
  X,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin']
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      roles: ['shopkeeper', 'company_rep', 'admin']
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      roles: ['company_rep', 'admin']
    },
    {
      name: 'Deliveries',
      href: '/deliveries',
      icon: Truck,
      roles: ['delivery_worker', 'company_rep', 'admin']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['shopkeeper', 'company_rep', 'admin']
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin']
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin']
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      roles: ['admin']
    }
  ];

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || '')
  );

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

  const getUserDisplayName = () => {
    if (user?.role === 'shopkeeper' && user?.shopkeeperInfo?.shopName) {
      return user.shopkeeperInfo.shopName;
    }
    if (user?.role === 'company_rep' && user?.companyInfo?.companyName) {
      return user.companyInfo.companyName;
    }
    return user?.name || 'User';
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              GroceryTrackBD
            </h2>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Area: {user?.area}</p>
          <p>Status: {user?.status}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
