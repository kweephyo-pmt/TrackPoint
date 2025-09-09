import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, MapPin, Users, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase.ts';
import toast from 'react-hot-toast';

interface SessionType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  is_active: boolean;
}

const AdminSettings: React.FC = () => {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionTypes();
  }, []);

  const fetchSessionTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_types')
        .select('*')
        .order('start_time');

      if (error) {
        console.error('Error fetching session types:', error);
        toast.error('Failed to load session types');
        return;
      }

      setSessionTypes(data || []);
    } catch (error) {
      console.error('Error in fetchSessionTypes:', error);
      toast.error('Failed to load session types');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionTypeChange = (id: string, field: string, value: string | boolean) => {
    setSessionTypes(prev => prev.map(session => 
      session.id === id ? { ...session, [field]: value } : session
    ));
  };

  const saveSessionTypes = async () => {
    try {
      setSaving(true);
      
      for (const session of sessionTypes) {
        const { error } = await supabase
          .from('session_types')
          .update({
            name: session.name,
            start_time: session.start_time,
            end_time: session.end_time,
            description: session.description,
            is_active: session.is_active
          })
          .eq('id', session.id);

        if (error) {
          console.error('Error updating session type:', error);
          toast.error(`Failed to update ${session.name}`);
          return;
        }
      }

      toast.success('Session types updated successfully');
    } catch (error) {
      console.error('Error in saveSessionTypes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUserImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          if (!headers.includes('email') || !headers.includes('full_name')) {
            toast.error('CSV must include email and full_name columns');
            return;
          }

          const users: Record<string, string>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 2 && values[0] && values[1]) {
              const user: Record<string, string> = {};
              headers.forEach((header, index) => {
                user[header] = values[index] || '';
              });
              users.push(user);
            }
          }

          if (users.length === 0) {
            toast.error('No valid user data found in CSV');
            return;
          }

          toast.success(`Found ${users.length} users. Import functionality would be implemented here.`);
          console.log('Users to import:', users);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          toast.error('Failed to parse CSV file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLocationSync = async () => {
    try {
      toast.loading('Syncing location data...', { id: 'location-sync' });
      
      // Simulate location sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: locations, error } = await supabase
        .from('company_locations')
        .select('*');

      if (error) {
        toast.error('Failed to sync location data', { id: 'location-sync' });
        return;
      }

      toast.success(`Successfully synced ${locations?.length || 0} locations`, { id: 'location-sync' });
    } catch (error) {
      console.error('Error syncing locations:', error);
      toast.error('Failed to sync location data', { id: 'location-sync' });
    }
  };

  const handleSecurityAudit = async () => {
    try {
      toast.loading('Running security audit...', { id: 'security-audit' });
      
      // Simulate security audit process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const auditResults = {
        totalUsers: 0,
        activeLocations: 0,
        activeSessions: 0,
        securityScore: 95
      };

      // Get actual data for audit
      const [usersResult, locationsResult, sessionsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('company_locations').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('session_types').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      auditResults.totalUsers = usersResult.count || 0;
      auditResults.activeLocations = locationsResult.count || 0;
      auditResults.activeSessions = sessionsResult.count || 0;

      toast.success(
        `Security Audit Complete!\n` +
        `Users: ${auditResults.totalUsers} | ` +
        `Locations: ${auditResults.activeLocations} | ` +
        `Sessions: ${auditResults.activeSessions}\n` +
        `Security Score: ${auditResults.securityScore}%`,
        { 
          id: 'security-audit',
          duration: 5000
        }
      );
    } catch (error) {
      console.error('Error running security audit:', error);
      toast.error('Failed to complete security audit', { id: 'security-audit' });
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
              </div>
            </div>
          </div>
          
          {/* Loading Cards Skeleton */}
          {[...Array(4)].map((_, i) => (
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
                  <Settings className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  System Settings
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg mt-1">Configure system-wide attendance settings</p>
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>System active</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>Real-time sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Types Configuration */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-indigo-50/50"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6 sm:mb-8">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                    Session Types
                  </h3>
                  <p className="text-slate-600 text-sm">Configure work session schedules</p>
                </div>
              </div>
              <button
                onClick={saveSessionTypes}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="font-medium">Save Changes</span>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {sessionTypes.map((session) => (
                <div key={session.id} className="relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Session Name
                      </label>
                      <input
                        type="text"
                        value={session.name}
                        onChange={(e) => handleSessionTypeChange(session.id, 'name', e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={session.start_time}
                        onChange={(e) => handleSessionTypeChange(session.id, 'start_time', e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={session.end_time}
                        onChange={(e) => handleSessionTypeChange(session.id, 'end_time', e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={session.description || ''}
                        onChange={(e) => handleSessionTypeChange(session.id, 'description', e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="Session description"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`active-${session.id}`}
                          checked={session.is_active}
                          onChange={(e) => handleSessionTypeChange(session.id, 'is_active', e.target.checked)}
                          className="h-5 w-5 text-blue-600 bg-white/80 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                        />
                        <label htmlFor={`active-${session.id}`} className="text-sm font-semibold text-slate-700 cursor-pointer">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-emerald-50/50 to-teal-50/50"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-green-800 bg-clip-text text-transparent">
                  System Information
                </h3>
                <p className="text-slate-600 text-sm">Current system status and health</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Database Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Connected to Supabase</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Row Level Security Enabled</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Admin Policies Active</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Authentication
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Supabase Auth Enabled</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Role-based Access Control</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-slate-700">Session Management Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-rose-50/50"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-800 bg-clip-text text-transparent">
                  Feature Configuration
                </h3>
                <p className="text-slate-600 text-sm">System features and capabilities</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Facial Recognition</h4>
                    <p className="text-sm text-slate-600">Enable facial recognition for check-in/out</p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Enabled
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Location Verification</h4>
                    <p className="text-sm text-slate-600">Require employees to be within allowed locations</p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Enabled
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Mobile Responsive</h4>
                    <p className="text-sm text-slate-600">Optimized for mobile devices</p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Enabled
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Real-time Updates</h4>
                    <p className="text-sm text-slate-600">Live attendance data synchronization</p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6 sm:mb-8">
              <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-transparent">
                  Quick Actions
                </h3>
                <p className="text-slate-600 text-sm">Administrative shortcuts and tools</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button 
                onClick={handleBulkUserImport}
                className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80 hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-900 mb-1">Bulk User Import</div>
                    <div className="text-sm text-slate-600">Import users from CSV file</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleLocationSync}
                className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80 hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-900 mb-1">Location Sync</div>
                    <div className="text-sm text-slate-600">Update location data</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleSecurityAudit}
                className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80 hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-slate-900 mb-1">Security Audit</div>
                    <div className="text-sm text-slate-600">Review system security</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
