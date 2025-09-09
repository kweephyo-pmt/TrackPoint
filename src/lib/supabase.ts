import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://eiqcqnrqbdabmjvjbgcs.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWNxbnJxYmRhYm1qdmpiZ2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ1ODgsImV4cCI6MjA3MjkzMDU4OH0.Zv5EkVBNBHlLe9o8EaXOIjQgEH4PzKeHjkWMtUXZkNk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Break tracking functions
export const breakAPI = {
  // Start a new break
  async startBreak(attendanceRecordId: string, breakType: 'short' | 'lunch' | 'general' | 'custom' = 'general') {
    const { data, error } = await supabase
      .from('break_records')
      .insert({
        attendance_record_id: attendanceRecordId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        break_type: breakType,
        start_time: new Date().toISOString()
      })
      .select()
      .single();
    
    return { data, error };
  },

  // End a break
  async endBreak(breakId: string) {
    const { data, error } = await supabase
      .from('break_records')
      .update({
        end_time: new Date().toISOString()
      })
      .eq('id', breakId)
      .select()
      .single();
    
    return { data, error };
  },

  // Get active break for attendance record
  async getActiveBreak(attendanceRecordId: string) {
    const { data, error } = await supabase
      .from('break_records')
      .select('*')
      .eq('attendance_record_id', attendanceRecordId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return { data, error };
  },

  // Get all breaks for attendance record
  async getBreaksForAttendance(attendanceRecordId: string) {
    const { data, error } = await supabase
      .from('break_records')
      .select('*')
      .eq('attendance_record_id', attendanceRecordId)
      .order('start_time', { ascending: true });
    
    return { data, error };
  },

  // Get breaks for date range
  async getBreaksForDateRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('break_records')
      .select(`
        *,
        attendance_records (
          session_type_id,
          session_types (name)
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: false });
    
    return { data, error };
  }
};

// Types for our database tables
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  is_active: boolean;
  face_encoding?: string;
  allowed_locations?: any[];
  created_at: string;
  updated_at: string;
}

export interface SessionType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  session_type_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  check_in_method?: 'facial' | 'manual';
  check_out_method?: 'facial' | 'manual';
  total_hours?: number;
  total_break_minutes?: number;
  net_work_hours?: number;
  status: 'present' | 'late' | 'absent';
  created_at: string;
  updated_at: string;
  session_types?: SessionType;
  break_records?: BreakRecord[];
}

export interface BreakRecord {
  id: string;
  attendance_record_id: string;
  user_id: string;
  break_type: 'short' | 'lunch' | 'general' | 'custom';
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  id: string;
  user_id: string;
  date: string;
  total_hours: number;
  overtime_hours: number;
  sessions_completed: number;
  sessions_missed: number;
  status: 'present' | 'late' | 'absent' | 'partial';
  created_at: string;
  updated_at: string;
}

export interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}
