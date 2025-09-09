
-- =====================================================
-- BREAK RECORDS TABLE
-- =====================================================
CREATE TABLE break_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    break_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (break_type IN ('short', 'lunch', 'general', 'custom')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    is_paid BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_break_records_attendance_id ON break_records(attendance_record_id);
CREATE INDEX idx_break_records_user_id ON break_records(user_id);
CREATE INDEX idx_break_records_start_time ON break_records(start_time);
CREATE INDEX idx_break_records_user_date ON break_records(user_id, start_time);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE break_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own break records" ON break_records
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update break record on insert/update
CREATE OR REPLACE FUNCTION update_break_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Calculate duration if end_time is set
    IF NEW.end_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    ELSE
        NEW.duration_minutes = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for break records
CREATE TRIGGER trigger_update_break_records
    BEFORE INSERT OR UPDATE ON break_records
    FOR EACH ROW
    EXECUTE FUNCTION update_break_records();

-- =====================================================
-- ATTENDANCE RECORDS ENHANCEMENT
-- =====================================================

-- Add break tracking columns to attendance_records
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS total_break_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_work_hours DECIMAL(5,2);

-- Function to update attendance totals when breaks change
CREATE OR REPLACE FUNCTION update_attendance_break_totals()
RETURNS TRIGGER AS $$
DECLARE
    attendance_id UUID;
    total_break_mins INTEGER;
BEGIN
    -- Get attendance record ID
    IF TG_OP = 'DELETE' THEN
        attendance_id = OLD.attendance_record_id;
    ELSE
        attendance_id = NEW.attendance_record_id;
    END IF;
    
    -- Calculate total break minutes for this attendance record
    SELECT COALESCE(SUM(duration_minutes), 0)
    INTO total_break_mins
    FROM break_records
    WHERE attendance_record_id = attendance_id
    AND end_time IS NOT NULL;
    
    -- Update attendance record
    UPDATE attendance_records 
    SET 
        total_break_minutes = total_break_mins,
        net_work_hours = CASE 
            WHEN total_hours IS NOT NULL THEN 
                GREATEST(0, total_hours - (total_break_mins / 60.0))
            ELSE total_hours
        END
    WHERE id = attendance_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attendance totals
CREATE TRIGGER trigger_update_attendance_break_totals
    AFTER INSERT OR UPDATE OR DELETE ON break_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_break_totals();

-- =====================================================
-- ANALYTICS VIEW
-- =====================================================

CREATE VIEW break_analytics 
WITH (security_invoker = true) AS
SELECT 
    br.user_id,
    br.break_type,
    br.start_time::date as break_date,
    COUNT(*) as break_count,
    SUM(br.duration_minutes) as total_break_minutes,
    ROUND(AVG(br.duration_minutes), 2) as avg_break_minutes,
    ar.session_type_id,
    st.name as session_name
FROM break_records br
JOIN attendance_records ar ON br.attendance_record_id = ar.id
JOIN session_types st ON ar.session_type_id = st.id
WHERE br.end_time IS NOT NULL
  AND br.user_id = auth.uid()
GROUP BY br.user_id, br.break_type, br.start_time::date, ar.session_type_id, st.name
ORDER BY break_date DESC, break_type;

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT ALL ON break_records TO authenticated;
GRANT SELECT ON break_analytics TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS FOR API
-- =====================================================

-- Function to get active break for attendance record
CREATE OR REPLACE FUNCTION get_active_break(p_attendance_record_id UUID)
RETURNS TABLE (
    id UUID,
    break_type VARCHAR(20),
    start_time TIMESTAMPTZ,
    duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id,
        br.break_type,
        br.start_time,
        br.duration_minutes
    FROM break_records br
    WHERE br.attendance_record_id = p_attendance_record_id
    AND br.end_time IS NULL
    AND br.user_id = auth.uid()
    ORDER BY br.start_time DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Function to get break summary for date range
CREATE OR REPLACE FUNCTION get_break_summary(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    break_date DATE,
    total_breaks INTEGER,
    total_minutes INTEGER,
    avg_break_length DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.start_time::date,
        COUNT(*)::INTEGER,
        SUM(br.duration_minutes)::INTEGER,
        ROUND(AVG(br.duration_minutes), 2)
    FROM break_records br
    WHERE br.user_id = auth.uid()
    AND br.start_time::date BETWEEN p_start_date AND p_end_date
    AND br.end_time IS NOT NULL
    GROUP BY br.start_time::date
    ORDER BY br.start_time::date DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION get_active_break(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_break_summary(DATE, DATE) TO authenticated;
