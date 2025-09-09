import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Save, X, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 200
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to load locations');
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Error in fetchLocations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('company_locations')
          .update(formData)
          .eq('id', editingId);

        if (error) {
          console.error('Error updating location:', error);
          toast.error('Failed to update location');
          return;
        }

        toast.success('Location updated successfully');
      } else {
        const { error } = await supabase
          .from('company_locations')
          .insert([formData]);

        if (error) {
          console.error('Error adding location:', error);
          toast.error('Failed to add location');
          return;
        }

        toast.success('Location added successfully');
      }

      setEditingId(null);
      setShowAddForm(false);
      setFormData({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        radius_meters: 200
      });
      fetchLocations();
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error('Failed to save location');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      radius_meters: location.radius_meters
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      radius_meters: 200
    });
  };

  const handleDelete = async (locationId: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        console.error('Error deleting location:', error);
        toast.error('Failed to delete location');
        return;
      }

      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Failed to delete location');
    }
  };

  const handleToggleStatus = async (locationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('company_locations')
        .update({ is_active: !currentStatus })
        .eq('id', locationId);

      if (error) {
        console.error('Error updating location status:', error);
        toast.error('Failed to update location status');
        return;
      }

      toast.success(`Location ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchLocations();
    } catch (error) {
      console.error('Error in handleToggleStatus:', error);
      toast.error('Failed to update location status');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success('Current location captured');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
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
          
          {/* Loading Cards Skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
                <div className="h-32 bg-slate-200 rounded-2xl"></div>
              </div>
            </div>
          ))}
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
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Location Management
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg mt-1">Manage allowed check-in locations for employees</p>
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>GPS enabled</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>Real-time tracking</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex items-center space-x-2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-bounce" />
              <span className="text-sm sm:text-base">Add Location</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-cyan-50/50"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <div className="h-10 w-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-emerald-800 bg-clip-text text-transparent">
                    {editingId ? 'Edit Location' : 'Add New Location'}
                  </h3>
                  <p className="text-slate-600 text-sm">Configure location details and GPS coordinates</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="e.g., Main Office"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="Full address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="0.000000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="0.000000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    value={formData.radius_meters}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius_meters: parseInt(e.target.value) || 200 }))}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="200"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Get Current Location</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingId ? 'Update Location' : 'Save Location'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/40 text-slate-700 rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                  Active Locations
                </h3>
                <p className="text-slate-600 text-sm">Manage and monitor location settings</p>
              </div>
            </div>
            
            {locations.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-slate-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-2">No locations found</h4>
                <p className="text-slate-500 mb-6">Add your first location to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Location</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {locations.map((location) => (
                  <div key={location.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{location.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{location.address}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>Lat: {location.latitude.toFixed(6)}</span>
                          <span>Lng: {location.longitude.toFixed(6)}</span>
                          <span>Radius: {location.radius_meters}m</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(location)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-sm font-medium"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(location.id, location.is_active)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                          location.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <span>{location.is_active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocations;
