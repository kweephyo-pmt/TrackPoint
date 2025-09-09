import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { User, Mail, Phone, MapPin, Building, Briefcase, Camera, Save, Lock, Trash2, Shield, Settings, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { supabase } from '../../lib/supabase.ts';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';
import toast from 'react-hot-toast';

// Lazy load heavy components
const FaceSetup = lazy(() => import('../../components/Profile/FaceSetup.tsx'));

const Profile: React.FC = () => {
  const { profile, updateProfile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showFaceSetup, setShowFaceSetup] = useState(false);
  const [updatingFace, setUpdatingFace] = useState(false);
  const [showRemoveFaceConfirm, setShowRemoveFaceConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    employee_id: profile?.employee_id || '',
    department: profile?.department || '',
    position: profile?.position || '',
    phone: profile?.phone || '',
    address: profile?.address || ''
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        employee_id: profile.employee_id || '',
        department: profile.department || '',
        position: profile.position || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCancel = useCallback(() => {
    setFormData({
      full_name: profile?.full_name || '',
      employee_id: profile?.employee_id || '',
      department: profile?.department || '',
      position: profile?.position || '',
      phone: profile?.phone || '',
      address: profile?.address || ''
    });
    setIsEditing(false);
  }, [profile]);

  // Optimized image processing
  const processImageAsync = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 150;
        let { width, height } = img;
        const scale = Math.min(maxSize / width, maxSize / height);
        width *= scale;
        height *= scale;
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('File size must be less than 3MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const processedImage = await processImageAsync(file);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: processedImage })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await updateProfile({ avatar_url: processedImage });
      toast.success('Profile picture updated!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, updateProfile, processImageAsync]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleFaceSetup = async (faceEncoding: string) => {
    setUpdatingFace(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ face_encoding: faceEncoding })
        .eq('id', user?.id);

      if (error) throw error;

      await updateProfile({ face_encoding: faceEncoding });
      toast.success('Face profile updated successfully!');
      setShowFaceSetup(false);
    } catch (error: any) {
      console.error('Face setup error:', error);
      toast.error(error.message || 'Failed to update face profile');
    } finally {
      setUpdatingFace(false);
    }
  };

  const handleRemoveFace = () => {
    setShowRemoveFaceConfirm(true);
  };

  const confirmRemoveFace = async () => {
    setShowRemoveFaceConfirm(false);
    setUpdatingFace(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ face_encoding: null })
        .eq('id', user?.id);

      if (error) throw error;

      await updateProfile({ face_encoding: undefined });
      toast.success('Face profile removed successfully!');
    } catch (error: any) {
      console.error('Face removal error:', error);
      toast.error(error.message || 'Failed to remove face profile');
    } finally {
      setUpdatingFace(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!');
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setDeletingAccount(true);

    try {
      // First delete the user's profile data
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError) {
          console.error('Profile deletion error:', profileError);
        }

        // Delete attendance records
        const { error: attendanceError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('user_id', user.id);

        if (attendanceError) {
          console.error('Attendance records deletion error:', attendanceError);
        }
      }

      // Note: Supabase doesn't provide a direct way to delete users from the client
      // In a production app, you'd typically call a server function to handle this
      // For now, we'll sign out the user and show a message
      await supabase.auth.signOut();
      
      toast.success('Account deletion initiated. Please contact support to complete the process.');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/30 to-indigo-50/50"></div>
          <div className="relative text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent flex items-center justify-center sm:justify-start space-x-2">
              <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600" />
              <span>Profile</span>
            </h1>
            <p className="text-gray-600 font-medium flex items-center justify-center sm:justify-start space-x-2 mt-2 text-sm sm:text-base">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-center sm:text-left">Manage your personal information and settings</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 text-center">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name}
                      className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-110"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 px-2">
                {profile?.full_name || (!profile ? 'Loading...' : 'User Name')}
              </h3>
              <p className="text-gray-600 font-semibold mb-2 flex items-center justify-center space-x-2 text-sm sm:text-base px-2">
                <span className="text-center">{profile?.position || (!profile ? 'Loading...' : 'Position')}</span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium px-2">{profile?.department || (!profile ? 'Loading...' : 'Department')}</p>
              
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200/50 mx-4 sm:mx-0">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 space-y-1 sm:space-y-0">
                    <span className="font-medium text-center sm:text-left">Employee ID:</span>
                    <span className="font-bold text-gray-900 text-center sm:text-right break-all">{profile?.employee_id || (!profile ? 'Loading...' : 'N/A')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 space-y-1 sm:space-y-0">
                    <span className="font-medium text-center sm:text-left">Member since:</span>
                    <span className="font-bold text-gray-900 text-center sm:text-right">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : (!profile ? 'Loading...' : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                      <span>Personal Information</span>
                      <span className="text-blue-400">📝</span>
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1 text-center sm:text-left">Update your profile details</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-500/20 text-sm sm:text-base"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="label">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      disabled={!isEditing}
                      className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="label">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    <input
                      id="email"
                      type="email"
                      disabled
                      className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl w-full text-sm bg-gray-50/50 backdrop-blur-sm shadow-sm"
                      value={profile?.email || (!profile ? 'Loading...' : '')}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>Email cannot be changed</span>
                  </p>
                </div>

                {/* Employee ID */}
                <div>
                  <label htmlFor="employee_id" className="label">
                    Employee ID
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    <input
                      id="employee_id"
                      name="employee_id"
                      type="text"
                      disabled={!isEditing}
                      className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                      value={formData.employee_id}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Department & Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="label">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                      <input
                        id="department"
                        name="department"
                        type="text"
                        disabled={!isEditing}
                        className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="position" className="label">
                      Position
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                      <input
                        id="position"
                        name="position"
                        type="text"
                        disabled={!isEditing}
                        className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                        value={formData.position}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="label">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      disabled={!isEditing}
                      className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="label">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      disabled={!isEditing}
                      className={`pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm resize-none ${!isEditing ? 'bg-gray-50/50' : 'bg-white/80'}`}
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

        {/* Account Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 p-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <span>Account Settings</span>
            </h3>
            <p className="text-slate-300 text-sm font-medium mt-1">Manage your security preferences</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Face Recognition Settings */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>Face Recognition</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {!profile 
                      ? 'Loading face recognition status...'
                      : profile?.face_encoding 
                        ? 'Face profile is active for secure attendance'
                        : 'Set up face recognition for secure check-in'
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowFaceSetup(true)}
                    disabled={updatingFace}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                  >
                    {updatingFace ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    <span>{!profile ? 'Loading...' : (profile?.face_encoding ? 'Update' : 'Setup')}</span>
                  </button>
                  
                  {profile?.face_encoding && profile && (
                    <button
                      onClick={handleRemoveFace}
                      disabled={updatingFace}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Change Password */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <span>Change Password</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">Update your account password for better security</p>
                </div>
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change</span>
                </button>
              </div>
            </div>
            
            {/* Delete Account */}
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 flex items-center space-x-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span>Delete Account</span>
                  </h4>
                  <p className="text-sm text-red-600 mt-1">Permanently delete your account and all data</p>
                </div>
                <button 
                  onClick={() => setShowDeleteAccount(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-200/50">
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center justify-center sm:justify-start space-x-2">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span>Change Password</span>
              </h3>
            <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="newPassword" className="label">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {changingPassword ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-200/50">
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-red-900 to-red-700 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center justify-center sm:justify-start space-x-2">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                <span>Delete Account</span>
              </h3>
            <div className="mb-3 sm:mb-4">
              <p className="text-gray-600 mb-2 text-sm sm:text-base text-center sm:text-left">
                This action cannot be undone. This will permanently delete your account and all associated data.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Please type <strong>DELETE</strong> to confirm:
              </p>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="space-y-3 sm:space-y-4">
              <div>
                <input
                  type="text"
                  required
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 w-full text-sm transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm bg-white/80"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base sm:order-2"
                >
                  {deletingAccount ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Remove Face Confirmation Modal */}
      {showRemoveFaceConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-200/50">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 mb-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Remove Face Profile?
              </h3>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to remove your face profile? This will disable facial recognition for attendance check-in.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:gap-6">
                <button
                  onClick={confirmRemoveFace}
                  disabled={updatingFace}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base sm:order-2"
                >
                  {updatingFace ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Removing...
                    </div>
                  ) : (
                    'Remove Profile'
                  )}
                </button>
                <button
                  onClick={() => setShowRemoveFaceConfirm(false)}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base sm:order-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Setup Modal - Lazy Loaded */}
      {showFaceSetup && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading face recognition...</p>
            </div>
          </div>
        }>
          <FaceSetup
            mode={profile?.face_encoding ? 'update' : 'setup'}
            existingFaceEncoding={profile?.face_encoding}
            onSuccess={handleFaceSetup}
            onCancel={() => setShowFaceSetup(false)}
          />
        </Suspense>
      )}
    </div>
    </div>
  );
};

export default Profile;
