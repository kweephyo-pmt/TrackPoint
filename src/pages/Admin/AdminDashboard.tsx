import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  BarChart3, 
  Calendar,
  Download,
  Activity,
  RefreshCw,
  Settings,
  UserPlus,
  X,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


interface AttendanceStats {
  totalUsers: number;
  activeToday: number;
  totalSessions: number;
  avgHoursPerDay: number;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  employee_id: string;
  department: string;
  position: string;
  role: 'user' | 'admin';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AttendanceStats>({
    totalUsers: 0,
    activeToday: 0,
    totalSessions: 0,
    avgHoursPerDay: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    employee_id: '',
    department: '',
    position: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch admin data...');
      
      await Promise.all([
        fetchStats()
      ]);
      
      console.log('Admin data fetched successfully');
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };


  const calculateAverageHoursPerDay = async (): Promise<number> => {
    try {
      // Get attendance records from the last 30 days with completed check-ins and check-outs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('check_in_time, total_hours')
        .gte('check_in_time', thirtyDaysAgo.toISOString())
        .not('check_out_time', 'is', null)
        .not('total_hours', 'is', null)
        .limit(500); // Limit for performance

      if (error) {
        console.error('Error fetching attendance records for avg calculation:', error);
        return 0;
      }

      if (!records || records.length === 0) {
        return 0;
      }

      // Calculate total hours and count of completed sessions
      const totalHours = records.reduce((sum, record) => {
        return sum + (record.total_hours || 0);
      }, 0);

      // Get unique days to calculate daily average
      const uniqueDays = new Set(
        records.map(record => 
          new Date(record.check_in_time).toISOString().split('T')[0]
        )
      );

      const numberOfDays = uniqueDays.size;
      
      if (numberOfDays === 0) {
        return 0;
      }

      // Calculate average hours per day
      const avgHours = totalHours / numberOfDays;
      
      // Round to 1 decimal place
      return Math.round(avgHours * 10) / 10;
    } catch (error) {
      console.error('Error calculating average hours per day:', error);
      return 0;
    }
  };

  const fetchStats = async () => {
    try {
      // Optimize by running queries in parallel and limiting data
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      
      const [usersResult, activeTodayResult, sessionsResult] = await Promise.all([
        // Get total users count - optimized
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        
        // Get today's active users - optimized
        supabase
          .from('attendance_records')
          .select('user_id', { count: 'exact', head: true })
          .gte('check_in_time', `${today}T00:00:00`)
          .lt('check_in_time', `${today}T23:59:59`),
        
        // Get total sessions this month - optimized
        supabase
          .from('attendance_records')
          .select('id', { count: 'exact', head: true })
          .gte('check_in_time', startOfMonth)
      ]);

      if (usersResult.error) {
        console.error('Error fetching users count:', usersResult.error);
      }
      if (activeTodayResult.error) {
        console.error('Error fetching active today:', activeTodayResult.error);
      }
      if (sessionsResult.error) {
        console.error('Error fetching sessions:', sessionsResult.error);
      }

      // Calculate average hours per day from completed attendance records
      const avgHoursPerDay = await calculateAverageHoursPerDay();

      setStats({
        totalUsers: usersResult.count || 0,
        activeToday: activeTodayResult.count || 0,
        totalSessions: sessionsResult.count || 0,
        avgHoursPerDay: avgHoursPerDay
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleSystemSettings = () => {
    navigate('/admin/settings');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({ ...newUser, password });
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Email, password, and full name are required');
      return;
    }

    setCreatingUser(true);
    try {
      // Create user in Supabase Auth using signUp (same as AdminUsers)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            employee_id: newUser.employee_id,
            department: newUser.department,
            position: newUser.position,
            role: newUser.role
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        toast.error(authError.message);
        return;
      }

      if (authData.user) {
        // Update the profile with additional data (same pattern as AdminUsers)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: newUser.full_name,
            employee_id: newUser.employee_id,
            department: newUser.department,
            position: newUser.position,
            role: newUser.role
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          toast.error('User created but profile update failed');
        } else {
          toast.success('User created successfully');
        }
      }

      setShowAddUserModal(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        employee_id: '',
        department: '',
        position: '',
        role: 'user'
      });
      await fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error in createUser:', error);
      toast.error('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const exportData = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles(full_name, email),
          session_types(name)
        `)
        .order('check_in_time', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Convert to CSV
      const csvContent = [
        ['Date', 'Employee', 'Email', 'Session Type', 'Check In', 'Check Out', 'Duration'].join(','),
        ...data.map(record => [
          new Date(record.check_in_time).toLocaleDateString(),
          record.profiles?.full_name || 'N/A',
          record.profiles?.email || 'N/A',
          record.session_types?.name || 'N/A',
          new Date(record.check_in_time).toLocaleTimeString(),
          record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'Active',
          record.check_out_time ? 
            Math.round((new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60 * 60 * 100)) / 100 + 'h' : 
            'Active'
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Loading Header Skeleton */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <div className="animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="h-8 bg-slate-200 rounded-lg w-80 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-60"></div>
                </div>
                <div className="flex space-x-3">
                  <div className="h-12 bg-slate-200 rounded-2xl w-32"></div>
                  <div className="h-12 bg-slate-200 rounded-2xl w-32"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Quick Actions Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="h-24 bg-slate-200 rounded-2xl"></div>
                <div className="h-24 bg-slate-200 rounded-2xl"></div>
                <div className="h-24 bg-slate-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl">
                  <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent truncate">
                  Admin Dashboard
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg mt-1 hidden sm:block">System management and analytics</p>
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live data</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span className="hidden sm:inline">Last updated: {new Date().toLocaleTimeString()}</span>
                  <span className="sm:hidden">Updated</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="group flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-4 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl lg:rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                <span className="font-semibold text-sm sm:text-base hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="font-semibold text-sm sm:hidden">{refreshing ? '...' : 'Refresh'}</span>
              </button>
              <button
                onClick={exportData}
                className="group flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
                <span className="font-semibold text-sm sm:text-base hidden sm:inline">Export Data</span>
                <span className="font-semibold text-sm sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Users Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-1 sm:mt-2">{stats.totalUsers}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Registered employees</p>
              </div>
            </div>
          </div>

          {/* Active Today Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">Active Today</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-1 sm:mt-2">{stats.activeToday}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Currently checked in</p>
              </div>
            </div>
          </div>

          {/* Sessions This Month Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">Sessions This Month</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-1 sm:mt-2">{stats.totalSessions}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Total check-ins</p>
              </div>
            </div>
          </div>

          {/* Avg Hours/Day Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">Avg Hours/Day</p>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-1 sm:mt-2">{stats.avgHoursPerDay}h</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Daily productivity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Quick Actions</h3>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">Streamline your workflow with these shortcuts</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <button
              onClick={exportData}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-base sm:text-lg">Export Attendance Reports</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Download attendance data</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={handleAddUser}
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-base sm:text-lg">Add New User</div>
                  <div className="text-emerald-100 text-xs sm:text-sm">Create employee account</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={handleSystemSettings}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-base sm:text-lg">System Settings</div>
                  <div className="text-purple-100 text-xs sm:text-sm">Configure preferences</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div 
            className="fixed flex items-center justify-center z-50"
            style={{
              position: 'fixed',
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              margin: 0
            }}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm transform transition-all duration-300">
              {/* Modern Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 rounded-t-2xl sm:rounded-t-3xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">Add New User</h3>
                      <p className="text-blue-100 text-xs sm:text-sm">Create account for system access</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6">

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white/80"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white/80"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                    >
                      Generate secure password
                    </button>
                  </div>


                  {/* Role */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white/80"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createUser}
                    disabled={creatingUser || !newUser.email || !newUser.password || !newUser.full_name}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                  >
                    {creatingUser ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create User</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
