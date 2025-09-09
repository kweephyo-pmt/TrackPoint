import React, { useState } from 'react';
import { User, Edit3, Camera, Shield, Calendar, Mail, Building, Save, X, Scan, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.tsx';
import FaceSetup from '../../components/Profile/FaceSetup.tsx';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceSetup, setShowFaceSetup] = useState(false);
  const [faceSetupLoading, setFaceSetupLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    department: '',
    phone: ''
  });

  // Initialize form data when profile loads or editing starts
  React.useEffect(() => {
    if (profile && isEditing) {
      setFormData({
        full_name: profile.full_name || '',
        position: profile.position || '',
        department: profile.department || '',
        phone: profile.phone || ''
      });
    }
  }, [profile, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        position: profile.position || '',
        department: profile.department || '',
        phone: profile.phone || ''
      });
    }
  };

  const handleFaceSetup = async (faceEncoding: string) => {
    if (!profile) return;

    setFaceSetupLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          face_encoding: faceEncoding,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Face recognition setup completed successfully!');
      setShowFaceSetup(false);
      await updateProfile({ face_encoding: faceEncoding });
    } catch (error: any) {
      console.error('Error setting up face recognition:', error);
      toast.error('Failed to setup face recognition. Please try again.');
    } finally {
      setFaceSetupLoading(false);
    }
  };

  const handleRemoveFace = async () => {
    if (!profile) return;

    setFaceSetupLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          face_encoding: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Face recognition removed successfully!');
      await updateProfile({ face_encoding: undefined });
    } catch (error: any) {
      console.error('Error removing face recognition:', error);
      toast.error('Failed to remove face recognition. Please try again.');
    } finally {
      setFaceSetupLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Profile photo updated successfully!');
      await updateProfile({ avatar_url: publicUrl });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket not configured. Please create an "avatars" bucket in Supabase Storage.');
      } else {
        toast.error('Failed to upload photo. Please try again.');
      }
    } finally {
      setPhotoUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white/30 to-gray-50/50"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent flex items-center space-x-2 leading-tight">
                <span>Profile</span>
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" />
              </h1>
              <p className="text-gray-600 font-medium flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-2 text-sm sm:text-base">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                  <span>Manage your personal information</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="relative">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-2xl overflow-hidden">
            {/* Profile Header */}
            <div className="relative p-8 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80">
              <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={triggerPhotoUpload}
                    disabled={photoUploading}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {photoUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left space-y-4">
                  <div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className="text-3xl lg:text-4xl font-bold text-gray-900 bg-white/80 border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Full Name"
                        />
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="text-blue-700 text-lg font-medium bg-white/80 border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Position"
                        />
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="text-gray-600 text-sm bg-white/80 border border-gray-300 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Department"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                          {profile?.full_name || 'Loading...'}
                        </h2>
                        <p className="text-blue-700 text-lg font-medium">
                          {profile?.position || 'Position'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {profile?.department || 'Department'}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    <div className="px-4 py-2 bg-gray-100/80 backdrop-blur-xl rounded-full border border-gray-200/50">
                      <span className="text-gray-700 text-sm font-medium">
                        ID: {profile?.employee_id || 'N/A'}
                      </span>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50/80 backdrop-blur-xl rounded-full border border-emerald-200/50">
                      <span className="text-emerald-700 text-sm font-medium">Active</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col space-y-3">
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-white/80 hover:bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 text-gray-700 font-medium transition-all hover:scale-105 shadow-md"
                    >
                      <Edit3 className="w-5 h-5 inline mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-medium transition-all hover:scale-105 shadow-lg"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2" />
                        ) : (
                          <Save className="w-5 h-5 inline mr-2" />
                        )}
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gray-100/80 hover:bg-gray-200/80 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl rounded-2xl border border-gray-200/50 text-gray-700 font-medium transition-all hover:scale-105 shadow-md"
                      >
                        <X className="w-5 h-5 inline mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <p className="text-gray-600 text-sm">Email</p>
                      <p className="text-gray-900 font-medium">{profile?.email || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <p className="text-gray-600 text-sm">Phone</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="text-gray-900 font-medium bg-white border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Phone number"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Info */}
                <div className="space-y-4">
                  <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Work
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <p className="text-gray-600 text-sm">Department</p>
                      <p className="text-gray-900 font-medium">{profile?.department || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <p className="text-gray-600 text-sm">Position</p>
                      <p className="text-gray-900 font-medium">{profile?.position || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Security & Settings */}
                <div className="space-y-4">
                  <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Security
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Face Recognition</p>
                          <p className="text-gray-900 font-medium">
                            {profile?.face_encoding ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${profile?.face_encoding ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50/80 backdrop-blur-xl rounded-2xl border border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">Member Since</p>
                          <p className="text-gray-900 font-medium">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Loading...'}
                          </p>
                        </div>
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facial Recognition Setup Section */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-2xl overflow-hidden">
          <div className="relative p-8 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Face Recognition</h2>
                <p className="text-gray-600">Secure your account with facial authentication</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {profile?.face_encoding ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-emerald-50/80 border border-emerald-200/50 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-900">Face ID Active</h3>
                    <p className="text-emerald-700">Your face recognition is set up and ready to use for attendance check-ins.</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/50">
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Face Recognition</h4>
                    <p className="text-sm text-gray-600">Remove or reconfigure your facial authentication</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowFaceSetup(true)}
                      disabled={faceSetupLoading}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-xl border border-blue-200 transition-colors disabled:opacity-50"
                    >
                      Reconfigure
                    </button>
                    <button
                      onClick={handleRemoveFace}
                      disabled={faceSetupLoading}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {faceSetupLoading ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-amber-50/80 border border-amber-200/50 rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-900">Face Recognition Not Set Up</h3>
                    <p className="text-amber-700">Set up facial authentication to enable quick and secure attendance check-ins.</p>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50/50 rounded-2xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">1. Camera Access</h4>
                      <p className="text-xs text-gray-600">Allow camera permission</p>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-2xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Scan className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">2. Face Scan</h4>
                      <p className="text-xs text-gray-600">Look at the camera</p>
                    </div>
                    <div className="p-4 bg-blue-50/50 rounded-2xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">3. Complete</h4>
                      <p className="text-xs text-gray-600">Ready to use</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowFaceSetup(true)}
                    disabled={faceSetupLoading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Scan className="w-5 h-5 inline mr-2" />
                    Setup Face Recognition
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {!profile && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your profile...</p>
          </div>
        )}

        {/* Facial Recognition Setup Modal */}
        {showFaceSetup && (
          <FaceSetup
            mode={profile?.face_encoding ? 'update' : 'setup'}
            existingFaceEncoding={profile?.face_encoding}
            onSuccess={handleFaceSetup}
            onCancel={() => setShowFaceSetup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
