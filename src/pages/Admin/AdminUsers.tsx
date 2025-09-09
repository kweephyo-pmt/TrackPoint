import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  X, 
  Save, 
  UserCheck,
  UserX,
  Mail,
  User,
  Building,
  Briefcase,
  Shield,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  UserPlus
} from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string;
  department: string;
  position: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department: '',
    position: '',
    role: 'user' as 'user' | 'admin'
  });
  const [addFormData, setAddFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department: '',
    position: '',
    role: 'user' as 'user' | 'admin',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Optimized query with specific fields and limit
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, employee_id, department, position, role, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(200); // Limit for better performance

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        return;
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        toast.error('Failed to update user status');
        return;
      }

      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error in handleToggleUserStatus:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      employee_id: user.employee_id || '',
      department: user.department || '',
      position: user.position || '',
      role: user.role as 'user' | 'admin'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          employee_id: editFormData.employee_id,
          department: editFormData.department,
          position: editFormData.position,
          role: editFormData.role
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      toast.error('Failed to update user');
    }
  };

  const handleAddUser = async () => {
    try {
      if (!addFormData.email || !addFormData.password || !addFormData.full_name) {
        toast.error('Email, password, and full name are required');
        return;
      }

      setAddingUser(true);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addFormData.email,
        password: addFormData.password,
        options: {
          data: {
            full_name: addFormData.full_name,
            employee_id: addFormData.employee_id,
            department: addFormData.department,
            position: addFormData.position,
            role: addFormData.role
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        toast.error(authError.message);
        return;
      }

      if (authData.user) {
        // Update the profile with additional data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: addFormData.full_name,
            employee_id: addFormData.employee_id,
            department: addFormData.department,
            position: addFormData.position,
            role: addFormData.role
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          toast.error('User created but profile update failed');
        } else {
          toast.success('User created successfully');
        }
      }

      setShowAddModal(false);
      setAddFormData({
        full_name: '',
        email: '',
        employee_id: '',
        department: '',
        position: '',
        role: 'user',
        password: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error in handleAddUser:', error);
      toast.error('Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Employee ID', 'Department', 'Position', 'Role', 'Status', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.full_name,
        user.email,
        user.employee_id || '',
        user.department || '',
        user.position || '',
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading Header Skeleton */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
            <div className="animate-pulse">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-slate-200 rounded-xl lg:rounded-2xl"></div>
                  <div className="min-w-0 flex-1">
                    <div className="h-8 bg-slate-200 rounded-lg w-64 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Filters Skeleton */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                <div className="h-12 bg-slate-200 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Content Skeleton */}
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20">
            <div className="animate-pulse p-4 space-y-4">
              <div className="h-12 bg-slate-200 rounded-xl"></div>
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent truncate">
                  User Management
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg mt-1 hidden sm:block">Manage system users and their permissions</p>
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live data</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>{users.length} total users</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3 sm:mt-0">
              <button
                onClick={exportUsers}
                className="group flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl lg:rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
                <span className="font-semibold text-sm sm:text-base hidden sm:inline">Export Data</span>
                <span className="font-semibold text-sm sm:hidden">Export</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="group flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold text-sm sm:text-base hidden sm:inline">Add User</span>
                <span className="font-semibold text-sm sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-blue-50/30"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Filter & Search</h3>
                <p className="text-slate-600 text-xs sm:text-sm hidden sm:block">Find and organize your users</p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg px-3 py-2">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-sm">{filteredUsers.length}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Search Field - Full Width on Mobile */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/90 text-sm"
                  />
                </div>
              </div>
              
              {/* Filters Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/90 text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/90 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-slate-50/50"></div>
          
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="p-4 space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-bold rounded-lg ${
                        user.is_active 
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' 
                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500 mb-1 text-xs">Employee ID</div>
                      <div className="font-medium text-slate-900 text-xs truncate">{user.employee_id || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1 text-xs">Role</div>
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-bold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800' 
                          : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1 text-xs">Department</div>
                      <div className="font-medium text-slate-900 text-xs truncate">{user.department || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1 text-xs">Position</div>
                      <div className="font-medium text-slate-900 text-xs truncate">{user.position || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-2 space-x-1">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="relative overflow-x-auto hidden lg:block">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/80 transition-all duration-200 group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.full_name}</div>
                          <div className="text-sm text-slate-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{user.employee_id || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{user.department || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{user.position || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-purple-500" />
                        ) : (
                          <User className="h-4 w-4 text-slate-400" />
                        )}
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800' 
                            : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        className={`group/status inline-flex items-center space-x-2 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-200 ${
                          user.is_active 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 hover:from-emerald-200 hover:to-green-200 hover:shadow-lg' 
                            : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 hover:from-red-200 hover:to-rose-200 hover:shadow-lg'
                        }`}
                      >
                        {user.is_active ? (
                          <UserCheck className="h-3 w-3 group-hover/status:scale-110 transition-transform duration-200" />
                        ) : (
                          <UserX className="h-3 w-3 group-hover/status:scale-110 transition-transform duration-200" />
                        )}
                        <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="group/edit p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4 group-hover/edit:scale-110 transition-transform duration-200" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="group/delete p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 group-hover/delete:scale-110 transition-transform duration-200" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State for Desktop */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <div className="h-20 w-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No users found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by adding a new user.'}
              </p>
              {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold">Add Your First User</span>
                </button>
              )}
            </div>
          )}
        </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={editFormData.employee_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div 
          className="fixed z-50 flex items-center justify-center" 
          style={{ 
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
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm transform transition-all duration-300">
            {/* Modern Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-t-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 rounded-t-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Add New User</h3>
                    <p className="text-blue-100 text-sm">Create account for system access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">

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
                      value={addFormData.full_name}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, full_name: e.target.value }))}
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
                      value={addFormData.email}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
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
                      value={addFormData.password}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
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
                </div>


                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Role
                  </label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white/80"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser || !addFormData.email || !addFormData.password || !addFormData.full_name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {addingUser ? (
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

export default AdminUsers;
