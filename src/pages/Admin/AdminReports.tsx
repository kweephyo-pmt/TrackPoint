import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Calendar, Download, Users, Clock, TrendingUp, PieChart, CalendarDays, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

interface ReportData {
  totalUsers: number;
  totalHours: number;
  avgHoursPerUser: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  departmentStats: { department: string; hours: number; users: number }[];
  dailyStats: { date: string; hours: number; users: number }[];
}

const AdminReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportData = useCallback(async () => {
    const getDateRange = () => {
      const today = new Date();
      const defaultMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const defaultMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      switch (dateRange) {
        case 'today':
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          return { start: todayStart, end: todayEnd };
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return { start: weekStart, end: weekEnd };
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          return { start: monthStart, end: monthEnd };
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
          const quarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 1);
          return { start: quarterStart, end: quarterEnd };
        case 'custom':
          return {
            start: startDate ? new Date(startDate) : defaultMonthStart,
            end: endDate ? new Date(endDate + 'T23:59:59') : defaultMonthEnd,
          };
        default:
          return { start: defaultMonthStart, end: defaultMonthEnd };
      }
    };

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const [attendanceResult, usersResult] = await Promise.all([
        supabase
          .from('attendance_records')
          .select(`
            id,
            user_id,
            check_in_time,
            total_hours,
            status,
            profiles:user_id (
              full_name,
              department,
              employee_id
            )
          `)
          .gte('check_in_time', start.toISOString())
          .lt('check_in_time', end.toISOString())
          .limit(1000),

        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (attendanceResult.error) {
        console.error('Error fetching attendance data:', attendanceResult.error);
        toast.error('Failed to load report data');
        return;
      }

      if (usersResult.error) {
        console.error('Error fetching users count:', usersResult.error);
      }

      const attendanceData = attendanceResult.data;
      const totalUsers = usersResult.count;

      const records = attendanceData || [];
      const totalHours = records.reduce((sum, record) => sum + (record.total_hours || 0), 0);
      const avgHoursPerUser = totalUsers ? totalHours / totalUsers : 0;

      const presentDays = records.filter((r) => r.status === 'present').length;
      const lateDays = records.filter((r) => r.status === 'late').length;
      const absentDays = records.filter((r) => r.status === 'absent').length;

      const deptMap = new Map();
      records.forEach((record) => {
        // Handle both array and object structure from Supabase join
        const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
        const dept = profile?.department || 'Unassigned Department';
        
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { hours: 0, users: new Set() });
        }
        const deptData = deptMap.get(dept);
        deptData.hours += record.total_hours || 0;
        deptData.users.add(record.user_id);
      });

      const departmentStats = Array.from(deptMap.entries()).map(([department, data]) => ({
        department,
        hours: data.hours,
        users: data.users.size,
      }));

      const dailyMap = new Map();
      records.forEach((record) => {
        const date = new Date(record.check_in_time).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { hours: 0, users: new Set() });
        }
        const dailyData = dailyMap.get(date);
        dailyData.hours += record.total_hours || 0;
        dailyData.users.add(record.user_id);
      });

      const dailyStats = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          hours: data.hours,
          users: data.users.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setReportData({
        totalUsers: totalUsers || 0,
        totalHours,
        avgHoursPerUser,
        presentDays,
        lateDays,
        absentDays,
        departmentStats,
        dailyStats,
      });
    } catch (error) {
      console.error('Error in fetchReportData:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Report Summary'],
      ['Total Users', reportData.totalUsers.toString()],
      ['Total Hours', reportData.totalHours.toString()],
      ['Average Hours per User', reportData.avgHoursPerUser.toFixed(2)],
      ['Present Days', reportData.presentDays.toString()],
      ['Late Days', reportData.lateDays.toString()],
      ['Absent Days', reportData.absentDays.toString()],
      [''],
      ['Department Statistics'],
      ['Department', 'Total Hours', 'Active Users'],
      ...reportData.departmentStats.map((dept) => [dept.department, dept.hours.toString(), dept.users.toString()]),
      [''],
      ['Daily Statistics'],
      ['Date', 'Total Hours', 'Active Users'],
      ...reportData.dailyStats.map((day) => [day.date, day.hours.toString(), day.users.toString()]),
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <div className="animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="h-8 bg-slate-200 rounded-lg w-80 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-60"></div>
                </div>
                <div className="h-12 bg-slate-200 rounded-2xl w-32"></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-2xl"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
              <div className="h-32 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl">
                  <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg mt-1">Comprehensive attendance insights and statistics</p>
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live data</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>Real-time analytics</span>
                </div>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="group flex items-center space-x-2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl lg:rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
              <span className="text-sm sm:text-base">Export Report</span>
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-blue-50/30"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  Date Range Filter
                </h3>
                <p className="text-slate-600 text-sm sm:text-base">Select the time period for your report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Time Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {reportData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-slate-600">Total Users</p>
                    <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {reportData.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/50"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-slate-600">Total Hours</p>
                    <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {reportData.totalHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/50"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-slate-600">Avg Hours/User</p>
                    <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {reportData.avgHoursPerUser.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-lg">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-slate-600">Present Days</p>
                    <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {reportData.presentDays}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Attendance Status Distribution */}
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-blue-50/30"></div>
                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                    <PieChart className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                    Attendance Status Distribution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-3 shadow-sm"></div>
                        <span className="text-sm font-medium text-slate-700">Present</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 bg-emerald-100 px-2 py-1 rounded-lg">{reportData.presentDays}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mr-3 shadow-sm"></div>
                        <span className="text-sm font-medium text-slate-700">Late</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 bg-amber-100 px-2 py-1 rounded-lg">{reportData.lateDays}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full mr-3 shadow-sm"></div>
                        <span className="text-sm font-medium text-slate-700">Absent</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 bg-red-100 px-2 py-1 rounded-lg">{reportData.absentDays}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Statistics */}
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30"></div>
                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-600" />
                    Department Statistics
                  </h3>
                  <div className="space-y-3">
                    {reportData.departmentStats.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 hover:bg-white/80 transition-all duration-200">
                        <span className="text-sm font-medium text-slate-700">{dept.department}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">{dept.hours.toFixed(1)}h</div>
                          <div className="text-xs text-slate-500 font-medium">{dept.users} users</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-indigo-50/30"></div>
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-600" />
                  Daily Attendance Trends
                </h3>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="block sm:hidden space-y-3">
                      {reportData.dailyStats.map((day, index) => (
                        <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {new Date(day.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
                              {day.users} users
                            </span>
                          </div>
                          <div className="text-lg font-bold text-indigo-600">
                            {day.hours.toFixed(1)}h
                          </div>
                        </div>
                      ))}
                    </div>

                    <table className="hidden sm:table min-w-full">
                      <thead>
                        <tr className="bg-white/40 backdrop-blur-sm">
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider rounded-l-xl">
                            Date
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Total Hours
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider rounded-r-xl">
                            Active Users
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20">
                        {reportData.dailyStats.map((day, index) => (
                          <tr key={index} className="hover:bg-white/40 transition-colors duration-200">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {new Date(day.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                              {day.hours.toFixed(1)}h
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {day.users}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
