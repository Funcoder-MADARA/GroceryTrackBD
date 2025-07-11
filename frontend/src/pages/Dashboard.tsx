import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  TrendingUp, 
  Bell,
  User,
  Building,
  MapPin,
  Clock
} from 'lucide-react';
import { ordersAPI, analyticsAPI, notificationsAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data based on user role
  const { data: shopkeeperStatsResponse } = useQuery(
    ['shopkeeperStats'],
    () => analyticsAPI.getShopkeeperAnalytics(),
    {
      enabled: user?.role === 'shopkeeper',
    }
  );
  const shopkeeperStats = shopkeeperStatsResponse?.data || shopkeeperStatsResponse;

  const { data: companyStatsResponse } = useQuery(
    ['companyStats'],
    () => analyticsAPI.getCompanyAnalytics(),
    {
      enabled: user?.role === 'company_rep',
    }
  );
  const companyStats = companyStatsResponse?.data || companyStatsResponse;

  const { data: notificationsResponse } = useQuery(
    ['notifications'],
    () => notificationsAPI.getNotifications({ limit: 5 }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
  const notifications = notificationsResponse?.data || notificationsResponse;

  const { data: recentOrdersResponse } = useQuery(
    ['recentOrders'],
    () => user?.role === 'shopkeeper' 
      ? ordersAPI.getShopkeeperOrders({ limit: 5 })
      : ordersAPI.getCompanyOrders({ limit: 5 }),
    {
      enabled: ['shopkeeper', 'company_rep'].includes(user?.role || ''),
    }
  );
  const recentOrders = recentOrdersResponse?.data || recentOrdersResponse;

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

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `${greeting}, ${getUserDisplayName()}!`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getWelcomeMessage()}
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome to your {getRoleDisplayName().toLowerCase()} dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{user?.area}, {user?.city}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'shopkeeper' && shopkeeperStats && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {shopkeeperStats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ৳{shopkeeperStats?.totalSpent?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {shopkeeperStats?.completedOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ৳{shopkeeperStats?.averageOrderValue?.toFixed(0) || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {user?.role === 'company_rep' && companyStats && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {companyStats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ৳{companyStats?.totalRevenue?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {companyStats?.totalDeliveries || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {companyStats?.deliverySuccessRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {user?.role === 'delivery_worker' && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Assigned Deliveries</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {user?.deliveryWorkerInfo?.availability || 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {['shopkeeper', 'company_rep'].includes(user?.role || '') && recentOrders && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            </div>
            <div className="p-6">
              {recentOrders?.orders?.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.orders.slice(0, 5).map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          ৳{order.finalAmount?.toLocaleString()}
                        </p>
                      </div>
                      <span className={`badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
          </div>
          <div className="p-6">
            {notifications?.notifications?.length > 0 ? (
              <div className="space-y-4">
                {notifications.notifications.slice(0, 5).map((notification: any) => (
                  <div key={notification._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Bell className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'shopkeeper' && (
            <>
              <button className="btn btn-primary">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Place New Order
              </button>
              <button className="btn btn-secondary">
                <TrendingUp className="h-5 w-5 mr-2" />
                View Analytics
              </button>
              <button className="btn btn-secondary">
                <Bell className="h-5 w-5 mr-2" />
                Check Notifications
              </button>
            </>
          )}

          {user?.role === 'company_rep' && (
            <>
              <button className="btn btn-primary">
                <Package className="h-5 w-5 mr-2" />
                Manage Products
              </button>
              <button className="btn btn-secondary">
                <ShoppingCart className="h-5 w-5 mr-2" />
                View Orders
              </button>
              <button className="btn btn-secondary">
                <TrendingUp className="h-5 w-5 mr-2" />
                View Analytics
              </button>
            </>
          )}

          {user?.role === 'delivery_worker' && (
            <>
              <button className="btn btn-primary">
                <Truck className="h-5 w-5 mr-2" />
                View Deliveries
              </button>
              <button className="btn btn-secondary">
                <User className="h-5 w-5 mr-2" />
                Update Status
              </button>
              <button className="btn btn-secondary">
                <Bell className="h-5 w-5 mr-2" />
                Check Notifications
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;