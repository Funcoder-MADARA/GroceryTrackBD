import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PendingApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isChecking, setIsChecking] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const { checkApprovalStatus } = useAuth();
  
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      checkStatus();
    }
  }, [email]);

  const checkStatus = async () => {
    if (!email) return;
    
    setIsChecking(true);
    try {
      const result = await checkApprovalStatus(email);
      setApprovalStatus(result.status);
      
      if (result.status === 'active') {
        toast.success('Your account has been approved! You can now log in.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check approval status');
    } finally {
      setIsChecking(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Request
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No email address provided. Please use the link from your registration confirmation.
            </p>
            <div className="mt-4">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {approvalStatus === 'active' ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-yellow-500" />
          )}
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {approvalStatus === 'active' ? 'Account Approved!' : 'Pending Approval'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {approvalStatus === 'active' 
              ? 'Your account has been approved by the administrator. You can now log in to access your account.'
              : 'Your account is currently pending approval from our administrator. We will review your registration and notify you once approved.'
            }
          </p>
          
          <div className="mt-4 text-sm text-gray-500">
            <div className="flex items-center justify-center">
              <Mail className="h-4 w-4 mr-2" />
              {email}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {approvalStatus !== 'active' && (
            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="w-full flex justify-center items-center btn btn-secondary"
            >
              {isChecking ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </div>
              ) : (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Approval Status
                </div>
              )}
            </button>
          )}
          
          {approvalStatus === 'active' && (
            <Link
              to="/login"
              className="w-full flex justify-center btn btn-primary"
            >
              Proceed to Login
            </Link>
          )}
          
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {approvalStatus !== 'active' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our administrator will review your registration</li>
              <li>• You'll receive an email notification once approved</li>
              <li>• You can check your status using the button above</li>
              <li>• This process typically takes 24-48 hours</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApproval;
