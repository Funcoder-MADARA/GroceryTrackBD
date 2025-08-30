import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePendingUsers } from '../hooks/usePendingUsers';
import { X, User, Home, Package, Truck, BarChart3, Bell, Users, ShoppingCart, Flag, MapPin, Clock } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { pendingCount } = usePendingUsers();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['shopkeeper', 'company_rep', 'admin'] },
    { name: 'Order History', href: '/orders/history-simple', icon: Clock, roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin'] },
    { name: 'Flags', href: '/flags', icon: Flag, roles: ['shopkeeper'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['company_rep', 'admin'] },
    { name: 'Deliveries', href: '/deliveries', icon: Truck, roles: ['delivery_worker', 'company_rep', 'admin'] },
    { name: 'Delivery Details', href: '/deliveries/details', icon: MapPin, roles: ['delivery_worker', 'company_rep', 'admin'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['shopkeeper', 'company_rep', 'admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin'] },
    { name: 'Profile', href: '/profile', icon: User, roles: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin'] },
    { name: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">GroceryTrackBD</h2>
          <button onClick={onClose} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center space-x-3">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.href;
            const showBadge = item.name === 'Users' && pendingCount > 0;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${isActive ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <span className="flex-1">{item.name}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 text-xs text-gray-500">
          <p>Area: {user?.area}</p>
          <p>Status: {user?.status}</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
