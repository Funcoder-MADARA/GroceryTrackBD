import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

// Enhanced TypeScript interfaces
interface OrderItem {
  productName: string;
  quantity: number;
  totalPrice: number;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  companyName: string;
  shopName: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  createdAt: string;
  deliveredAt?: string | null;
  items: OrderItem[];
}

interface OrderStats {
  totalOrders: number;
  statusCounts: Record<string, number>;
  totalAmount: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface OrderFilters {
  status: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

interface OrderHistoryResponse {
  orders: OrderSummary[];
  pagination: PaginationInfo;
  summary: OrderStats;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    statusCounts: {},
    totalAmount: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchTerm: '',
  });



  const fetchOrders = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...filters,
      };
      
      const response = await ordersAPI.getOrderHistory(params);
      const data: OrderHistoryResponse = response.data;
      
      // Ensure data integrity - items array should never be undefined
      const processedOrders = data.orders.map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : [],
        companyName: order.companyName || 'N/A',
        shopName: order.shopName || 'N/A',
        totalAmount: order.totalAmount || 0
      }));
      
      setOrders(processedOrders);
      setPagination(data.pagination);
      setStats(data.summary);
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch order history';
      toast.error(errorMessage);
      
      // Set empty state on error
      setOrders([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
      setStats({
        totalOrders: 0,
        statusCounts: {},
        totalAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

useEffect(() => {
  fetchOrders(1); // always fetch page 1 when filters change
}, [fetchOrders]);

// Initial load
useEffect(() => {
  fetchOrders(1);
}, []);

const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFilters(prev => ({ ...prev, [name]: value }));
};

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchOrders(newPage);
  };
  

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Link
            to="/orders/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Order
          </Link>
        </div>
        
        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500">Total Orders</h3>
            <p className="text-2xl font-semibold">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500">Total Amount</h3>
            <p className="text-2xl font-semibold">৳{stats.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500">Pending Orders</h3>
            <p className="text-2xl font-semibold text-yellow-600">{stats.statusCounts.pending || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm text-gray-500">Delivered Orders</h3>
            <p className="text-2xl font-semibold text-green-600">{stats.statusCounts.delivered || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            placeholder="Start Date"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            placeholder="End Date"
          />

          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="p-2 border rounded"
            placeholder="Search orders..."
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.orderNumber}`}
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                  <p className="text-gray-600">{order.companyName}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Created: {formatDate(order.createdAt)}
                    </p>
                    {order.deliveredAt && (
                      <p className="text-sm text-gray-500">
                        Delivered: {formatDate(order.deliveredAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="mt-2 text-lg font-semibold">৳{order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Items:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-800">{item.productName}</span>
                      <span className="text-gray-500"> × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className={`px-4 py-2 rounded ${
              pagination.hasPrevPage
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className={`px-4 py-2 rounded ${
              pagination.hasNextPage
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
