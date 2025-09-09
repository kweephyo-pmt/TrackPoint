-- Sample attendance records for testing
-- Updated with current date (September 10, 2025) for UI display

-- Insert sample attendance records for today
INSERT INTO attendance_records (
    user_id,
    session_type_id,
    check_in_time,
    check_out_time,
    check_in_location,
    check_out_location,
    check_in_method,
    check_out_method,
    status,
    total_hours,
    created_at,
    updated_at
) VALUES
-- Morning session (completed)
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '89b1aba9-3619-4612-b609-cbd1fab7e790', -- Morning session ID
    '2025-09-10T08:30:00.000Z',
    '2025-09-10T12:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}', -- Current location coordinates
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'present',
    3.5,
    '2025-09-10T08:30:00.000Z',
    '2025-09-10T12:00:00.000Z'
),
-- Lunch session (completed)
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '255b5c78-5361-4f10-8fd8-5ea6f283e9b7', -- Lunch session ID
    '2025-09-10T13:00:00.000Z',
    '2025-09-10T14:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'present',
    1.0,
    '2025-09-10T13:00:00.000Z',
    '2025-09-10T14:00:00.000Z'
),
-- Afternoon session (currently active - no check_out_time)
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    'd732ba52-ad1f-4c81-9f4c-7d2fb13fd809', -- Afternoon session ID
    '2025-09-10T14:30:00.000Z',
    NULL, -- Currently active session
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    NULL,
    'facial',
    NULL,
    'present',
    NULL, -- Will be calculated on check-out
    '2025-09-10T14:30:00.000Z',
    '2025-09-10T14:30:00.000Z'
);

-- Sample data for yesterday (completed sessions)
INSERT INTO attendance_records (
    user_id,
    session_type_id,
    check_in_time,
    check_out_time,
    check_in_location,
    check_out_location,
    check_in_method,
    check_out_method,
    status,
    total_hours,
    created_at,
    updated_at
) VALUES
-- Yesterday morning session
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '89b1aba9-3619-4612-b609-cbd1fab7e790', -- Morning session ID
    '2025-09-09T08:45:00.000Z',
    '2025-09-09T12:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'late', -- Late check-in
    3.25,
    '2025-09-09T08:45:00.000Z',
    '2025-09-09T12:00:00.000Z'
),
-- Yesterday afternoon session
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    'd732ba52-ad1f-4c81-9f4c-7d2fb13fd809', -- Afternoon session ID
    '2025-09-09T14:00:00.000Z',
    '2025-09-09T18:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'present',
    4.0,
    '2025-09-09T14:00:00.000Z',
    '2025-09-09T18:00:00.000Z'
);

-- Sample data for this week (various statuses)
INSERT INTO attendance_records (
    user_id,
    session_type_id,
    check_in_time,
    check_out_time,
    check_in_location,
    check_out_location,
    check_in_method,
    check_out_method,
    status,
    total_hours,
    created_at,
    updated_at
) VALUES
-- Monday morning (on time)
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '89b1aba9-3619-4612-b609-cbd1fab7e790', -- Morning session ID
    '2025-09-06T08:00:00.000Z',
    '2025-09-06T12:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'present',
    4.0,
    '2025-09-06T08:00:00.000Z',
    '2025-09-06T12:00:00.000Z'
),
-- Tuesday evening session
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '964e7f7e-f705-479e-b83e-ecafa172aac3', -- Evening session ID
    '2025-09-07T18:00:00.000Z',
    '2025-09-07T22:00:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'present',
    4.0,
    '2025-09-07T18:00:00.000Z',
    '2025-09-07T22:00:00.000Z'
),
-- Wednesday late morning
(
    '2d39b566-0478-4471-97a0-be6dd22576e7', -- User ID
    '89b1aba9-3619-4612-b609-cbd1fab7e790', -- Morning session ID
    '2025-09-08T09:30:00.000Z',
    '2025-09-08T12:30:00.000Z',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    '{"latitude": 20.051983771019874, "longitude": 99.88036025680408}',
    'facial',
    'facial',
    'late',
    3.0,
    '2025-09-08T09:30:00.000Z',
    '2025-09-08T12:30:00.000Z'
);

-- Instructions for use:
-- Ready to use with your actual IDs!
-- 1. User ID: 2d39b566-0478-4471-97a0-be6dd22576e7
-- 2. Morning Session: 89b1aba9-3619-4612-b609-cbd1fab7e790
-- 3. Lunch Session: 255b5c78-5361-4f10-8fd8-5ea6f283e9b7
-- 4. Afternoon Session: d732ba52-ad1f-4c81-9f4c-7d2fb13fd809
-- 5. Evening Session: 964e7f7e-f705-479e-b83e-ecafa172aac3

-- Adjust timestamps to match your current date/time for testing if needed
-- Update coordinates to match your company location if needed
