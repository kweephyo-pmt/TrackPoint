import React, { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, TrendingUp, Users, Calendar, CheckCircle, ChevronDown, ChevronUp, Activity, Target, Award, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { supabase, AttendanceRecord, SessionType } from '../../lib/supabase.ts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';

interface DashboardStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  attendanceRate: number;
}

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  
  // Helper function to display work time (paused during breaks)
  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format elapsed time for banner display
  const formatElapsedTime = (startTime: string): string => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current active session
  const getActiveSession = useCallback(() => {
    return todayAttendance.find(a => !a.check_out_time);
  }, [todayAttendance]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        setLocationError(errorMessage);
      },
      options
    );
  }, []);

  // Quick action handlers
  const handleClockIn = () => {
    navigate('/app/attendance');
  };

  const handleCheckLocation = () => {
    getCurrentLocation();
    if (currentLocation) {
      toast.success(`Location: ${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}`);
    } else if (locationError) {
      toast.error(locationError);
    } else {
      toast.loading('Getting your location...');
    }
  };

  const handleSchedule = () => {
    // For now, navigate to dashboard or show a message
    toast('Schedule feature coming soon!', { icon: 'ℹ️' });
  };

  const handleTeam = () => {
    // For now, show a message
    toast('Team status feature coming soon!', { icon: 'ℹ️' });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Timer effect for active session
  useEffect(() => {
    const activeSession = getActiveSession();
    
    if (activeSession && activeSession.check_in_time) {
      const timer = setInterval(() => {
        setElapsedTime(formatElapsedTime(activeSession.check_in_time!));
      }, 1000);
      
      // Initial calculation
      setElapsedTime(formatElapsedTime(activeSession.check_in_time));
      
      return () => clearInterval(timer);
    } else {
      setElapsedTime('00:00:00');
    }
  }, [getActiveSession]);

  // Fetch today's attendance records
  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          session_types (
            id,
            name,
            start_time,
            end_time,
            description,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false })
        .limit(20); // Limit to recent records

      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      setTodayAttendance(data || []);
      
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  }, [user]);

  const fetchSessionTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('session_types')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    if (error) {
      console.error('Error fetching session types:', error);
      return;
    }

    setSessionTypes(data || []);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      // Use Promise.all to fetch all stats concurrently
      const [todayResult, weekResult, monthResult] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('total_hours')
          .eq('user_id', user.id)
          .gte('check_in_time', `${today}T00:00:00`)
          .lt('check_in_time', `${today}T23:59:59`),
        supabase
          .from('attendance_records')
          .select('total_hours')
          .eq('user_id', user.id)
          .gte('check_in_time', weekStart.toISOString()),
        supabase
          .from('attendance_records')
          .select('total_hours')
          .eq('user_id', user.id)
          .gte('check_in_time', monthStart.toISOString())
      ]);

      const todayHours = todayResult.data?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
      const weekHours = weekResult.data?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
      const monthHours = monthResult.data?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;

      setStats({
        todayHours,
        weekHours,
        monthHours,
        attendanceRate: 95 // Mock data for now
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayAttendance(),
        fetchSessionTypes(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTodayAttendance, fetchSessionTypes, fetchStats]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      getCurrentLocation();
    }
  }, [user, fetchDashboardData, getCurrentLocation]);

  // const getCurrentSession = () => {
  //   const now = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS format
  //   return sessionTypes.find(session => {
  //     const startTime = session.start_time;
  //     const endTime = session.end_time;
  //     
  //     // Convert times to comparable format
  //     const nowMinutes = timeToMinutes(now);
  //     const startMinutes = timeToMinutes(startTime);
  //     const endMinutes = timeToMinutes(endTime);
  //     
  //     return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  //   });
  // };

  // const timeToMinutes = (timeStr: string) => {
  //   const [hours, minutes] = timeStr.split(':').map(Number);
  //   return hours * 60 + minutes;
  // };

  const getSessionStatus = (sessionType: SessionType) => {
    const attendance = todayAttendance.find(a => a.session_type_id === sessionType.id);
    if (!attendance) return 'not-started';
    if (attendance.check_out_time) return 'completed';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // const currentSession = getCurrentSession(); // Unused for now

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/30 to-indigo-50/50"></div>
          <div className="relative text-center space-y-3 sm:space-y-4">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent leading-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! ✨
            </h1>
            <p className="text-xs sm:text-sm lg:text-lg text-gray-600 font-semibold flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-center">{format(currentTime, 'EEEE, MMMM do, yyyy')}</span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              </span>
              <span className="text-center">{format(currentTime, 'h:mm a')}</span>
            </p>
            
            {/* Active Session Display */}
            {(() => {
              const activeSession = getActiveSession();
              return activeSession ? (
                <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-800 font-bold text-xs sm:text-sm">Currently Active:</span>
                      <span className="text-emerald-900 font-bold text-sm sm:text-lg">
                        {activeSession.session_types?.name || 'Unknown Session'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800 font-bold text-xs sm:text-sm">Elapsed:</span>
                      <span className="text-emerald-900 font-mono font-bold text-lg sm:text-xl bg-white/50 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl">
                        {elapsedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Today Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-blue-300/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 to-cyan-50/70"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="text-blue-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Today</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">{Math.floor(stats.todayHours)}h {Math.round((stats.todayHours % 1) * 60)}m</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-500 font-semibold">Hours worked</p>
                </div>
              </div>
            </div>
          </div>

          {/* This Week Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-indigo-300/50">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 to-purple-50/70"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="text-indigo-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">This Week</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent">{Math.floor(stats.weekHours)}h {Math.round((stats.weekHours % 1) * 60)}m</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-500 font-semibold">Weekly progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* This Month Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-emerald-300/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 to-teal-50/70"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="text-emerald-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                  <Target className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">This Month</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 bg-clip-text text-transparent">{Math.floor(stats.monthHours)}h {Math.round((stats.monthHours % 1) * 60)}m</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-500 font-semibold">Monthly total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Rate Card */}
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-amber-300/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 to-orange-50/70"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div className="text-amber-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                  <Users className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Attendance Rate</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 bg-clip-text text-transparent">{stats.attendanceRate}%</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-gray-500 font-semibold">Performance metric</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Today's Sessions & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Today's Sessions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                    <span>Today's Sessions</span>
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Track your daily progress</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {sessionTypes.map((session) => {
                const status = getSessionStatus(session);
                const sessionRecords = todayAttendance.filter(a => a.session_type_id === session.id);
                const totalSessionHours = sessionRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
                const latestRecord = sessionRecords[sessionRecords.length - 1];
                
                return (
                  <div key={session.id} className="group relative overflow-hidden bg-gradient-to-r from-gray-50/80 to-gray-100/80 hover:from-blue-50/80 hover:to-indigo-50/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-500 hover:shadow-xl border border-gray-200/50 hover:border-blue-300/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 ${
                          status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                          status === 'active' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : status === 'active' ? (
                            <Clock className="w-6 h-6 text-white" />
                          ) : (
                            <Circle className="w-6 h-6 text-white" />
                          )}
                          {status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-blue-900 transition-colors">{session.name}</p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {session.start_time} - {session.end_time}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {sessionRecords.length > 0 ? (
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {totalSessionHours > 0 ? `${Math.floor(totalSessionHours)}h ${Math.round((totalSessionHours % 1) * 60)}m` : 
                               'In Progress'}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {`Started: ${latestRecord?.check_in_time ? format(new Date(latestRecord.check_in_time), 'h:mm a') : ''}`}
                            </p>
                          </div>
                        ) : (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              status === 'completed' ? 'bg-emerald-500' :
                              status === 'active' ? 'bg-blue-500 animate-pulse' :
                              'bg-gray-400'
                            }`}></div>
                            {status === 'completed' ? 'Completed' :
                             status === 'active' ? 'Active' :
                             'Not Started'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 sm:p-6">
          <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Quick Actions</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">Manage your attendance</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <button 
                  onClick={handleClockIn}
                  className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-base sm:text-lg">Clock In</p>
                      <p className="text-emerald-100 text-xs sm:text-sm">Start your session</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button 
                  onClick={handleCheckLocation}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Check Location</p>
                      <p className="text-blue-100 text-sm">Verify your position</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    onClick={handleSchedule}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
                  >
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                      <div className="text-center">
                        <p className="font-semibold text-xs sm:text-sm">Schedule</p>
                        <p className="text-gray-100 text-xs hidden sm:block">View calendar</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  <button 
                    onClick={handleTeam}
                    className="group relative overflow-hidden bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-2xl p-3 transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="w-6 h-6" />
                      <div className="text-center">
                        <p className="font-semibold text-sm">Team</p>
                        <p className="text-gray-100 text-xs">Check status</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>

        </div>
        
        {/* Recent Activity */}
        <div className="mt-8 sm:mt-12"></div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                    <span>Recent Activity</span>
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Your latest check-ins</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllActivity(!showAllActivity)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 text-white text-sm font-semibold backdrop-blur-sm shadow-lg hover:scale-105"
              >
                <span>{showAllActivity ? 'Show Less' : 'Show All'}</span>
                {showAllActivity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {todayAttendance.length > 0 ? (
              <div className="space-y-4">
                {(showAllActivity ? todayAttendance : todayAttendance.slice(0, 3)).map((record, index) => (
                  <div key={record.id} className="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-200">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="relative">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                          record.check_out_time ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {record.check_out_time ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <Clock className="w-6 h-6 text-white" />
                          )}
                        </div>
                        {!record.check_out_time && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {record.session_types?.name || 'Unknown Session'}
                          </p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            record.check_out_time ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              record.check_out_time ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
                            }`}></div>
                            {record.check_out_time ? 'Completed' : 'In Progress'}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600 font-medium">Check In:</span>
                            <span className="text-gray-900 font-semibold">
                              {record.check_in_time ? format(new Date(record.check_in_time), 'h:mm a') : 'N/A'}
                            </span>
                          </div>
                          {record.check_out_time ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-gray-600 font-medium">Check Out:</span>
                              <span className="text-gray-900 font-semibold">
                                {format(new Date(record.check_out_time), 'h:mm a')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                              <span className="text-gray-600 font-medium">Elapsed:</span>
                              <span className="font-bold text-orange-600">
                                {record.check_in_time ? getElapsedTime(record.check_in_time) : '0s'}
                              </span>
                            </div>
                          )}
                          {record.total_hours && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-gray-600 font-medium">Duration:</span>
                              <span className="text-gray-900 font-semibold">
                                {Math.floor(record.total_hours)}h {Math.round((record.total_hours % 1) * 60)}m
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex items-center justify-center h-32 sm:h-64">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-base sm:text-lg font-medium">No attendance records for today</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Start your first session to see activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
};

export default Dashboard;
