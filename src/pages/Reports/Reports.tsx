import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, TrendingUp, Clock, BarChart3, FileText, Filter, RefreshCw, CheckCircle, Users, Activity, Award, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { supabase, AttendanceRecord, AttendanceSummary } from '../../lib/supabase.ts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');

  const fetchSummaryData = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching summary data:', error);
      return;
    }

    setSummaryData(data || []);
  }, [user, dateRange]);

  const fetchDetailedData = useCallback(async () => {
    if (!user) return;

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
      .gte('check_in_time', `${dateRange.start}T00:00:00`)
      .lte('check_in_time', `${dateRange.end}T23:59:59`)
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching detailed data:', error);
      return;
    }

    setAttendanceData(data || []);
  }, [user, dateRange]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === 'summary') {
        await fetchSummaryData();
      } else {
        await fetchDetailedData();
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [reportType, fetchSummaryData, fetchDetailedData]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, fetchReportData]);

  const calculateStats = () => {
    if (reportType === 'summary') {
      const totalHours = summaryData.reduce((sum, day) => sum + (day.total_hours || 0), 0);
      const totalOvertimeHours = summaryData.reduce((sum, day) => sum + (day.overtime_hours || 0), 0);
      const presentDays = summaryData.filter(day => day.status === 'present').length;
      const lateDays = summaryData.filter(day => day.status === 'late').length;
      const absentDays = summaryData.filter(day => day.status === 'absent').length;
      const totalDays = summaryData.length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        totalHours,
        totalOvertimeHours,
        presentDays,
        lateDays,
        absentDays,
        attendanceRate,
        averageHoursPerDay: totalDays > 0 ? totalHours / totalDays : 0
      };
    } else {
      const totalHours = attendanceData.reduce((sum, record) => sum + (record.total_hours || 0), 0);
      const totalSessions = attendanceData.length;
      const completedSessions = attendanceData.filter(record => record.check_out_time).length;
      const incompleteSessions = totalSessions - completedSessions;

      return {
        totalHours,
        totalSessions,
        completedSessions,
        incompleteSessions,
        averageHoursPerSession: totalSessions > 0 ? totalHours / totalSessions : 0
      };
    }
  };


  const handleExport = () => {
    // Simple CSV export
    const data = reportType === 'summary' ? summaryData : attendanceData;
    const headers = reportType === 'summary' 
      ? ['Date', 'Total Hours', 'Overtime Hours', 'Sessions Completed', 'Status']
      : ['Date', 'Session', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (reportType === 'summary') {
          const summary = item as AttendanceSummary;
          return [
            summary.date,
            summary.total_hours,
            summary.overtime_hours,
            summary.sessions_completed,
            summary.status
          ].join(',');
        } else {
          const record = item as AttendanceRecord;
          return [
            format(new Date(record.check_in_time!), 'yyyy-MM-dd'),
            record.session_types?.name || '',
            record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '',
            record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '',
            record.total_hours || 0,
            record.status
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white/30 to-gray-50/50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent flex items-center space-x-2 leading-tight">
                <span>Reports</span>
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" />
              </h1>
              <p className="text-gray-600 font-medium flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2 text-sm sm:text-base">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                  <span>Analyze your attendance data and performance metrics</span>
                </span>
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <span>Filters & Settings</span>
              <Filter className="w-6 h-6 text-gray-400" />
            </h3>
            <p className="text-gray-200 text-sm font-medium mt-1">Customize your report view and date range</p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'summary' | 'detailed')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                >
                  <option value="summary">Summary View</option>
                  <option value="detailed">Detailed View</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                />
              </div>
              <div className="flex flex-col justify-end space-y-3">
                <button
                  onClick={() => {
                    const lastMonth = subMonths(new Date(), 1);
                    setDateRange({
                      start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                      end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
                    });
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Last Month</span>
                </button>
                <button
                  onClick={fetchReportData}
                  className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Hours Card */}
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
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Hours</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">{Math.floor(stats.totalHours)}h {Math.round((stats.totalHours % 1) * 60)}m</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-500 font-semibold">Hours worked</p>
                  </div>
                </div>
              </div>
            </div>

            {reportType === 'summary' ? (
              <>
                {/* Present Days Card */}
                <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-emerald-300/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 to-teal-50/70"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-emerald-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                        <Calendar className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Present Days</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 bg-clip-text text-transparent">{stats.presentDays}</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-500 font-semibold">Days attended</p>
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
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-amber-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                        <Award className="w-8 h-8" />
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
                {/* Avg Hours/Day Card */}
                <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-purple-300/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/70 to-pink-50/70"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-purple-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                        <Target className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Avg Hours/Day</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">{Math.floor((stats as any).averageHoursPerDay)}h {Math.round(((stats as any).averageHoursPerDay % 1) * 60)}m</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-500 font-semibold">Daily average</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Total Sessions Card */}
                <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-emerald-300/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 to-teal-50/70"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-emerald-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                        <Activity className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Sessions</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 bg-clip-text text-transparent">{stats.totalSessions}</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-500 font-semibold">Sessions completed</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Avg Hours/Session Card */}
                <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-purple-300/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/70 to-pink-50/70"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-purple-500 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:rotate-12">
                        <Target className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Avg Hours/Session</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">{Math.floor((stats as any).averageHoursPerSession)}h {Math.round(((stats as any).averageHoursPerSession % 1) * 60)}m</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-500 font-semibold">Session average</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span>{reportType === 'summary' ? 'Daily Summary' : 'Detailed Records'}</span>
                <FileText className="w-6 h-6 text-gray-400" />
              </h3>
              <p className="text-gray-200 text-sm font-medium mt-1">Complete attendance data breakdown</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {reportType === 'summary' ? (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hours</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Overtime</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sessions</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Session</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check In</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check Out</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hours</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200">
                    {reportType === 'summary' ? (
                      summaryData.map((summary, index) => (
                        <tr key={summary.id} className={`hover:bg-gray-50/80 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {format(new Date(summary.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.floor(summary.total_hours)}h {Math.round((summary.total_hours % 1) * 60)}m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.floor(summary.overtime_hours)}h {Math.round((summary.overtime_hours % 1) * 60)}m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {summary.sessions_completed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              summary.status === 'present' ? 'bg-green-100 text-green-800' :
                              summary.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {summary.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      attendanceData.map((record, index) => (
                        <tr key={record.id} className={`hover:bg-gray-50/80 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {format(new Date(record.check_in_time!), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.session_types?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_in_time ? format(new Date(record.check_in_time), 'h:mm a') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_out_time ? format(new Date(record.check_out_time), 'h:mm a') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.total_hours ? `${Math.floor(record.total_hours)}h ${Math.round((record.total_hours % 1) * 60)}m` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Reports;
