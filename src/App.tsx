import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AdminProvider } from './contexts/AdminContext.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import LoadingSpinner from './components/UI/LoadingSpinner.tsx';

// Lazy load components for better performance
const Landing = lazy(() => import('./pages/Landing/Landing.tsx'));
const Layout = lazy(() => import('./components/Layout/Layout.tsx'));
const Login = lazy(() => import('./pages/Auth/Login.tsx'));
const Register = lazy(() => import('./pages/Auth/Register.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard.tsx'));
const Attendance = lazy(() => import('./pages/Attendance/Attendance.tsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.tsx'));
const Reports = lazy(() => import('./pages/Reports/Reports.tsx'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin.tsx'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.tsx'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers.tsx'));
const AdminAttendance = lazy(() => import('./pages/Admin/AdminAttendance.tsx'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports.tsx'));
const AdminLocations = lazy(() => import('./pages/Admin/AdminLocations.tsx'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings.tsx'));
const AdminLayout = lazy(() => import('./components/Layout/AdminLayout.tsx'));

// Loading fallback component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, session, isAdmin, profile } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Check both user and session for better security
  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but profile is still loading, wait for profile to determine admin status
  if (user && !profile) {
    return <LoadingScreen />;
  }

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading, profile, user } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>;
  }
  
  // If user exists but profile is still loading, wait for profile to determine admin status
  if (user && !profile) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>;
  }
  
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, session } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, redirect to dashboard
  if (user && session) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Router future={{ v7_relativeSplatPath: true }}>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={
              <Suspense fallback={<LoadingScreen />}>
                <Landing />
              </Suspense>
            } />
            
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <Suspense fallback={<LoadingScreen />}>
                <AdminLogin />
              </Suspense>
            } />
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              } 
            >
              <Route path="dashboard" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminDashboard />
                </Suspense>
              } />
              <Route path="users" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminUsers />
                </Suspense>
              } />
              <Route path="attendance" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminAttendance />
                </Suspense>
              } />
              <Route path="reports" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminReports />
                </Suspense>
              } />
              <Route path="locations" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminLocations />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingScreen />}>
                  <AdminSettings />
                </Suspense>
              } />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        </Router>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
