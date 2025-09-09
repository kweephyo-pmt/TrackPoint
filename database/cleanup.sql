-- Database Cleanup Script
-- Run this in your Supabase SQL editor to delete all tables and data

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS attendance_summary_trigger ON public.attendance_records;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_attendance_summary();
DROP FUNCTION IF EXISTS calculate_total_hours(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Drop policies (RLS)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view their own attendance summary" ON public.attendance_summary;
DROP POLICY IF EXISTS "Authenticated users can view session types" ON public.session_types;
DROP POLICY IF EXISTS "Authenticated users can view company locations" ON public.company_locations;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_attendance_records_user_id;
DROP INDEX IF EXISTS public.idx_attendance_records_check_in_time;
DROP INDEX IF EXISTS public.idx_attendance_summary_user_date;
DROP INDEX IF EXISTS public.idx_profiles_employee_id;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.attendance_summary CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.company_locations CASCADE;
DROP TABLE IF EXISTS public.session_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Note: auth.users table is managed by Supabase and should not be dropped
-- If you want to delete user accounts, do it through the Supabase dashboard

SELECT 'Database cleanup completed successfully!' as status;
