-- Attendance Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    employee_id TEXT UNIQUE,
    department TEXT,
    position TEXT,
    phone TEXT,
    address TEXT,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    face_encoding TEXT, -- Store face encoding for facial recognition
    allowed_locations JSONB DEFAULT '[]'::jsonb, -- Store allowed check-in locations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session types table
CREATE TABLE IF NOT EXISTS public.session_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default session types
INSERT INTO public.session_types (name, start_time, end_time, description) VALUES
('Morning', '08:00:00', '12:00:00', 'Morning work session'),
('Lunch', '13:00:00', '14:00:00', 'Lunch break session'),
('Afternoon', '14:00:00', '18:00:00', 'Afternoon work session'),
('Evening', '19:00:00', '22:00:00', 'Evening work session')
ON CONFLICT (name) DO NOTHING;

-- Attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    session_type_id UUID REFERENCES public.session_types(id) NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_location JSONB, -- Store lat, lng, address
    check_out_location JSONB,
    check_in_method TEXT CHECK (check_in_method IN ('manual', 'facial', 'qr_code')),
    check_out_method TEXT CHECK (check_out_method IN ('manual', 'facial', 'qr_code')),
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'partial')),
    notes TEXT,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance summary table for reporting
CREATE TABLE IF NOT EXISTS public.attendance_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    date DATE NOT NULL,
    total_hours DECIMAL(4,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    sessions_missed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Company locations table
CREATE TABLE IF NOT EXISTS public.company_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default company location (you can update this)
INSERT INTO public.company_locations (name, address, latitude, longitude, radius_meters) VALUES
('Main Office', '123 Business Street, City, Country', 37.7749, -122.4194, 1000)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON public.attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_user_date ON public.attendance_summary(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Attendance records policies
CREATE POLICY "Users can view their own attendance records" ON public.attendance_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records" ON public.attendance_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records" ON public.attendance_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Attendance summary policies
CREATE POLICY "Users can view their own attendance summary" ON public.attendance_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance summary" ON public.attendance_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance summary" ON public.attendance_summary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance summary" ON public.attendance_summary
    FOR DELETE USING (auth.uid() = user_id);

-- Session types policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view session types" ON public.session_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Company locations policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view company locations" ON public.company_locations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, employee_id, department, position)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'employee_id',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'position'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate total hours
CREATE OR REPLACE FUNCTION calculate_total_hours(check_in TIMESTAMP WITH TIME ZONE, check_out TIMESTAMP WITH TIME ZONE)
RETURNS DECIMAL(4,2) AS $$
BEGIN
    IF check_in IS NULL OR check_out IS NULL THEN
        RETURN 0;
    END IF;
    IF check_out <= check_in THEN
        RETURN 0;
    END IF;
    RETURN ROUND(EXTRACT(EPOCH FROM (check_out - check_in)) / 3600.0, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update attendance summary
CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER 
SECURITY DEFINER AS $$
DECLARE
    summary_date DATE;
    total_hrs DECIMAL(4,2);
    overtime_hrs DECIMAL(4,2);
    sessions_count INTEGER;
    target_user_id UUID;
BEGIN
    -- Handle different trigger operations
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
        summary_date := (OLD.check_in_time)::date;
    ELSE
        target_user_id := NEW.user_id;
        summary_date := (NEW.check_in_time)::date;
    END IF;
    
    -- Skip if no valid date
    IF summary_date IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate totals for the day
    SELECT 
        COALESCE(SUM(total_hours), 0),
        COALESCE(SUM(overtime_hours), 0),
        COUNT(*)
    INTO total_hrs, overtime_hrs, sessions_count
    FROM public.attendance_records
    WHERE user_id = target_user_id
    AND (check_in_time)::date = summary_date
    AND check_in_time IS NOT NULL;
    
    -- Insert or update summary
    INSERT INTO public.attendance_summary (user_id, date, total_hours, overtime_hours, sessions_completed)
    VALUES (target_user_id, summary_date, total_hrs, overtime_hrs, sessions_count)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_hours = EXCLUDED.total_hours,
        overtime_hours = EXCLUDED.overtime_hours,
        sessions_completed = EXCLUDED.sessions_completed,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Simplified function to automatically calculate total hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER 
SECURITY DEFINER AS $$
BEGIN
    -- Only calculate if both check_in and check_out times exist
    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        NEW.total_hours := calculate_total_hours(NEW.check_in_time, NEW.check_out_time);
        
        -- Simple overtime calculation
        IF NEW.total_hours > 8 THEN
            NEW.overtime_hours := NEW.total_hours - 8;
        ELSE
            NEW.overtime_hours := 0;
        END IF;
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get current session based on time
CREATE OR REPLACE FUNCTION get_current_session()
RETURNS TABLE(id UUID, name TEXT, start_time TIME, end_time TIME) AS $$
BEGIN
    RETURN QUERY
    SELECT st.id, st.name, st.start_time, st.end_time
    FROM public.session_types st
    WHERE st.is_active = true
    AND CURRENT_TIME BETWEEN st.start_time AND st.end_time
    ORDER BY st.start_time
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can check in at current location
CREATE OR REPLACE FUNCTION can_check_in_at_location(
    user_id UUID,
    check_lat DECIMAL,
    check_lng DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    location_record RECORD;
    distance_meters DECIMAL;
    location_count INTEGER;
BEGIN
    -- Check if there are any active company locations
    SELECT COUNT(*) INTO location_count
    FROM public.company_locations
    WHERE is_active = true;
    
    -- If no locations configured, allow check-in anywhere (for development)
    IF location_count = 0 THEN
        RETURN true;
    END IF;
    
    -- If coordinates are null or zero, allow check-in (for testing)
    IF check_lat IS NULL OR check_lng IS NULL OR (check_lat = 0 AND check_lng = 0) THEN
        RETURN true;
    END IF;
    
    -- Check against all active company locations
    FOR location_record IN 
        SELECT latitude, longitude, radius_meters
        FROM public.company_locations
        WHERE is_active = true
    LOOP
        -- Skip invalid coordinates
        IF location_record.latitude = 0 AND location_record.longitude = 0 THEN
            RETURN true;
        END IF;
        
        -- Calculate distance using Haversine formula (simplified)
        distance_meters := (
            6371000 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(location_record.latitude)) * 
                    cos(radians(check_lat)) * 
                    cos(radians(check_lng) - radians(location_record.longitude)) + 
                    sin(radians(location_record.latitude)) * 
                    sin(radians(check_lat))
                ))
            )
        );
        
        -- If within radius of any location, allow check-in
        IF distance_meters <= location_record.radius_meters THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE TRIGGER calculate_hours_trigger
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_hours();

CREATE OR REPLACE TRIGGER attendance_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_attendance_summary();
