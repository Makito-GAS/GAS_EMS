import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';

// Components
import AuthForm from './components/Auth/Authform';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import EmployeeTasks from './components/Employee/EmployeeTasks';
import EmployeeSchedule from './components/Employee/EmployeeSchedule';
import EmployeeProfile from './components/Employee/EmployeeProfile';
import EmployeeSettings from './components/Employee/EmployeeSettings';
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateMember from './components/Admin/CreateMember';
import EmployeeList from './components/Admin/EmployeeList';
import LeaveRequests from './components/Admin/LeaveRequests';
import DailyReports from './components/Admin/DailyReports';
import PerformanceAnalytics from './components/Admin/PerformanceAnalytics';
import Chat from './components/Chat/Chat';
import AdminSettings from './components/Admin/AdminSettings';
import EventSchedule from './components/Admin/EventSchedule';
import HrDashboard from './components/Hr/HrDashboard';
import Documents from './components/Hr/Documents';
import EmployeeDocumentSubmission from './components/Employee/EmployeeDocumentSubmission';
import Projects from './components/Admin/Projects';
import AdminLayout from './components/Admin/AdminLayout';
import EmployeeLayout from './components/Sidebar/EmployeeLayout';
import EmployeeProjects from './components/Employee/EmployeeProjects';
import Onboard from './components/Hr/Onboard';
import OnboardingChecklist from './components/Onboarding/OnboardingChecklist';
import DocumentUploader from './components/Onboarding/DocumentUploader';
import WelcomeTasks from './components/Onboarding/WelcomeTasks';
import HrLayout from './components/Hr/HrLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <LanguageProvider>
            <Toaster position="top-right" />
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<AuthForm />} />

                {/* Protected Routes - Employee Access */}
                <Route
                  path="/employee/*"
                  element={
                    <ProtectedRoute allowedRoles={['employee']}>
                      <EmployeeLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="tasks" element={<EmployeeTasks />} />
                  <Route path="schedule" element={<EmployeeSchedule />} />
                  <Route path="profile" element={<EmployeeProfile />} />
                  <Route path="settings" element={<EmployeeSettings />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="eprojects" element={<EmployeeProjects />} />
                  <Route path="submit-documents" element={<EmployeeDocumentSubmission />} />
                  <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                </Route>

                {/* Protected Routes - Admin Access */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="employees" element={<EmployeeList />} />
                  <Route path="add-employee" element={<CreateMember />} />
                  <Route path="reports" element={<PerformanceAnalytics />} />
                  <Route path="daily-reports" element={<DailyReports />} />
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="AdminSettings" element={<AdminSettings />} />
                  <Route path="EventSchedule" element={<EventSchedule />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                {/* Protected Routes - HR/Admin Access */}
                <Route
                  path="/hr/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'hr']}>
                      <HrLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<HrDashboard />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="onboard" element={<Onboard />} />
                  <Route path="onboarding-checklist" element={<OnboardingChecklist />} />
                  <Route path="document-uploader" element={<DocumentUploader />} />
                  <Route path="welcome-tasks" element={<WelcomeTasks />} />
                  <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
                </Route>

                {/* Protected Routes - Common Access (for authenticated users) */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route - redirect to login */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </LanguageProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
