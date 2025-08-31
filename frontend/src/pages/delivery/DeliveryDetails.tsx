import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveriesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  User, 
  Building,
  Navigation,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `BDT ${amount ?? 0}`;
  }
};

interface Product {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface DeliveryItem {
  _id: string;
  deliveryNumber: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  assignedAt: string;
  deliveredAt?: string;
  order: {
    _id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
  };
  products: Product[];
  addresses: {
    pickup: string;
    delivery: string;
  };
  route?: {
    distance: number;
    estimatedTime: number;
    routePoints: Array<{
      lat: number;
      lng: number;
      address: string;
    }>;
  };
  customer: {
    _id: string;
    name: string;
    phone: string;
    area: string;
    address: string;
  };
  company: {
    _id: string;
    name: string;
    address: string;
    area: string;
  };
  deliveryWorker: {
    _id: string;
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
  };
  paymentMethod: string;
  amountToCollect: number;
  deliveryInstructions?: string;
  issues: Array<{
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface AreaGroup {
  area: string;
  deliveries: DeliveryItem[];
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  failedDeliveries: number;
}

interface Statistics {
  totalAreas: number;
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  failedDeliveries: number;
}

const DeliveryDetails: React.FC = () => {
  const { user } = useAuth();
  const [deliveryGroups, setDeliveryGroups] = useState<AreaGroup[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'returned', label: 'Returned' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />;
      case 'picked_up': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'returned': return <Navigation className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching delivery details...', {
        statusFilter,
        dateFromFilter,
        dateToFilter,
        searchFilter,
        userRole: user?.role
      });

      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFromFilter) params.dateFrom = dateFromFilter;
      if (dateToFilter) params.dateTo = dateToFilter;

      const response = await deliveriesAPI.getDeliveryDetailsByArea(params);
      
      console.log('API Response:', response.data);
      
      if (response.data && response.data.success) {
        let filteredData = response.data.data || [];
        
        // Apply search filter
        if (searchFilter && filteredData.length > 0) {
          filteredData = filteredData.map((areaGroup: AreaGroup) => ({
            ...areaGroup,
            deliveries: areaGroup.deliveries.filter(delivery => 
              delivery.deliveryNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
              delivery.customer.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
              delivery.company.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
              delivery.deliveryWorker.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
              delivery.products.some(product => 
                product.name.toLowerCase().includes(searchFilter.toLowerCase())
              )
            )
          })).filter((areaGroup: AreaGroup) => areaGroup.deliveries.length > 0);
        }

        setDeliveryGroups(filteredData);
        setStatistics(response.data.statistics || {
          totalAreas: 0,
          totalDeliveries: 0,
          completedDeliveries: 0,
          pendingDeliveries: 0,
          failedDeliveries: 0
        });
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('Delivery details fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch delivery details';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set empty state for better UX
      setDeliveryGroups([]);
      setStatistics({
        totalAreas: 0,
        totalDeliveries: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0,
        failedDeliveries: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryDetails();
  }, [statusFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    // Debounce search filter
    const timeoutId = setTimeout(() => {
      if (searchFilter !== '') {
        fetchDeliveryDetails();
      } else {
        fetchDeliveryDetails();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchFilter]);

  const toggleAreaExpansion = (area: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(area)) {
      newExpanded.delete(area);
    } else {
      newExpanded.add(area);
    }
    setExpandedAreas(newExpanded);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
          <p className="text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDeliveryDetails}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Debug Info</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p><strong>User:</strong> {user?.name} ({user?.role})</p>
                <p><strong>Delivery Groups:</strong> {deliveryGroups.length}</p>
                <p><strong>Statistics:</strong> {statistics ? JSON.stringify(statistics) : 'null'}</p>
                <p><strong>Loading:</strong> {loading.toString()}</p>
                <p><strong>Error:</strong> {error || 'none'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Details by Area</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive view of deliveries organized by geographical areas
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Areas</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalAreas}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalDeliveries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.completedDeliveries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pendingDeliveries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.failedDeliveries}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Delivery number, customer, company..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Groups by Area */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {deliveryGroups.length === 0 ? (
          <div className="bg-white rounded-lg p-8 shadow text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deliveries Found</h3>
            <p className="text-gray-600">No deliveries match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveryGroups.map((areaGroup) => (
              <div key={areaGroup.area} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Area Header */}
                <div 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                  onClick={() => toggleAreaExpansion(areaGroup.area)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{areaGroup.area}</h3>
                        <p className="text-sm text-gray-600">
                          {areaGroup.totalDeliveries} deliveries • {areaGroup.completedDeliveries} completed • {areaGroup.pendingDeliveries} pending
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Area Statistics */}
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ✓ {areaGroup.completedDeliveries}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          ⏳ {areaGroup.pendingDeliveries}
                        </span>
                        {areaGroup.failedDeliveries > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            ✗ {areaGroup.failedDeliveries}
                          </span>
                        )}
                      </div>
                      {expandedAreas.has(areaGroup.area) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Area Deliveries */}
                {expandedAreas.has(areaGroup.area) && (
                  <div className="p-4">
                    <div className="grid gap-4">
                      {areaGroup.deliveries.map((delivery) => (
                        <div key={delivery._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          {/* Delivery Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm font-medium text-gray-900">
                                {delivery.deliveryNumber}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                {getStatusIcon(delivery.status)}
                                <span className="ml-1 capitalize">{delivery.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {format(new Date(delivery.assignedAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>

                          {/* Delivery Info Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Customer & Company Info */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Customer & Company</h4>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <User className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="font-medium">{delivery.customer?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                  <span>{delivery.customer?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                                  <span>{delivery.company?.name || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Products */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Products</h4>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {(delivery.products || []).map((product, index) => (
                                  <div key={index} className="text-sm text-gray-600">
                                    <Package className="w-4 h-4 inline text-gray-400 mr-2" />
                                    {(product?.name || 'Product')} - {product?.quantity ?? 0} {product?.unit || ''}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Addresses & Route */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Route Information</h4>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-gray-500">From:</span>
                                  <p className="text-gray-700 text-xs">{delivery.addresses?.pickup || 'N/A'}</p>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">To:</span>
                                  <p className="text-gray-700 text-xs">{delivery.addresses?.delivery || 'N/A'}</p>
                                </div>
                                {delivery.route && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Distance:</span>
                                    <span className="text-gray-700 ml-1">{delivery.route.distance}km</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delivery Worker & Payment Info */}
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                              <Truck className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{delivery.deliveryWorker?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-600">
                                  {(delivery.deliveryWorker?.vehicleType || 'Vehicle')} - {(delivery.deliveryWorker?.vehicleNumber || 'N/A')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <DollarSign className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(delivery.amountToCollect || 0))}</p>
                                <p className="text-xs text-gray-600 capitalize">{(delivery.paymentMethod || '').replace('_', ' ') || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Issues (if any) */}
                          {(delivery.issues?.length || 0) > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-700">
                                  {delivery.issues?.length} Issue(s) Reported
                                </span>
                              </div>
                              <div className="space-y-1">
                                {delivery.issues?.slice(0, 2).map((issue, index) => (
                                  <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    {issue.type}: {issue.description}
                                  </p>
                                ))}
                                {(delivery.issues?.length || 0) > 2 && (
                                  <p className="text-xs text-gray-500">
                                    +{(delivery.issues?.length || 0) - 2} more issues
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Delivery Instructions */}
                          {delivery.deliveryInstructions && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-start space-x-2">
                                <Eye className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Delivery Instructions</p>
                                  <p className="text-xs text-gray-600 mt-1">{delivery.deliveryInstructions}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetails;
