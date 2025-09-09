# Database Timezone Configuration for Bangkok

This document explains how to configure your Supabase database to use Bangkok timezone (Asia/Bangkok) for the attendance tracking system.

## Quick Setup

1. **Run the Migration Script**
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `timezone_migration.sql`
   - Execute the script

## What the Migration Does

### 1. Sets Database Timezone
- Configures the database to use `Asia/Bangkok` timezone
- Updates all timestamp defaults to use Bangkok time
- Affects new connections and sessions

### 2. Updates Functions
- **`calculate_total_hours()`** - Now calculates hours in Bangkok timezone
- **`update_attendance_summary()`** - Uses Bangkok dates for daily summaries
- **`calculate_attendance_hours()`** - Updates timestamps in Bangkok time
- **`get_current_session()`** - Compares current Bangkok time with session times

### 3. Helper Functions
- **`get_bangkok_now()`** - Returns current Bangkok time
- **`to_bangkok_time(timestamp)`** - Converts any timestamp to Bangkok timezone

### 4. Creates Bangkok View
- **`attendance_records_bangkok`** - View showing all timestamps in Bangkok timezone
- Includes both original UTC timestamps and Bangkok converted timestamps

## Usage Examples

### Backend API Updates
```javascript
// In your Node.js backend, you can now query with Bangkok timezone awareness

// Get today's attendance in Bangkok timezone using the helper function
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const { data } = await supabase
  .rpc('get_attendance_records_bangkok', {
    p_user_id: userId,
    p_date: today
  });

// Or query directly with timezone conversion
const { data } = await supabase
  .from('attendance_records')
  .select(`
    *,
    check_in_time_bangkok:check_in_time::timestamp,
    check_out_time_bangkok:check_out_time::timestamp
  `)
  .eq('user_id', userId)
  .gte('check_in_time', `${today}T00:00:00+07:00`)
  .lt('check_in_time', `${today}T23:59:59+07:00`);

// Insert with automatic Bangkok timezone
const { data, error } = await supabase
  .from('attendance_records')
  .insert({
    user_id: userId,
    session_type_id: sessionId,
    check_in_time: new Date().toISOString(), // Will be stored and converted properly
    check_in_method: 'manual'
  });
```

### Frontend Display
```javascript
// Format timestamps for Bangkok timezone display
const formatBangkokTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
```

## Database Schema Impact

### Existing Data
- All existing `TIMESTAMP WITH TIME ZONE` data remains unchanged
- The timezone conversion happens at query time
- No data loss or corruption

### New Records
- All new timestamps will default to Bangkok timezone
- Functions automatically handle timezone conversion
- Consistent behavior across all operations

## Verification

After running the migration, you can verify the setup:

```sql
-- Check timezone settings
SELECT 
    name,
    setting,
    short_desc
FROM pg_settings 
WHERE name IN ('timezone', 'log_timezone');

-- Verify Bangkok time
SELECT 
    NOW() as utc_time,
    NOW() AT TIME ZONE 'Asia/Bangkok' as bangkok_time;

-- Test the Bangkok view
SELECT * FROM attendance_records_bangkok LIMIT 5;
```

## Important Notes

1. **UTC Storage**: The database still stores timestamps in UTC (recommended practice)
2. **Display Conversion**: Conversion to Bangkok time happens at query/display time
3. **Consistency**: All functions now consistently use Bangkok timezone
4. **Backward Compatibility**: Existing queries continue to work
5. **Performance**: Minimal impact on query performance

## Troubleshooting

If you encounter timezone issues:

1. **Check Database Connection**: Ensure your connection uses Bangkok timezone
2. **Verify Function Updates**: Confirm all functions were updated successfully  
3. **Test Queries**: Use the Bangkok view for timezone-aware queries
4. **Frontend Formatting**: Use proper timezone formatting in your frontend

## Session Times Configuration

The default session times in the database are:
- **Morning**: 08:00 - 12:00 (Bangkok time)
- **Lunch**: 13:00 - 14:00 (Bangkok time)  
- **Afternoon**: 14:00 - 18:00 (Bangkok time)
- **Evening**: 19:00 - 22:00 (Bangkok time)

These times are now properly compared against Bangkok local time.
