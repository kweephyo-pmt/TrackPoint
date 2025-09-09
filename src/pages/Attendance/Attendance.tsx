import React, { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Camera, CheckCircle, AlertCircle, Square, Clipboard, Zap, Calendar, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { supabase, AttendanceRecord, SessionType, CompanyLocation } from '../../lib/supabase.ts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';
import FacialRecognition from '../../components/Attendance/FacialRecognition.tsx';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  const [checkInMethod] = useState<'facial'>('facial');
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationRetries, setLocationRetries] = useState(0);
  const [skipLocationCheck, setSkipLocationCheck] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasAttemptedLocation, setHasAttemptedLocation] = useState(false);

  const getCurrentLocation = useCallback((retryCount = 0) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      setHasAttemptedLocation(true);
      return;
    }

    if (retryCount === 0) {
      setLocationLoading(true);
      setHasAttemptedLocation(true);
    }

    const options = {
      enableHighAccuracy: false, // Use less accurate but more reliable location
      timeout: 15000, // Increase timeout to 15 seconds
      maximumAge: 300000 // Accept cached location up to 5 minutes old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError(null);
        setLocationRetries(0);
        setLocationLoading(false);
      },
      (error) => {
        const maxRetries = 3;
        const newRetryCount = retryCount + 1;
        
        let errorMessage = 'Unable to get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            setLocationError(errorMessage);
            setLocationLoading(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            if (newRetryCount < maxRetries) {
              setLocationRetries(newRetryCount);
              setTimeout(() => getCurrentLocation(newRetryCount), 2000 * newRetryCount);
              return;
            }
            setLocationError(errorMessage);
            setLocationLoading(false);
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            if (newRetryCount < maxRetries) {
              setLocationRetries(newRetryCount);
              setTimeout(() => getCurrentLocation(newRetryCount), 1000);
              return;
            }
            setLocationError(errorMessage);
            setLocationLoading(false);
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
            if (newRetryCount < maxRetries) {
              setLocationRetries(newRetryCount);
              setTimeout(() => getCurrentLocation(newRetryCount), 2000);
              return;
            }
            setLocationError(errorMessage);
            setLocationLoading(false);
        }
        
        // Only show toast on final failure
        if (newRetryCount >= maxRetries) {
          toast.error(`${errorMessage} You can proceed without location verification.`);
        }
      },
      options
    );
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSessionTypes(),
        fetchTodayAttendance(),
        fetchLocations()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      fetchData();
      // Delay location request to avoid blocking UI
      setTimeout(() => getCurrentLocation(), 500);
    }
  }, [user, fetchData, getCurrentLocation]);

  const fetchSessionTypes = async () => {
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
    if (data && data.length > 0) {
      setSelectedSession(data[0].id);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          session_types (
            name,
            start_time,
            end_time,
            description
          )
        `)
        .eq('user_id', user.id)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false })
        .limit(10); // Limit to recent records

      if (error) {
        console.error('Error fetching today attendance:', error);
        return;
      }

      setTodayAttendance(data || []);
    } catch (error) {
      console.error('Error in fetchTodayAttendance:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('is_active', true)
        .limit(5); // Limit locations

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Error in fetchLocations:', error);
    }
  };

  const handleRetryLocation = () => {
    getCurrentLocation(0);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const isWithinAllowedRadius = () => {
    if (!currentLocation || locations.length === 0) return null; // Return null when we can't determine

    return locations.some(location => {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        location.latitude,
        location.longitude
      );
      return distance <= location.radius_meters;
    });
  };

  const calculateAttendanceStatus = (sessionTypeId: string, checkInTime: Date): string => {
    const session = sessionTypes.find(s => s.id === sessionTypeId);
    if (!session) return 'present';

    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;

    // Parse session start and end times
    const [startHour, startMinute] = session.start_time.split(':').map(Number);
    const [endHour, endMinute] = session.end_time.split(':').map(Number);
    const sessionStartMinutes = startHour * 60 + startMinute;
    const sessionEndMinutes = endHour * 60 + endMinute;

    // Define grace periods (in minutes)
    const EARLY_GRACE_PERIOD = 30; // 30 minutes before session start
    const LATE_GRACE_PERIOD = 15;  // 15 minutes after session start

    const earliestAllowed = sessionStartMinutes - EARLY_GRACE_PERIOD;
    const latestOnTime = sessionStartMinutes + LATE_GRACE_PERIOD;

    if (checkInTotalMinutes < earliestAllowed || checkInTotalMinutes > sessionEndMinutes) {
      return 'late'; // Too early or after session ends
    } else if (checkInTotalMinutes > latestOnTime) {
      return 'late'; // Late check-in
    } else {
      return 'present'; // On time
    }
  };

  const handleCheckIn = async (faceEncoding?: string) => {
    if (!user || !selectedSession || !currentLocation) return;

    // Check if user already has an active session
    const activeRecord = todayAttendance.find(record => !record.check_out_time);
    if (activeRecord) {
      toast.error('You must check out of your current session before starting a new one.');
      return;
    }

    const withinRadius = isWithinAllowedRadius();
    if (withinRadius === false) {
      toast.error('You are not within the allowed check-in radius.');
      return;
    }

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          user_id: user.id,
          session_type_id: selectedSession,
          check_in_time: new Date().toISOString(),
          check_in_location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address: 'Current Location'
          },
          check_in_method: checkInMethod,
          status: calculateAttendanceStatus(selectedSession, new Date())
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update face encoding if facial recognition was used
      if (faceEncoding && checkInMethod === 'facial') {
        await supabase
          .from('profiles')
          .update({ face_encoding: faceEncoding })
          .eq('id', user.id);
      }

      toast.success('Checked in successfully!');
      await fetchTodayAttendance();
      setSelectedSession('');
      setShowFacialRecognition(false);
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    if (!currentLocation) return;

    setActionLoading(true);

    try {
      const checkOutTime = new Date();
      const attendance = todayAttendance.find(a => a.id === attendanceId);
      if (!attendance) throw new Error('Attendance record not found');

      const checkInTime = new Date(attendance.check_in_time!);
      const timeDiffMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      
      // Minimum session duration validation (1 minute)
      if (timeDiffMinutes < 1) {
        toast.error('Minimum session duration is 1 minute. Please wait before checking out.');
        setActionLoading(false);
        return;
      }

      const totalHours = timeDiffMinutes / 60;

      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: checkOutTime.toISOString(),
          check_out_location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address: 'Current Location'
          },
          check_out_method: 'facial',
          total_hours: Math.round(totalHours * 100) / 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) {
        throw error;
      }

      const finalDuration = formatElapsedTime(attendance.check_in_time!);
      toast.success(`Checked out successfully! Total time: ${finalDuration}`);
      await fetchTodayAttendance();
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast.error(error.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const getSessionStatus = (sessionId: string) => {
    const attendance = todayAttendance.find(a => a.session_type_id === sessionId);
    if (!attendance) return 'not-started';
    if (attendance.check_out_time) return 'completed';
    return 'active';
  };

  const getActiveSession = useCallback(() => {
    return todayAttendance.find(a => !a.check_out_time);
  }, [todayAttendance]);

  const formatElapsedTime = (startTime: string): string => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  

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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeSessionRecord = getActiveSession();
  const withinRadius = isWithinAllowedRadius();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white/30 to-gray-50/50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent flex items-center space-x-2 leading-tight">
                <span>Attendance</span>
                <Clipboard className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" />
              </h1>
              <p className="text-gray-600 font-medium flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2 text-sm sm:text-base">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                  <span>Manage your daily attendance and sessions</span>
                </span>
              </p>
            </div>
            {(currentLocation && locations.length > 0) && (
              <div className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-gray-200/50 shadow-lg w-full sm:w-auto justify-center sm:justify-start">
                <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${withinRadius ? 'text-emerald-600' : 'text-red-600'}`} />
                <span className={`text-xs sm:text-sm font-semibold ${withinRadius ? 'text-emerald-600' : 'text-red-600'} text-center sm:text-left`}>
                  {withinRadius ? 'Within allowed area' : 'Outside allowed area'}
                </span>
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse ${withinRadius ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              </div>
            )}
          </div>
        </div>

        {/* Location Status */}
        {hasAttemptedLocation && !currentLocation && !skipLocationCheck && (
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-amber-200/50 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg sm:mr-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-base sm:text-lg">
                    {locationLoading ? 'Getting your location...' : (locationError || 'Location access required')}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-700 font-medium mt-1">
                    {locationLoading 
                      ? 'Please wait while we determine your location.'
                      : (locationError 
                        ? 'Location services are having issues. You can proceed without location verification.'
                        : 'Please enable location services to check in/out.')
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleRetryLocation}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
                    disabled={locationRetries >= 3 || locationLoading}
                  >
                    {locationLoading ? 'Getting Location...' : (locationRetries > 0 ? `Retry (${locationRetries}/3)` : 'Enable Location')}
                  </button>
                  {locationError && (
                    <button
                      onClick={() => setSkipLocationCheck(true)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      Continue Without Location
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Check In/Out Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                    <span>Quick Actions</span>
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Check in and out of your sessions</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
            
            {activeSessionRecord ? (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200/50 rounded-3xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-emerald-900 text-lg flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span>Currently Active</span>
                      </p>
                      <p className="text-sm text-emerald-700 font-medium mt-1">
                        {activeSessionRecord.session_types?.name} - Started at{' '}
                        {activeSessionRecord.check_in_time ? format(new Date(activeSessionRecord.check_in_time), 'h:mm a') : ''}
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 rounded-2xl backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-800">Elapsed Time:</span>
                            <span className="text-xl font-mono font-bold text-emerald-900 bg-white/50 px-3 py-1 rounded-xl">{elapsedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2 ml-4">
                      <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">ACTIVE</span>
                    </div>
                  </div>
                </div>
                
                
                <button
                  onClick={() => handleCheckOut(activeSessionRecord.id)}
                  disabled={actionLoading || !currentLocation || !withinRadius}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Checking out...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Square className="w-6 h-6 mr-3" />
                      Check Out
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-6">
                {/* Session Selection */}
                <div>
                  <label className="label">Select Session</label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="pl-4 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                  >
                    {sessionTypes.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} ({session.start_time} - {session.end_time})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Facial Recognition Info */}
                <div className="p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/80 border border-gray-200/50 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Facial Recognition Check-in</p>
                      <p className="text-xs text-gray-700 font-medium">Secure attendance tracking with face verification</p>
                    </div>
                  </div>
                </div>

                {/* Check In Button */}
                <button
                  onClick={() => setShowFacialRecognition(true)}
                  disabled={actionLoading || !currentLocation || !withinRadius || !selectedSession}
                  className="w-full px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Checking in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Camera className="w-6 h-6 mr-3" />
                      Start Facial Recognition
                    </div>
                  )}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Today's Sessions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                    <span>Today's Sessions</span>
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Track your daily session progress</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
            <div className="space-y-3">
              {sessionTypes.map((session) => {
                const status = getSessionStatus(session.id);
                const sessionRecords = todayAttendance.filter(a => a.session_type_id === session.id);
                const totalSessionHours = sessionRecords.reduce((sum, record) => sum + (record.total_hours || 0), 0);
                const latestRecord = sessionRecords[sessionRecords.length - 1];
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-white/60 to-gray-50/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl shadow-lg ${
                        status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
                        status === 'active' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                        'bg-gradient-to-br from-gray-400 to-slate-500'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : status === 'active' ? (
                          <Clock className="w-6 h-6 text-white animate-pulse" />
                        ) : (
                          <Circle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{session.name}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {session.start_time} - {session.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {sessionRecords.length > 0 ? (
                        <div>
                          <p className="text-sm font-bold text-gray-900 bg-white/50 px-3 py-1 rounded-xl">
                            {status === 'active' ? (
                              elapsedTime.split(':').map((part, index) => {
                                if (index === 0) return `${parseInt(part)}h`;
                                if (index === 1) return ` ${parseInt(part)}m`;
                                return '';
                              }).join('')
                            ) : (
                              totalSessionHours > 0 ? `${Math.floor(totalSessionHours)}h ${Math.round((totalSessionHours % 1) * 60)}m` : '0h 0m'
                            )}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {latestRecord?.check_in_time ? `Started: ${format(new Date(latestRecord.check_in_time), 'h:mm a')}` : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold rounded-full shadow-lg">Not Started</span>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facial Recognition Modal */}
      {showFacialRecognition && (
        <FacialRecognition
          onSuccess={(faceEncoding) => {
            handleCheckIn(faceEncoding);
          }}
          onCancel={() => {
            setShowFacialRecognition(false);
          }}
        />
      )}
    </div>
  );
};

export default Attendance;
