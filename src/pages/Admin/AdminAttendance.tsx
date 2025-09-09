import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Download, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  status: string;
  session_type_id: string;
  notes: string | null;
  profiles: {
    full_name: string;
    employee_id: string;
    department: string;
  } | null;
  session_types: {
    name: string;
  } | null;
}

const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchAttendanceRecords = useCallback(async () => {
    const getDateRange = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          return {
            start: today.toISOString(),
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return {
            start: weekStart.toISOString(),
            end: weekEnd.toISOString()
          };
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          return {
            start: monthStart.toISOString(),
            end: monthEnd.toISOString()
          };
        case 'custom':
          return {
            start: customStartDate ? new Date(customStartDate).toISOString() : today.toISOString(),
            end: customEndDate ? new Date(customEndDate + 'T23:59:59').toISOString() : new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
        default:
          return {
            start: today.toISOString(),
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
      }
    };

    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      // Optimized query with limit and specific field selection
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          total_hours,
          status,
          session_type_id,
          notes,
          profiles:user_id (
            full_name,
            employee_id,
            department
          ),
          session_types:session_type_id (
            name
          )
        `)
        .gte('check_in_time', start)
        .lt('check_in_time', end)
        .order('check_in_time', { ascending: false })
        .limit(500); // Limit results for better performance

      if (error) {
        console.error('Error fetching attendance records:', error);
        toast.error('Failed to load attendance records');
        return;
      }

      setRecords((data as any) || []);
    } catch (error) {
      console.error('Error in fetchAttendanceRecords:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting record:', error);
        toast.error('Failed to delete record');
        return;
      }

      toast.success('Record deleted successfully');
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error in handleDeleteRecord:', error);
      toast.error('Failed to delete record');
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Employee', 'Employee ID', 'Department', 'Session', 'Check In', 'Check Out', 'Hours', 'Status', 'Notes'].join(','),
      ...filteredRecords.map(record => [
        record.profiles?.full_name || '',
        record.profiles?.employee_id || '',
        record.profiles?.department || '',
        record.session_types?.name || '',
        new Date(record.check_in_time).toLocaleString(),
        record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
        record.total_hours || '0',
        record.status,
        record.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendance data exported successfully');
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.profiles?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.profiles?.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200';
      case 'late': return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200';
      case 'absent': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
      case 'partial': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200';
      default: return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border border-slate-200';
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
                <div className="h-12 bg-slate-200 rounded-2xl w-32"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Filters Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
                <div className="h-12 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Content Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-slate-200 rounded-xl"></div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent flex items-center space-x-3 leading-tight">
                <span>Attendance Management</span>
              </h1>
              <p className="text-slate-600 font-medium flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2 text-sm sm:text-base">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Monitor and manage employee attendance records</span>
                </span>
              </p>
            </div>
            <button
              onClick={exportAttendance}
              className="group flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
              <span className="font-semibold">Export Data</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Filter & Search</h3>
            <p className="text-slate-600 text-sm">Refine your attendance records view</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
                />
              </>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="partial">Partial</option>
            </select>

            <div className="flex items-center justify-center sm:justify-start px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-800">
              <Clock className="h-4 w-4 mr-2" />
              {filteredRecords.length} records
            </div>
          </div>
        </div>

        {/* Attendance Table - Desktop View */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{record.profiles?.full_name}</div>
                        <div className="text-xs text-slate-600 font-medium">{record.profiles?.employee_id}</div>
                        <div className="text-xs text-slate-500">{record.profiles?.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-800">
                      {record.session_types?.name}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-800">
                      {formatDate(record.check_in_time)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-800">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-800">
                      {record.check_out_time ? formatTime(record.check_out_time) : 'Not checked out'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-900">
                      {record.total_hours ? `${record.total_hours}h` : '-'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No attendance records found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'No attendance records for the selected date range.'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{record.profiles?.full_name}</h3>
                  <p className="text-sm text-slate-600 font-medium">{record.profiles?.employee_id} • {record.profiles?.department}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-xl hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session</p>
                    <p className="text-sm font-semibold text-slate-800">{record.session_types?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(record.check_in_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hours</p>
                    <p className="text-sm font-bold text-slate-900">{record.total_hours ? `${record.total_hours}h` : '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</p>
                    <p className="text-sm font-semibold text-slate-800">{formatTime(record.check_in_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {record.check_out_time ? formatTime(record.check_out_time) : 'Not checked out'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
              <Clock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No attendance records found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'No attendance records for the selected date range.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
