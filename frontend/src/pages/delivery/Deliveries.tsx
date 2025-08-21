import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveriesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone,
  User,
  Calendar,
  MessageSquare,
  Camera,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface Delivery {
  _id: string;
  deliveryNumber: string;
  orderId: {
    _id: string;
    orderNumber: string;
    status: string;
  };
  shopkeeperId: {
    _id: string;
    name: string;
    phone: string;
    area: string;
  };
  companyId: {
    _id: string;
    name: string;
    companyInfo: {
      companyName: string;
    };
  };
  items: DeliveryItem[];
  pickupLocation: string;
  deliveryLocation: string;
  deliveryArea: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  assignedAt: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  deliveryInstructions?: string;
  shopkeeperPhone: string;
  shopkeeperName: string;
  issues?: Array<{
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface CompletionModalProps {
  delivery: Delivery;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (deliveryId: string, proof: any) => void;
}

interface IssueModalProps {
  delivery: Delivery;
  isOpen: boolean;
  onClose: () => void;
  onReport: (deliveryId: string, issueData: any) => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ delivery, isOpen, onClose, onComplete }) => {
  const [signature, setSignature] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB');
        return;
      }

      setPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signature.trim()) {
      toast.error('Signature is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert photo to base64 if provided
      let photoBase64 = '';
      if (photo) {
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      }

      await onComplete(delivery._id, {
        signature: signature.trim(),
        photo: photoBase64,
        notes: notes.trim()
      });
      onClose();
      setSignature('');
      setPhoto(null);
      setPhotoPreview('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Complete Delivery</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Delivery: {delivery.deliveryNumber}</p>
            <p className="text-sm text-gray-600">Customer: {delivery.shopkeeperName}</p>
            <p className="text-sm text-gray-600">Location: {delivery.deliveryLocation}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Customer Signature *
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Customer signature or name confirmation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="inline w-4 h-4 mr-1" />
                Photo Proof
              </label>
              
              {!photo ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload delivery photo
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          JPEG, PNG, GIF, WebP up to 5MB
                        </span>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Delivery proof"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="mt-2 text-sm text-gray-600">
                    {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Delivery Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about the delivery..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Delivery
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const IssueModal: React.FC<IssueModalProps> = ({ delivery, isOpen, onClose, onReport }) => {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [canComplete, setCanComplete] = useState<boolean | null>(null);
  const [resolution, setResolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = [
    'Customer not available',
    'Wrong address',
    'Address not found',
    'Customer refused delivery',
    'Product damaged',
    'Vehicle breakdown',
    'Weather conditions',
    'Security concerns',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issueType || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (canComplete === true && !resolution.trim()) {
      toast.error('Please describe how the issue was resolved');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReport(delivery._id, {
        issueType,
        description: description.trim(),
        canComplete,
        resolution: resolution.trim()
      });
      onClose();
      setIssueType('');
      setDescription('');
      setCanComplete(null);
      setResolution('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Report Delivery Issue</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Delivery: {delivery.deliveryNumber}</p>
            <p className="text-sm text-gray-600">Customer: {delivery.shopkeeperName}</p>
            <p className="text-sm text-gray-600">Location: {delivery.deliveryLocation}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select issue type</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Can delivery be completed?
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="canComplete"
                    checked={canComplete === true}
                    onChange={() => setCanComplete(true)}
                    className="mr-2"
                  />
                  Yes, issue resolved
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="canComplete"
                    checked={canComplete === false}
                    onChange={() => setCanComplete(false)}
                    className="mr-2"
                  />
                  No, cannot complete delivery
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="canComplete"
                    checked={canComplete === null}
                    onChange={() => setCanComplete(null)}
                    className="mr-2"
                  />
                  Just reporting issue
                </label>
              </div>
            </div>

            {canComplete === true && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How was the issue resolved? *
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain how you resolved the issue..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Issue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Deliveries: React.FC = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getWorkerDeliveries();
      setDeliveries(response.data.deliveries || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching deliveries:', err);
      setError(err.response?.data?.message || 'Failed to load deliveries');
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async (deliveryId: string, proof: any) => {
    try {
      await deliveriesAPI.completeDelivery(deliveryId, proof);
      toast.success('Delivery completed successfully!');
      fetchDeliveries(); // Refresh the list
    } catch (err: any) {
      console.error('Error completing delivery:', err);
      toast.error(err.response?.data?.message || 'Failed to complete delivery');
      throw err;
    }
  };

  const handleReportIssue = async (deliveryId: string, issueData: any) => {
    try {
      const response = await deliveriesAPI.reportDeliveryIssue(deliveryId, issueData);
      
      if (response.data.issueStatus === 'delivery_failed') {
        toast.success('Issue reported and delivery marked as failed');
      } else if (response.data.issueStatus === 'resolved_and_completed') {
        toast.success('Issue resolved and delivery completed!');
      } else {
        toast.success('Issue reported successfully');
      }
      
      fetchDeliveries(); // Refresh the list
    } catch (err: any) {
      console.error('Error reporting issue:', err);
      toast.error(err.response?.data?.message || 'Failed to report issue');
      throw err;
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      await deliveriesAPI.updateDeliveryStatus(deliveryId, status);
      toast.success(`Delivery status updated to ${status.replace('_', ' ')}`);
      fetchDeliveries();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      assigned: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      picked_up: { color: 'bg-blue-100 text-blue-800', icon: Package },
      in_transit: { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      returned: { color: 'bg-gray-100 text-gray-800', icon: Package }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge?.icon || Clock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge?.color || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const canPickUp = (delivery: Delivery) => delivery.status === 'assigned';
  const canMarkInTransit = (delivery: Delivery) => delivery.status === 'picked_up';
  const canComplete = (delivery: Delivery) => ['picked_up', 'in_transit'].includes(delivery.status);

  if (user?.role !== 'delivery_worker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to delivery workers.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDeliveries}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Deliveries</h1>
        <p className="text-gray-600">Manage your assigned deliveries and update their status</p>
      </div>

      {deliveries.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
          <p className="text-gray-600">You have no assigned deliveries at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div key={delivery._id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {delivery.deliveryNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Order: {delivery.orderId.orderNumber}
                  </p>
                </div>
                {getStatusBadge(delivery.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Customer Details
                  </h4>
                  <p className="text-sm text-gray-600">{delivery.shopkeeperName}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    {delivery.shopkeeperPhone}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {delivery.deliveryLocation}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Items ({delivery.items.length})
                  </h4>
                  <div className="max-h-20 overflow-y-auto">
                    {delivery.items.map((item, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {item.quantity} {item.unit} × {item.productName}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Assigned: {format(new Date(delivery.assignedAt), 'MMM dd, yyyy HH:mm')}
                  {delivery.deliveredAt && (
                    <span className="ml-4">
                      Delivered: {format(new Date(delivery.deliveredAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {canPickUp(delivery) && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery._id, 'picked_up')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {canMarkInTransit(delivery) && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery._id, 'in_transit')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      In Transit
                    </button>
                  )}

                  {canComplete(delivery) && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowCompletionModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowIssueModal(true);
                        }}
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Report Issue
                      </button>
                    </>
                  )}

                  {delivery.status === 'delivered' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                      Completed
                    </span>
                  )}

                  {delivery.status === 'failed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded">
                      Failed
                    </span>
                  )}
                </div>
              </div>

              {delivery.issues && delivery.issues.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Issues Reported
                  </h5>
                  {delivery.issues.map((issue, index) => (
                    <div key={index} className="text-sm text-yellow-700 mb-1">
                      <span className="font-medium">{issue.type}:</span> {issue.description}
                    </div>
                  ))}
                </div>
              )}

              {delivery.deliveryInstructions && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Delivery Instructions
                  </h5>
                  <p className="text-sm text-blue-700">{delivery.deliveryInstructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDelivery && (
        <>
          <CompletionModal
            delivery={selectedDelivery}
            isOpen={showCompletionModal}
            onClose={() => {
              setShowCompletionModal(false);
              setSelectedDelivery(null);
            }}
            onComplete={handleCompleteDelivery}
          />
          <IssueModal
            delivery={selectedDelivery}
            isOpen={showIssueModal}
            onClose={() => {
              setShowIssueModal(false);
              setSelectedDelivery(null);
            }}
            onReport={handleReportIssue}
          />
        </>
      )}
    </div>
  );
};

export default Deliveries;
