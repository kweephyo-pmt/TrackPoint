-- Add role column to profiles table for admin authentication
-- Run this in your Supabase SQL editor after the main schema

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role column
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create a function to check if current user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for full access to all tables
-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

-- Admin users can update all profiles  
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- Admin users can insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_admin());

-- Admin users can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- Admin users can view all attendance records
CREATE POLICY "Admins can view all attendance records" ON public.attendance_records
    FOR SELECT USING (public.is_admin());

-- Admin users can manage all attendance records
CREATE POLICY "Admins can insert all attendance records" ON public.attendance_records
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all attendance records" ON public.attendance_records
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all attendance records" ON public.attendance_records
    FOR DELETE USING (public.is_admin());

-- Admin users can view all attendance summaries
CREATE POLICY "Admins can view all attendance summaries" ON public.attendance_summary
    FOR SELECT USING (public.is_admin());

-- Admin users can manage all attendance summaries
CREATE POLICY "Admins can insert all attendance summaries" ON public.attendance_summary
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all attendance summaries" ON public.attendance_summary
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all attendance summaries" ON public.attendance_summary
    FOR DELETE USING (public.is_admin());

-- Admin users can manage session types
CREATE POLICY "Admins can manage session types" ON public.session_types
    FOR ALL USING (public.is_admin());

-- Admin users can manage company locations
CREATE POLICY "Admins can manage company locations" ON public.company_locations
    FOR ALL USING (public.is_admin());

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, employee_id, department, position, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'employee_id',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'position',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Create an admin user (replace with actual admin email)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourcompany.com';
