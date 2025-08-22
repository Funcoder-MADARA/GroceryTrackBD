import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, Search, Filter, Edit, Eye } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  area: string;
  city: string;
  address: string;
  status: string;
  createdAt: string;
  shopkeeperInfo?: any;
  companyInfo?: any;
  deliveryWorkerInfo?: any;
  suspensionReason?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentTab, setCurrentTab] = useState<'all' | 'pending'>('pending');
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserData>>({});

  useEffect(() => {
    if (currentTab === 'pending') {
      fetchPendingUsers();
      fetchPendingCount();
    } else {
      fetchAllUsers();
    }
  }, [currentTab, currentPage, filters]);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/auth/pending-users');
      setPendingUsers(response.data.pendingUsers);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role })
      });

      const response = await api.get(`/auth/all-users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/auth/pending-users-count');
      setPendingCount(response.data.pendingCount);
    } catch (error: any) {
      console.error('Failed to fetch pending count:', error);
    }
  };

  const approveUser = async (userId: string) => {
    setApproving(userId);
    try {
      await api.patch(`/auth/approve-user/${userId}`);
      toast.success('User approved successfully');
      if (currentTab === 'pending') {
        fetchPendingUsers();
        fetchPendingCount();
      } else {
        fetchAllUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setApproving(null);
    }
  };

  const rejectUser = async (userId: string) => {
    setRejecting(userId);
    try {
      await api.patch(`/auth/reject-user/${userId}`, { reason: rejectReason });
      toast.success('User rejected successfully');
      setShowRejectModal(null);
      setRejectReason('');
      if (currentTab === 'pending') {
        fetchPendingUsers();
        fetchPendingCount();
      } else {
        fetchAllUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setRejecting(null);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await api.get(`/auth/user/${userId}`);
      setSelectedUser(response.data.user);
      setShowUserModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
    }
  };

  const updateUserProfile = async () => {
    if (!selectedUser) return;
    
    try {
      await api.put(`/auth/user/${selectedUser._id}`, editingUser);
      toast.success('User profile updated successfully');
      setShowEditModal(false);
      setEditingUser({});
      if (currentTab === 'pending') {
        fetchPendingUsers();
      } else {
        fetchAllUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user profile');
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'shopkeeper': return 'Shop Keeper';
      case 'company_rep': return 'Company Representative';
      case 'delivery_worker': return 'Delivery Worker';
      default: return role;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredUsers = currentTab === 'pending' 
    ? pendingUsers.filter(user => 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    : users.filter(user => 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          {currentTab === 'pending' && pendingCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {pendingCount} user{pendingCount !== 1 ? 's' : ''} waiting for approval
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (currentTab === 'pending') {
              fetchPendingUsers();
              fetchPendingCount();
            } else {
              fetchAllUsers();
            }
          }}
          className="btn btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Users ({pendingCount})
          </button>
          <button
            onClick={() => setCurrentTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Users
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input pl-10 w-full"
            />
          </div>
        </div>
        {currentTab === 'all' && (
          <>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input"
            >
              <option value="">All Roles</option>
              <option value="shopkeeper">Shop Keeper</option>
              <option value="company_rep">Company Representative</option>
              <option value="delivery_worker">Delivery Worker</option>
            </select>
          </>
        )}
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {currentTab === 'pending' ? 'No pending users' : 'No users found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {currentTab === 'pending' 
              ? 'All users have been approved or there are no new registrations.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <div key={user._id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleDisplayName(user.role)}
                      </span>
                      <span className={getStatusBadge(user.status)}>
                        {user.status}
                      </span>
                      {getStatusIcon(user.status)}
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {user.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {user.area}, {user.city}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {user.address}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Registered:</span>{' '}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.suspensionReason && (
                          <div className="text-sm text-red-600">
                            <span className="font-medium">Reason:</span> {user.suspensionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role-specific information */}
                    {user.role === 'shopkeeper' && user.shopkeeperInfo && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Shop Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div><span className="font-medium">Shop Name:</span> {user.shopkeeperInfo.shopName}</div>
                          <div><span className="font-medium">Business Type:</span> {user.shopkeeperInfo.businessType}</div>
                          <div><span className="font-medium">Business Hours:</span> {user.shopkeeperInfo.businessHours}</div>
                          <div><span className="font-medium">Shop Size:</span> {user.shopkeeperInfo.shopSize}</div>
                        </div>
                      </div>
                    )}

                    {user.role === 'company_rep' && user.companyInfo && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Company Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div><span className="font-medium">Company Name:</span> {user.companyInfo.companyName}</div>
                          <div><span className="font-medium">Company Type:</span> {user.companyInfo.companyType}</div>
                          <div><span className="font-medium">Business License:</span> {user.companyInfo.businessLicense}</div>
                          <div><span className="font-medium">Tax ID:</span> {user.companyInfo.taxId}</div>
                        </div>
                      </div>
                    )}

                    {user.role === 'delivery_worker' && user.deliveryWorkerInfo && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div><span className="font-medium">Vehicle Type:</span> {user.deliveryWorkerInfo.vehicleType}</div>
                          <div><span className="font-medium">Vehicle Number:</span> {user.deliveryWorkerInfo.vehicleNumber}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => fetchUserDetails(user._id)}
                      className="btn btn-secondary"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveUser(user._id)}
                          disabled={approving === user._id || rejecting === user._id}
                          className="btn btn-primary"
                        >
                          {approving === user._id ? (
                            <div className="flex items-center">
                              <div className="spinner mr-2"></div>
                              Approving...
                            </div>
                          ) : (
                            'Approve'
                          )}
                        </button>
                        
                        <button
                          onClick={() => setShowRejectModal(user._id)}
                          disabled={approving === user._id || rejecting === user._id}
                          className="btn btn-danger"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination for All Users */}
      {currentTab === 'all' && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} total users)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reject User
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject this user? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="btn btn-secondary"
                disabled={rejecting === showRejectModal}
              >
                Cancel
              </button>
              <button
                onClick={() => rejectUser(showRejectModal)}
                disabled={rejecting === showRejectModal}
                className="btn btn-danger"
              >
                {rejecting === showRejectModal ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Rejecting...
                  </div>
                ) : (
                  'Reject User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                User Details - {selectedUser.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingUser(selectedUser);
                    setShowEditModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{getRoleDisplayName(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registered</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.address}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.city}</p>
                </div>
              </div>

              {selectedUser.suspensionReason && (
                <div>
                  <label className="block text-sm font-medium text-red-700">Suspension Reason</label>
                  <p className="mt-1 text-sm text-red-600">{selectedUser.suspensionReason}</p>
                </div>
              )}

              {/* Role-specific details */}
              {selectedUser.role === 'shopkeeper' && selectedUser.shopkeeperInfo && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Shop Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Shop Name:</span> {selectedUser.shopkeeperInfo.shopName}</div>
                    <div><span className="font-medium">Business Type:</span> {selectedUser.shopkeeperInfo.businessType}</div>
                    <div><span className="font-medium">Business Hours:</span> {selectedUser.shopkeeperInfo.businessHours}</div>
                    <div><span className="font-medium">Shop Size:</span> {selectedUser.shopkeeperInfo.shopSize}</div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'company_rep' && selectedUser.companyInfo && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Company Name:</span> {selectedUser.companyInfo.companyName}</div>
                    <div><span className="font-medium">Company Type:</span> {selectedUser.companyInfo.companyType}</div>
                    <div><span className="font-medium">Business License:</span> {selectedUser.companyInfo.businessLicense}</div>
                    <div><span className="font-medium">Tax ID:</span> {selectedUser.companyInfo.taxId}</div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'delivery_worker' && selectedUser.deliveryWorkerInfo && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Vehicle Type:</span> {selectedUser.deliveryWorkerInfo.vehicleType}</div>
                    <div><span className="font-medium">Vehicle Number:</span> {selectedUser.deliveryWorkerInfo.vehicleNumber}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User - {selectedUser.name}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingUser.name || selectedUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone || selectedUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area</label>
                  <input
                    type="text"
                    value={editingUser.area || selectedUser.area}
                    onChange={(e) => setEditingUser({ ...editingUser, area: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={editingUser.city || selectedUser.city}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editingUser.status || selectedUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="input mt-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={editingUser.address || selectedUser.address}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="input mt-1"
                  rows={3}
                />
              </div>

              {selectedUser.status === 'suspended' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Suspension Reason</label>
                  <textarea
                    value={editingUser.suspensionReason || selectedUser.suspensionReason || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, suspensionReason: e.target.value })}
                    className="input mt-1"
                    rows={2}
                    placeholder="Enter suspension reason..."
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser({});
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateUserProfile}
                className="btn btn-primary"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 