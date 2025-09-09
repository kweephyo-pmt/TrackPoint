# AttendTrack - Professional Attendance Tracking System

A comprehensive, modern attendance tracking application built with React, TypeScript, and Supabase. Features advanced facial recognition, location-based restrictions, real-time analytics, and a complete admin management system.

## 🌐 Live Demo

**[🚀 Try TrackPoint Live](https://trackpoint-attendance.vercel.app/)**

Experience the full-featured attendance tracking system with facial recognition, real-time dashboards, and admin management capabilities.

## ✨ Key Highlights

- 🎯 **Advanced Facial Recognition** with 65% similarity threshold for secure authentication
- 📍 **GPS Location Verification** with 200m radius restrictions
- ⚡ **Real-time Dashboard** with live session tracking and statistics
- 👥 **Complete Admin System** with user management and comprehensive reporting
- 📱 **Mobile-First Design** with responsive UI across all devices
- 🔒 **Enterprise Security** with role-based access control and data protection

## 🚀 Features

### 👤 User Features
- **Secure Authentication**: Email/password login with Supabase Auth
- **Facial Recognition Check-in**: AI-powered face verification with strict security thresholds
- **Multi-Session Support**: Morning, lunch, afternoon, and evening sessions
- **Real-time Tracking**: Live elapsed time display and session status
- **Location Verification**: GPS-based check-in/out with configurable radius
- **Profile Management**: Complete profile setup with face encoding and personal details
- **Personal Dashboard**: Today's hours, weekly/monthly stats, and attendance rate
- **Session History**: Detailed view of all attendance records with timestamps

### 🛡️ Admin Features
- **Separate Admin Portal**: Dedicated admin interface with restricted access
- **User Management**: View, edit, and manage all user accounts
- **Attendance Monitoring**: Real-time attendance tracking across all users
- **Location Management**: Configure multiple company locations with custom radius
- **Session Configuration**: Manage session types and time slots
- **Comprehensive Reports**: Generate detailed attendance reports with export functionality
- **System Settings**: Configure system-wide parameters and policies

### 🔧 Technical Features
- **TypeScript**: Full type safety throughout the application
- **Mobile Responsive**: Tailwind CSS with mobile-first responsive design
- **Real-time Updates**: Live data synchronization with Supabase
- **Offline Handling**: Graceful degradation when network is unavailable
- **Error Recovery**: Comprehensive error handling with user-friendly messages
- **Performance Optimized**: Lazy loading, code splitting, and optimized bundle size

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **React Router v6** for client-side routing
- **face-api.js** for AI-powered facial recognition
- **React Webcam** for camera integration
- **React Hot Toast** for notifications
- **Lucide React** for consistent iconography
- **date-fns** for date manipulation

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** with advanced triggers and functions
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Automatic schema migrations** with version control
- **Optimized indexes** for query performance

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+** and npm/yarn
- **Supabase account** (free tier available)
- **Modern web browser** with camera and location access
- **HTTPS** (required for facial recognition in production)

### 1. Project Setup
```bash
# Clone the repository
git clone <repository-url>
cd "Attendance Tracker"

# Install dependencies
npm install
```

### 2. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Note your project URL and anon key from Settings > API

#### Database Setup
1. Navigate to SQL Editor in your Supabase dashboard
2. Run the complete schema from `database/` folder:
   - Execute `break_tracking_schema.sql` for main tables
   - Execute `timezone_migration.sql` for timezone support
   - Execute `add_admin_role.sql` for admin functionality
3. Update company locations in the `company_locations` table with your coordinates

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Facial Recognition Models

Download face-api.js models and place them in `public/models/`:
```bash
# The models are already included in the public/models directory
# Ensure these files exist:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
```

### 5. Start Development
```bash
npm start
```

The application will start on `http://localhost:3000`

### 6. Create Admin User
1. Register a regular user account
2. In Supabase dashboard, go to Table Editor > profiles
3. Find your user and change the `role` field from `user` to `admin`
4. Admin can now access `/admin` portal

## 📱 Usage Guide

### For Regular Users

#### Initial Setup
1. **Register Account**: Create account with email and employee details
2. **Complete Profile**: Add personal information and upload avatar
3. **Setup Facial Recognition**: 
   - Go to Profile → Account Settings
   - Click "Setup Facial Recognition"
   - Follow 3-step face capture process (front, right, left)
   - System requires 65% similarity for future logins
4. **Enable Location**: Allow browser location access for check-in/out

#### Daily Attendance
1. **Navigate to Attendance**: Use dashboard quick action or menu
2. **Select Session**: Choose from Morning, Lunch, Afternoon, or Evening
3. **Location Check**: Ensure you're within 200m of company location
4. **Facial Recognition**: Click "Start Facial Recognition" for secure check-in
5. **Monitor Session**: View real-time elapsed time on dashboard
6. **Check Out**: Return to attendance page to end your session

#### Dashboard Features
- **Real-time Stats**: Today's hours, weekly/monthly totals
- **Active Session**: Live timer for current work session
- **Quick Actions**: Fast access to attendance and location check
- **Session Overview**: Visual status of all daily sessions
- **Recent Activity**: History of recent check-ins/outs

### For Administrators

#### Admin Access
1. **Admin Login**: Access via `/admin` route
2. **Separate Portal**: Completely isolated from user interface
3. **Role-based Access**: Only users with `admin` role can access

#### User Management
- **View All Users**: Complete user directory with profiles
- **Edit User Details**: Modify user information and roles
- **Attendance Overview**: Real-time attendance status for all users
- **User Analytics**: Individual user attendance patterns

#### System Configuration
- **Location Management**: Add/edit company locations with custom radius
- **Session Types**: Configure work sessions and time slots
- **System Settings**: Manage global application parameters

#### Reporting & Analytics
- **Comprehensive Reports**: Generate detailed attendance reports
- **Export Functionality**: Download reports in various formats
- **Real-time Monitoring**: Live attendance tracking dashboard
- **Trend Analysis**: Identify attendance patterns and insights

## 🏗 Project Structure

```
Attendance Tracker/
├── src/                    # React application source
│   ├── components/         # Reusable React components
│   │   ├── Attendance/     # Attendance-related components
│   │   ├── Layout/         # Layout and navigation
│   │   ├── Profile/        # Profile management
│   │   └── UI/            # Shared UI components
│   ├── contexts/          # React context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── AdminContext.tsx # Admin functionality
│   ├── pages/             # Application pages
│   │   ├── Admin/         # Admin dashboard pages
│   │   ├── Attendance/    # Attendance tracking
│   │   ├── Auth/          # Login/Register
│   │   ├── Dashboard/     # User dashboard
│   │   ├── Profile/       # Profile management
│   │   └── Reports/       # Reporting interface
│   ├── lib/              # Utility libraries
│   │   └── supabase.ts   # Supabase client & API functions
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main application component
├── public/               # Static assets
│   ├── models/           # Face recognition models
│   └── index.html        # HTML template
├── database/             # Database schema and migrations
│   └── schema.sql        # Complete database schema
├── package.json          # Project dependencies
├── .env                  # Environment variables
└── README.md            # Project documentation
```

## ⚙️ Configuration

### Session Types Configuration
Default sessions created automatically:
```sql
-- Morning Session
INSERT INTO session_types (name, start_time, end_time, description)
VALUES ('Morning', '08:00', '12:00', 'Morning work session');

-- Lunch Session  
INSERT INTO session_types (name, start_time, end_time, description)
VALUES ('Lunch', '13:00', '14:00', 'Lunch break session');

-- Afternoon Session
INSERT INTO session_types (name, start_time, end_time, description)
VALUES ('Afternoon', '14:00', '18:00', 'Afternoon work session');

-- Evening Session
INSERT INTO session_types (name, start_time, end_time, description)
VALUES ('Evening', '19:00', '22:00', 'Evening work session');
```

### Location Configuration
```sql
-- Add company location
INSERT INTO company_locations (name, latitude, longitude, radius_meters, address)
VALUES (
  'Main Office',
  40.7128,  -- Replace with your latitude
  -74.0060, -- Replace with your longitude
  200,      -- 200 meter radius
  '123 Business St, City, State'
);
```

### Facial Recognition Settings
- **Security Threshold**: 65% similarity required (0.35 Euclidean distance)
- **Detection Confidence**: Minimum 70% face detection confidence
- **Model Requirements**: 
  - Tiny Face Detector for fast detection
  - Face Landmark 68 for precise feature mapping
  - Face Recognition Net for encoding generation
- **Browser Requirements**: HTTPS required for camera access in production
- **Storage**: Face encodings stored as encrypted JSON in database

### Environment Variables
```env
# Required
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional (with defaults)
REACT_APP_LOCATION_RADIUS=200
REACT_APP_FACE_SIMILARITY_THRESHOLD=0.35
REACT_APP_DETECTION_CONFIDENCE=0.7
```

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

### Deployment Platforms

#### Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=build
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

#### Manual Deployment
1. Run `npm run build`
2. Upload `build/` folder contents to your web server
3. Configure web server for SPA routing (redirect all routes to index.html)

### Environment Variables Setup
Set these in your hosting platform:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Production Checklist
- ✅ HTTPS enabled (required for camera access)
- ✅ Environment variables configured
- ✅ Supabase RLS policies enabled
- ✅ Face recognition models uploaded to `/models/`
- ✅ Company locations configured
- ✅ Admin user created
- ✅ Session types configured
- ✅ Error monitoring setup (optional)

### Supabase Production Setup
1. **Enable RLS**: Ensure Row Level Security is enabled on all tables
2. **Backup Strategy**: Configure automated backups
3. **Monitoring**: Set up database monitoring and alerts
4. **Performance**: Review and optimize database indexes
5. **Security**: Audit RLS policies and API permissions

## 🔒 Security & Privacy

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication via Supabase Auth
- **Role-based Access**: Separate user and admin roles with strict separation
- **Session Management**: Automatic token refresh and secure logout
- **Password Security**: Supabase handles password hashing and validation

### Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **HTTPS Encryption**: All data transmission encrypted in transit
- **Face Data Security**: Facial encodings stored as encrypted JSON
- **Input Validation**: Comprehensive client and server-side validation
- **SQL Injection Prevention**: Parameterized queries via Supabase SDK

### Privacy Measures
- **Minimal Data Collection**: Only necessary attendance data collected
- **Face Encoding**: No actual face images stored, only mathematical encodings
- **Location Privacy**: GPS coordinates used only for radius verification
- **Data Retention**: Configurable data retention policies
- **User Control**: Users can delete their face encoding anytime

### Security Policies
```sql
-- Example RLS Policy for attendance_records
CREATE POLICY "Users can only see own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

-- Admin access policy
CREATE POLICY "Admins can see all attendance" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Compliance Features
- **GDPR Ready**: Data export and deletion capabilities
- **Audit Trail**: Complete attendance history with timestamps
- **Access Logging**: User activity tracking for security monitoring
- **Data Minimization**: Only essential data fields collected

## 📊 Database Schema

### Key Tables
- **profiles**: Extended user information
- **attendance_records**: Individual check-in/out records
- **attendance_summary**: Daily attendance summaries
- **session_types**: Configurable work sessions
- **company_locations**: Allowed check-in locations

### Triggers & Functions
- Automatic profile creation on user signup
- Real-time attendance summary updates
- Total hours calculation
- Overtime tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting & Support

### Common Issues

#### Facial Recognition Not Working
- **Camera Permission**: Ensure browser has camera access
- **HTTPS Required**: Facial recognition requires HTTPS in production
- **Model Files**: Verify face-api.js models are in `public/models/`
- **Browser Support**: Use modern browsers (Chrome, Firefox, Safari, Edge)

#### Location Issues
- **GPS Permission**: Allow location access in browser
- **Accuracy**: GPS may take time to get accurate location
- **Indoor Issues**: GPS less accurate indoors, try near windows
- **Radius Configuration**: Verify company location coordinates and radius

#### Login/Authentication Problems
- **Email Verification**: Check email for verification link (new accounts)
- **Admin Access**: Ensure user role is set to 'admin' in database
- **Environment Variables**: Verify Supabase URL and keys are correct
- **Network Issues**: Check internet connection and Supabase status

#### Performance Issues
- **Model Loading**: Face recognition models may take time to load initially
- **Database Queries**: Check Supabase dashboard for slow queries
- **Browser Cache**: Clear browser cache and reload application

### Debug Mode
Enable debug logging by adding to `.env`:
```env
REACT_APP_DEBUG=true
```

### Getting Help
1. **Check Browser Console**: Look for error messages and warnings
2. **Supabase Dashboard**: Monitor database queries and errors
3. **Network Tab**: Check for failed API requests
4. **Documentation**: Review this README and code comments
5. **Database Schema**: Verify table structure matches requirements

### Reporting Issues
When reporting issues, include:
- Browser and version
- Error messages from console
- Steps to reproduce
- Screenshots if applicable
- Environment (development/production)

## 🔮 Future Enhancements

### Planned Features
- **Mobile Application**: React Native iOS/Android app with native biometrics
- **Advanced Analytics**: AI-powered insights and attendance pattern analysis
- **Team Collaboration**: Department management, team leads, and group reporting
- **API Integration**: REST API for third-party HR systems and payroll integration
- **Offline Capabilities**: Progressive Web App with offline attendance tracking
- **Enhanced Biometrics**: Fingerprint, Face ID, and voice recognition support
- **Geofencing**: Advanced location tracking with multiple zones and smart detection
- **Shift Management**: Complex shift patterns, overtime tracking, and break management
- **Notifications**: Push notifications for check-in reminders and schedule updates
- **Multi-language**: Internationalization support for global deployment

### Technical Improvements
- **Performance**: Database query optimization and caching strategies
- **Scalability**: Microservices architecture for enterprise deployment
- **Testing**: Comprehensive test suite with unit, integration, and E2E tests
- **Monitoring**: Application performance monitoring and error tracking
- **CI/CD**: Automated deployment pipelines and environment management

---

**AttendTrack** - Built with ❤️ using React, TypeScript, and Supabase

*Professional attendance tracking for the modern workplace*

---

Built with React, Node.js, and Supabase
