-- Timezone Migration Script for Bangkok (Asia/Bangkok)
-- Run this in your Supabase SQL editor to configure Bangkok timezone

-- Set the database timezone to Bangkok
SET timezone = 'Asia/Bangkok';

-- Create a function to ensure all timestamp operations use Bangkok timezone
CREATE OR REPLACE FUNCTION set_bangkok_timezone()
RETURNS void AS $$
BEGIN
    -- Set session timezone to Bangkok
    PERFORM set_config('timezone', 'Asia/Bangkok', false);
END;
$$ LANGUAGE plpgsql;

-- Update existing functions to use Bangkok timezone
CREATE OR REPLACE FUNCTION calculate_total_hours(check_in TIMESTAMP WITH TIME ZONE, check_out TIMESTAMP WITH TIME ZONE)
RETURNS DECIMAL(4,2) AS $$
BEGIN
    -- Set timezone to Bangkok for this function
    PERFORM set_config('timezone', 'Asia/Bangkok', true);
    
    IF check_in IS NULL OR check_out IS NULL THEN
        RETURN 0;
    END IF;
    IF check_out <= check_in THEN
        RETURN 0;
    END IF;
    RETURN ROUND(EXTRACT(EPOCH FROM (check_out - check_in)) / 3600.0, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the attendance summary function to use Bangkok timezone
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
    -- Set timezone to Bangkok for this function
    PERFORM set_config('timezone', 'Asia/Bangkok', true);
    
    -- Handle different trigger operations
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
        summary_date := (OLD.check_in_time AT TIME ZONE 'Asia/Bangkok')::date;
    ELSE
        target_user_id := NEW.user_id;
        summary_date := (NEW.check_in_time AT TIME ZONE 'Asia/Bangkok')::date;
    END IF;
    
    -- Skip if no valid date
    IF summary_date IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate totals for the day (using Bangkok timezone)
    SELECT 
        COALESCE(SUM(total_hours), 0),
        COALESCE(SUM(overtime_hours), 0),
        COUNT(*)
    INTO total_hrs, overtime_hrs, sessions_count
    FROM public.attendance_records
    WHERE user_id = target_user_id
    AND (check_in_time AT TIME ZONE 'Asia/Bangkok')::date = summary_date
    AND check_in_time IS NOT NULL;
    
    -- Insert or update summary
    INSERT INTO public.attendance_summary (user_id, date, total_hours, overtime_hours, sessions_completed)
    VALUES (target_user_id, summary_date, total_hrs, overtime_hrs, sessions_count)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_hours = EXCLUDED.total_hours,
        overtime_hours = EXCLUDED.overtime_hours,
        sessions_completed = EXCLUDED.sessions_completed,
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok';
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update the calculate attendance hours function to use Bangkok timezone
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER 
SECURITY DEFINER AS $$
BEGIN
    -- Set timezone to Bangkok for this function
    PERFORM set_config('timezone', 'Asia/Bangkok', true);
    
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
    
    -- Update timestamp with Bangkok timezone
    NEW.updated_at := NOW() AT TIME ZONE 'Asia/Bangkok';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the get current session function to use Bangkok timezone
CREATE OR REPLACE FUNCTION get_current_session()
RETURNS TABLE(id UUID, name TEXT, start_time TIME, end_time TIME) AS $$
BEGIN
    -- Set timezone to Bangkok for this function
    PERFORM set_config('timezone', 'Asia/Bangkok', true);
    
    RETURN QUERY
    SELECT st.id, st.name, st.start_time, st.end_time
    FROM public.session_types st
    WHERE st.is_active = true
    AND (CURRENT_TIME AT TIME ZONE 'Asia/Bangkok')::time BETWEEN st.start_time AND st.end_time
    ORDER BY st.start_time
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to get current Bangkok time
CREATE OR REPLACE FUNCTION get_bangkok_now()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'Asia/Bangkok';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a helper function to convert any timestamp to Bangkok timezone
CREATE OR REPLACE FUNCTION to_bangkok_time(input_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN input_timestamp AT TIME ZONE 'Asia/Bangkok';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update default values for timestamp columns to use Bangkok timezone
ALTER TABLE public.profiles 
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
    ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

ALTER TABLE public.session_types 
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

ALTER TABLE public.attendance_records 
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
    ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

ALTER TABLE public.attendance_summary 
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
    ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

ALTER TABLE public.company_locations 
    ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- Helper function to get attendance records with Bangkok timezone
CREATE OR REPLACE FUNCTION get_attendance_records_bangkok(
    p_user_id UUID DEFAULT NULL,
    p_date DATE DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    session_type_id UUID,
    check_in_time_bangkok TIMESTAMP,
    check_out_time_bangkok TIMESTAMP,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_location JSONB,
    check_out_location JSONB,
    check_in_method TEXT,
    check_out_method TEXT,
    status TEXT,
    notes TEXT,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2),
    created_at_bangkok TIMESTAMP,
    updated_at_bangkok TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.user_id,
        ar.session_type_id,
        (ar.check_in_time AT TIME ZONE 'Asia/Bangkok')::TIMESTAMP as check_in_time_bangkok,
        (ar.check_out_time AT TIME ZONE 'Asia/Bangkok')::TIMESTAMP as check_out_time_bangkok,
        ar.check_in_time,
        ar.check_out_time,
        ar.check_in_location,
        ar.check_out_location,
        ar.check_in_method,
        ar.check_out_method,
        ar.status,
        ar.notes,
        ar.total_hours,
        ar.overtime_hours,
        (ar.created_at AT TIME ZONE 'Asia/Bangkok')::TIMESTAMP as created_at_bangkok,
        (ar.updated_at AT TIME ZONE 'Asia/Bangkok')::TIMESTAMP as updated_at_bangkok,
        ar.created_at,
        ar.updated_at
    FROM public.attendance_records ar
    WHERE (p_user_id IS NULL OR ar.user_id = p_user_id)
    AND (p_date IS NULL OR (ar.check_in_time AT TIME ZONE 'Asia/Bangkok')::DATE = p_date)
    ORDER BY ar.check_in_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the database default timezone (this affects new connections)
ALTER DATABASE postgres SET timezone = 'Asia/Bangkok';

-- Display current timezone settings
SELECT 
    name,
    setting,
    short_desc
FROM pg_settings 
WHERE name IN ('timezone', 'log_timezone');

-- Display current Bangkok time
SELECT 
    NOW() as utc_time,
    NOW() AT TIME ZONE 'Asia/Bangkok' as bangkok_time,
    CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok' as current_bangkok_time;
