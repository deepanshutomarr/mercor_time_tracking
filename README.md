# Mercor Time Tracking Application

A comprehensive time tracking solution built for the Mercor assessment. This application provides a complete time tracking system with employee management, project tracking, automatic screenshot capture, and detailed analytics.

## 🚀 Features

### Backend API
- **Employee Management**: Create, update, and manage employees
- **Project Management**: Full CRUD operations for projects and tasks
- **Time Tracking**: Start/stop time tracking with automatic duration calculation
- **Screenshot Capture**: Automatic screenshot capture during work sessions
- **Analytics**: Detailed time tracking analytics and reporting
- **Authentication**: JWT-based authentication system
- **Email Notifications**: Automated email notifications for various events

### Web Frontend
- **Employee Onboarding**: Account activation and setup
- **Dashboard**: Time tracking dashboard with project/task management
- **Download Center**: Desktop application download page
- **Responsive Design**: Modern, mobile-friendly interface

### Desktop Application
- **Cross-Platform**: Windows, macOS, and Linux support
- **Automatic Screenshots**: Configurable screenshot capture intervals
- **Offline Support**: Continue tracking when offline, sync when online
- **System Integration**: Deep system integration with activity monitoring
- **Privacy Controls**: Granular privacy controls and settings

## 🏗️ Architecture

```
mercor-time-tracking/
├── src/                    # Backend API (Node.js + TypeScript)
│   ├── controllers/        # API controllers
│   ├── models/            # Database models (MongoDB)
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   └── validations/       # Request validation schemas
├── web/                   # Web frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── pages/         # Page components
├── desktop/               # Desktop app (Electron + React)
│   ├── src/               # Main process (Node.js)
│   └── renderer/          # Renderer process (React)
└── docs/                  # Documentation
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **Sharp** for image processing
- **Winston** for logging

### Web Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for forms
- **Axios** for API calls

### Desktop Application
- **Electron** for cross-platform desktop app
- **React** for UI
- **TypeScript** for type safety
- **Screenshot-desktop** for screenshot capture
- **Systeminformation** for device info
- **Electron-store** for local storage

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mercor-time-tracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the backend**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Web Frontend Setup

1. **Navigate to web directory**
   ```bash
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The web app will be available at `http://localhost:3001`

### Desktop Application Setup

1. **Navigate to desktop directory**
   ```bash
   cd desktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mercor-time-tracking

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@mercor.com

# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
WEB_APP_URL=http://localhost:3001
DESKTOP_APP_URL=http://localhost:3002

# Screenshot Configuration
SCREENSHOT_INTERVAL=300000
SCREENSHOT_QUALITY=80
SCREENSHOT_MAX_SIZE=1920x1080
```

## 📚 API Documentation

### Authentication
- `POST /api/v1/employee/login` - Employee login
- `POST /api/v1/employee/activate-account` - Activate employee account

### Employee Management
- `POST /api/v1/employee` - Create employee
- `GET /api/v1/employee` - List employees
- `GET /api/v1/employee/:id` - Get employee
- `PUT /api/v1/employee/:id` - Update employee
- `POST /api/v1/employee/deactivate/:id` - Deactivate employee

### Project Management
- `POST /api/v1/project` - Create project
- `GET /api/v1/project` - List projects
- `GET /api/v1/project/:id` - Get project
- `PUT /api/v1/project/:id` - Update project
- `DELETE /api/v1/project/:id` - Delete project

### Task Management
- `POST /api/v1/task` - Create task
- `GET /api/v1/task` - List tasks
- `GET /api/v1/task/:id` - Get task
- `PUT /api/v1/task/:id` - Update task
- `DELETE /api/v1/task/:id` - Delete task

### Time Tracking
- `POST /api/v1/time-tracking/start` - Start time tracking
- `POST /api/v1/time-tracking/stop` - Stop time tracking
- `GET /api/v1/time-tracking/active` - Get active time entries
- `GET /api/v1/analytics/window` - Get time tracking analytics

### Screenshots
- `GET /api/v1/analytics/screenshot` - Get screenshots
- `GET /api/v1/analytics/screenshot/:id/file` - Get screenshot file
- `DELETE /api/v1/analytics/screenshot/:id` - Delete screenshot

## 🚀 Deployment

### Backend Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Web Frontend Deployment

1. **Build the application**
   ```bash
   cd web
   npm run build
   ```

2. **Deploy the `dist` folder to your web server**

### Desktop Application Distribution

1. **Build for all platforms**
   ```bash
   cd desktop
   npm run dist
   ```

2. **Build for specific platform**
   ```bash
   # Windows
   npm run dist:win
   
   # macOS
   npm run dist:mac
   
   # Linux
   npm run dist:linux
   ```

## 🧪 Testing

Run the test suite:

```bash
# Backend tests
npm test

# Web frontend tests
cd web && npm test

# Desktop app tests
cd desktop && npm test
```

## 📝 Usage

### For Administrators

1. **Create Teams and Shared Settings**
   - Set up teams for your organization
   - Configure shared settings for time tracking and screenshots

2. **Add Employees**
   - Create employee accounts
   - Assign them to teams and projects
   - Send invitation emails

3. **Manage Projects and Tasks**
   - Create projects for different clients or work areas
   - Add tasks to projects
   - Assign employees to projects and tasks

4. **Monitor Time Tracking**
   - View time tracking analytics
   - Review screenshots and activity
   - Generate reports

### For Employees

1. **Activate Account**
   - Click the activation link in your email
   - Set up your account

2. **Download Desktop App**
   - Download the desktop application for your operating system
   - Install and sign in

3. **Start Time Tracking**
   - Select a project and task
   - Click start to begin tracking
   - The app will automatically capture screenshots

4. **View Dashboard**
   - Access the web dashboard to view your time entries
   - See project assignments and recent activity

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for web security
- **Helmet Security**: Security headers with Helmet.js
- **Device Fingerprinting**: Track and validate device information
- **Screenshot Privacy**: Configurable screenshot privacy controls
