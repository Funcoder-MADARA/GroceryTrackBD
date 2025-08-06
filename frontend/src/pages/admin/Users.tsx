import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface PendingUser {
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
}

const Users: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

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

  const approveUser = async (userId: string) => {
    setApproving(userId);
    try {
      await api.patch(`/auth/approve-user/${userId}`);
      toast.success('User approved successfully');
      fetchPendingUsers(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setApproving(null);
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
      case 'inactive':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pending Users</h1>
        <button
          onClick={fetchPendingUsers}
          className="btn btn-secondary"
        >
          Refresh
        </button>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending users</h3>
          <p className="mt-1 text-sm text-gray-500">
            All users have been approved or there are no new registrations.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <div key={user._id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleDisplayName(user.role)}
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

                  <div className="ml-4">
                    <button
                      onClick={() => approveUser(user._id)}
                      disabled={approving === user._id}
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users; 