import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Building, Store, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'shopkeeper' | 'company_rep' | 'delivery_worker';
  area: string;
  city: string;
  address: string;
  shopkeeperInfo?: {
    shopName: string;
    businessType: string;
    businessHours: string;
    shopSize: string;
  };
  companyInfo?: {
    companyName: string;
    companyType: string;
    businessLicense: string;
    taxId: string;
  };
  deliveryWorkerInfo?: {
    vehicleType: string;
    vehicleNumber: string;
    assignedAreas: string[];
  };
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(data);
      
      if (result.requiresApproval) {
        toast.success('Registration successful! Your account is pending admin approval.');
        navigate(`/pending-approval?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">G</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join GroceryTrackBD and start managing your business
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      className="input pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^(\+880|880|0)?1[3456789]\d{8}$/,
                          message: 'Please enter a valid Bangladeshi phone number',
                        },
                      })}
                      type="tel"
                      className="input pl-10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Account Type
                  </label>
                  <select
                    {...register('role', { required: 'Please select an account type' })}
                    className="input"
                  >
                    <option value="">Select account type</option>
                    <option value="shopkeeper">Shop Keeper</option>
                    <option value="company_rep">Company Representative</option>
                    <option value="delivery_worker">Delivery Worker</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Area
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('area', { required: 'Area is required' })}
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your area"
                    />
                  </div>
                  {errors.area && (
                    <p className="mt-1 text-sm text-error-600">{errors.area.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    {...register('city', { required: 'City is required' })}
                    type="text"
                    className="input"
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-error-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    {...register('address', { required: 'Address is required' })}
                    type="text"
                    className="input"
                    placeholder="Enter your address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-error-600">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {selectedRole === 'shopkeeper' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <Store className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Shop Information</h3>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                      Shop Name
                    </label>
                    <input
                      {...register('shopkeeperInfo.shopName', { required: 'Shop name is required' })}
                      type="text"
                      className="input"
                      placeholder="Enter your shop name"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type
                    </label>
                    <input
                      {...register('shopkeeperInfo.businessType')}
                      type="text"
                      className="input"
                      placeholder="e.g., Grocery Store"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700">
                      Business Hours
                    </label>
                    <input
                      {...register('shopkeeperInfo.businessHours')}
                      type="text"
                      className="input"
                      placeholder="e.g., 8 AM - 10 PM"
                    />
                  </div>
                  <div>
                    <label htmlFor="shopSize" className="block text-sm font-medium text-gray-700">
                      Shop Size
                    </label>
                    <input
                      {...register('shopkeeperInfo.shopSize')}
                      type="text"
                      className="input"
                      placeholder="e.g., Small, Medium, Large"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'company_rep' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      {...register('companyInfo.companyName', { required: 'Company name is required' })}
                      type="text"
                      className="input"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="companyType" className="block text-sm font-medium text-gray-700">
                      Company Type
                    </label>
                    <input
                      {...register('companyInfo.companyType')}
                      type="text"
                      className="input"
                      placeholder="e.g., Food & Beverage"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700">
                      Business License
                    </label>
                    <input
                      {...register('companyInfo.businessLicense')}
                      type="text"
                      className="input"
                      placeholder="Enter business license number"
                    />
                  </div>
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                      Tax ID
                    </label>
                    <input
                      {...register('companyInfo.taxId')}
                      type="text"
                      className="input"
                      placeholder="Enter tax ID"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'delivery_worker' && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                      Vehicle Type
                    </label>
                    <select
                      {...register('deliveryWorkerInfo.vehicleType')}
                      className="input"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                      Vehicle Number
                    </label>
                    <input
                      {...register('deliveryWorkerInfo.vehicleNumber')}
                      type="text"
                      className="input"
                      placeholder="Enter vehicle number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Already have an account? Sign in
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
