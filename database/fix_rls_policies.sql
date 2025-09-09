-- Fix RLS policies to prevent infinite recursion
-- Run this BEFORE add_admin_role.sql

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can insert all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can update all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can delete all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can view all attendance summaries" ON public.attendance_summary;
DROP POLICY IF EXISTS "Admins can insert all attendance summaries" ON public.attendance_summary;
DROP POLICY IF EXISTS "Admins can update all attendance summaries" ON public.attendance_summary;
DROP POLICY IF EXISTS "Admins can delete all attendance summaries" ON public.attendance_summary;
DROP POLICY IF EXISTS "Admins can manage session types" ON public.session_types;
DROP POLICY IF EXISTS "Admins can manage company locations" ON public.company_locations;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Now you can run add_admin_role.sql safely
