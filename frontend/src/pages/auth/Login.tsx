import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.svg';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top brand bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
              title="Back to welcome"
              aria-label="Back to welcome"
            >
              <img src={logo} alt="GroceryTrackBD logo" className="h-8 w-8 hover:opacity-90 transition-opacity" />
            </button>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              GroceryTrackBD
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Welcome/brand panel */}
          <div className="hidden lg:flex rounded-2xl overflow-hidden shadow-lg">
            <div className="relative flex-1 bg-gradient-to-br from-emerald-600 to-blue-600 p-10 text-white">
              <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-extrabold">GT</span>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                Welcome Back
              </h1>
              <p className="text-emerald-50/90 text-lg mb-8 max-w-md">
                Sign in to continue managing your grocery operations with powerful analytics and seamless workflows.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {["Smart Inventory", "Faster Orders", "Live Delivery", "Insights"].map((item, idx) => (
                  <div key={idx} className="bg-white/10 rounded-lg px-4 py-3 text-sm font-medium backdrop-blur-sm">
                    {item}
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>

          {/* Right: Login card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">G</span>
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
              <p className="mt-2 text-sm text-gray-600">Welcome to GroceryTrackBD</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
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
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="input pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="input pl-10 pr-10"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don\'t have an account?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up here
                  </Link>
                </p>
                <p className="text-center text-sm text-gray-500">
                  <Link to="/pending-approval" className="hover:text-gray-700">
                    Check approval status
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
