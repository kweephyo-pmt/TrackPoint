import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings, 
  BarChart3, 
  LogOut,
  Menu,
  Shield,
  MapPin
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext.tsx';

const AdminSidebar: React.FC = () => {
  const { logout, adminSession } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Attendance',
      href: '/admin/attendance',
      icon: Clock,
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: BarChart3,
    },
    {
      name: 'Locations',
      href: '/admin/locations',
      icon: MapPin,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 ${
          isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Menu className="w-6 h-6 text-gray-600" />
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
        fixed lg:static inset-y-0 left-0 z-40 w-80 lg:w-72
        bg-white/95 backdrop-blur-xl shadow-2xl lg:shadow-xl border-r border-gray-200/50 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 lg:p-6 pt-16 lg:pt-6 border-b border-gray-200/30 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent leading-tight">
                Admin Panel
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold truncate">
                System Management
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 sm:p-6 space-y-1 sm:space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/admin/dashboard' && location.pathname === '/admin/dashboard');
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group relative flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-50/80 to-blue-50/80 text-purple-700 shadow-lg border border-purple-200/50 backdrop-blur-sm' 
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-slate-50/80 hover:text-gray-900 hover:shadow-md hover:backdrop-blur-sm'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-2xl animate-pulse" />
                )}
                <div className={`
                  relative w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 shadow-md flex-shrink-0
                  ${isActive 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg scale-110' 
                    : 'bg-gray-100/80 group-hover:bg-gradient-to-br group-hover:from-gray-200 group-hover:to-gray-300 group-hover:scale-105'
                  }
                `}>
                  <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                </div>
                <span className="relative font-semibold truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

       

        <div className="p-4 sm:p-6 border-t border-gray-200/30 bg-gradient-to-r from-gray-50/80 to-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-sm font-bold text-gray-900 truncate">
                {adminSession?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 font-semibold leading-tight">
                System Administrator
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="group relative p-2 sm:p-2.5 text-gray-500 hover:text-red-600 bg-white/80 hover:bg-red-50/80 rounded-lg sm:rounded-xl border border-gray-200/50 hover:border-red-200 transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-sm hover:scale-105 flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
