import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

interface TimelineEvent {
  status: string;
  timestamp: string;
  note: string;
  actor: {
    name: string;
    role: string;
  };
}

interface OrderDetails {
  orderNumber: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  deliveryArea: string;
  deliveryAddress: string;
  deliveryCity: string;
  paymentMethod: string;
  preferredDeliveryDate: string;
  deliveryInstructions?: string;
  notes?: string;
  timeline: TimelineEvent[];
  shopkeeper: {
    name: string;
    shopName: string;
    phone: string;
  };
  company: {
    name: string;
    companyName: string;
    phone: string;
  };
  deliveryWorker?: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

const OrderDetails: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showWorkerAssignment, setShowWorkerAssignment] = useState(false);
  const [deliveryWorkers, setDeliveryWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log("Fetching order details for:", orderNumber);
      const response = await ordersAPI.getOrder(orderNumber!);
      console.log("Order details response:", response.data);
      setOrder(response.data.order);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      await ordersAPI.updateOrderStatus(orderNumber!, newStatus);
      toast.success('Order status updated successfully');
      fetchOrderDetails();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Order Not Found</h2>
          <p className="mt-2 text-gray-600">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order #{order.orderNumber}</h1>
          <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="divide-y">
              {(order.items || []).map((item, index) => (
                <div key={index} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.productName}</h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.unitPrice)} × {item.quantity} {item.unit}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (5%):</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span>{formatCurrency(order.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-6">
              {(order.timeline || []).map((event, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-500"></div>
                  {index !== (order.timeline || []).length - 1 && (
                    <div className="absolute left-2 top-6 w-0.5 h-full -ml-px bg-blue-200"></div>
                  )}
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-600">{event.note}</p>
                  <p className="text-sm text-gray-500">
                    by {event.actor.name} ({event.actor.role})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Delivery Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Delivery Address:</p>
                <p className="font-medium">{order.deliveryAddress}</p>
                <p className="text-sm">{order.deliveryArea}, {order.deliveryCity}</p>
              </div>
              <div>
                <p className="text-gray-600">Preferred Delivery Date:</p>
                <p className="font-medium">{formatDate(order.preferredDeliveryDate)}</p>
              </div>
              {order.deliveryInstructions && (
                <div>
                  <p className="text-gray-600">Instructions:</p>
                  <p className="text-sm">{order.deliveryInstructions}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Payment Method:</p>
                <p className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Shopkeeper:</p>
                <p className="font-medium">{order.shopkeeper.name}</p>
                <p className="text-sm">{order.shopkeeper.shopName}</p>
                <p className="text-sm text-blue-600">{order.shopkeeper.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Company:</p>
                <p className="font-medium">{order.company.name}</p>
                <p className="text-sm">{order.company.companyName}</p>
                <p className="text-sm text-blue-600">{order.company.phone}</p>
              </div>
              {order.deliveryWorker && (
                <div>
                  <p className="text-gray-600">Delivery Worker:</p>
                  <p className="font-medium">{order.deliveryWorker.name}</p>
                  <p className="text-sm text-blue-600">{order.deliveryWorker.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {user && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              
              {/* Company Rep Actions */}
              {user.role === 'company_rep' && order.status === 'pending' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve Order
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Order
                  </button>
                </div>
              )}
              
              {/* Company Rep - Assign Delivery Worker */}
              {(user.role === 'company_rep' || user.role === 'admin') && order.status === 'approved' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">Assign to delivery worker:</p>
                  <button
                    onClick={() => setShowWorkerAssignment(true)}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Assign Delivery Worker
                  </button>
                </div>
              )}
              
              {/* Delivery Worker Actions */}
              {user.role === 'delivery_worker' && order.status === 'assigned' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected_by_worker')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Order
                  </button>
                </div>
              )}
              
              {user.role === 'delivery_worker' && order.status === 'accepted' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate('picked_up')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark as Picked Up
                  </button>
                </div>
              )}
              
              {user.role === 'delivery_worker' && order.status === 'picked_up' && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate('delivered')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                </div>
              )}
              
              {/* Shopkeeper Actions */}
              {user.role === 'shopkeeper' && ['pending', 'approved'].includes(order.status) && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
              
              {/* Admin Actions */}
              {user.role === 'admin' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">Admin Controls:</p>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('approved')}
                        disabled={updating}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Force Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={updating}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Force Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Worker Assignment Modal */}
      {showWorkerAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Assign Delivery Worker</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will assign the order to a delivery worker and change status to 'assigned'.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowWorkerAssignment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // For now, we'll just call the status update to 'assigned'
                    // In a full implementation, you'd select a worker first
                    await handleStatusUpdate('assigned');
                    setShowWorkerAssignment(false);
                  } catch (error) {
                    toast.error('Failed to assign delivery worker');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
