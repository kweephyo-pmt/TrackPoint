import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User, Fingerprint, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdmin } from '../../contexts/AdminContext.tsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';

const AdminLogin: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAdminLoggedIn, checkSession } = useAdmin();

  useEffect(() => {
    // Check if already logged in
    if (isAdminLoggedIn || checkSession()) {
      navigate('/admin/dashboard');
    }
  }, [isAdminLoggedIn, navigate, checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(credentials.email, credentials.password);
      
      if (success) {
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-indigo-50/20"></div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex relative w-full max-w-6xl mx-auto">
        {/* Left Side - Branding */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-lg text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
                <Fingerprint className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                TrackPoint
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                Administrative Control Panel
              </p>
              <p className="text-gray-500 leading-relaxed">
                Secure biometric attendance tracking system with advanced facial recognition technology. 
                Manage employees, monitor attendance, and generate comprehensive reports.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Secure Access</p>
              </div>
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                <Lock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Encrypted Data</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Form Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Administrator Login</h2>
                <p className="text-gray-600 mt-2">Enter your credentials to access the admin panel</p>
              </div>
            </div>
            
            {/* Login Form */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                  <label htmlFor="email-desktop" className="block text-sm font-semibold text-gray-700 mb-3">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-desktop"
                      name="email"
                      type="email"
                      required
                      value={credentials.email}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password-desktop" className="block text-sm font-semibold text-gray-700 mb-3">
                    Administrator Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password-desktop"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={credentials.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-14 py-4 border border-gray-300 rounded-2xl bg-gray-50/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Enter secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <LoadingSpinner size="sm" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Access Admin Panel</span>
                    </div>
                  )}
                </button>
              </form>
              
              {/* Security Notice */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-1">Secure Access</p>
                    <p className="text-xs text-blue-700">All login attempts are monitored and logged</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Back to Employee Login */}
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2 rounded-xl hover:bg-gray-100/50"
              >
                <User className="w-4 h-4" />
                <span>← Employee Login Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden relative max-w-sm w-full space-y-8">
        {/* Simple Mobile Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Login
            </h1>
            <p className="text-gray-600">
              TrackPoint Administration
            </p>
          </div>
        </div>

        {/* Simple Mobile Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email-mobile"
                name="email"
                type="email"
                required
                value={credentials.email}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-mobile"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>

        {/* Back to Employee Login */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Employee Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
