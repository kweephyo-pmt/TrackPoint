import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  User, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import toast from 'react-hot-toast';

const Sidebar: React.FC = () => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Attendance',
      href: '/app/attendance',
      icon: Clock,
    },
    {
      name: 'Profile',
      href: '/app/profile',
      icon: User,
    },
    {
      name: 'Reports',
      href: '/app/reports',
      icon: BarChart3,
    },
  ];

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double clicks
    
    try {
      setIsSigningOut(true);
      await signOut();
      
      // Force navigation to login page after successful signout
      navigate('/login', { replace: true });
      
      // Close mobile menu if open
      setIsMobileMenuOpen(false);
      
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-72
        bg-white/95 backdrop-blur-xl shadow-2xl lg:shadow-xl border-r border-gray-200/50 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 lg:p-6 pt-16 lg:pt-6 border-b border-gray-200/30 bg-gradient-to-r from-gray-50/50 to-white/50">
          <div className="flex items-center space-x-4">
            <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">TrackPoint</h1>
              <p className="text-sm text-gray-500 font-semibold flex items-center space-x-1">
                <span>Biometric Tracking</span>
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group relative flex items-center space-x-4 px-4 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 text-blue-700 shadow-lg border border-blue-200/50 backdrop-blur-sm' 
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-slate-50/80 hover:text-gray-900 hover:shadow-md hover:backdrop-blur-sm'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-2xl animate-pulse" />
                )}
                <div className={`
                  relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md
                  ${isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg scale-110' 
                    : 'bg-gray-100/80 group-hover:bg-gradient-to-br group-hover:from-gray-200 group-hover:to-gray-300 group-hover:scale-105'
                  }
                `}>
                  <item.icon className={`w-5 h-5 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                </div>
                <span className="relative font-semibold">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-200/30 bg-gradient-to-r from-gray-50/80 to-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center shadow-xl">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-14 h-14 rounded-3xl object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-gray-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 font-semibold flex items-center space-x-1 leading-tight">
                <span className="break-words">{profile?.position || 'Employee'}</span>
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="group relative p-2.5 text-gray-500 hover:text-red-600 bg-white/80 hover:bg-red-50/80 rounded-xl border border-gray-200/50 hover:border-red-200 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sign Out"
            >
              {isSigningOut ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
