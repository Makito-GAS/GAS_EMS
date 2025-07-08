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
import HRAgentChat from './components/Hr/HRAgentChat';

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
                      <Routes>
                        <Route path="dashboard" element={<EmployeeDashboard />} />
                        <Route path="tasks" element={<EmployeeTasks />} />
                        <Route path="schedule" element={<EmployeeSchedule />} />
                        <Route path="profile" element={<EmployeeProfile />} />
                        <Route path="settings" element={<EmployeeSettings />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="submit-documents" element={<EmployeeDocumentSubmission />} />
                        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Admin Access */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="employees" element={<EmployeeList />} />
                        <Route path="add-employee" element={<CreateMember />} />
                        <Route path="reports" element={<PerformanceAnalytics />} />
                        <Route path="daily-reports" element={<DailyReports />} />
                        <Route path="leave-requests" element={<LeaveRequests />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="AdminSettings" element={<AdminSettings />} />
                        <Route path="EventSchedule" element={<EventSchedule />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - HR/Admin Access */}
                <Route
                  path="/hr/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'hr']}>
                      <Routes>
                        <Route path="dashboard" element={<HrDashboard />} />
                        {/* Add more HR routes here as you build features */}
                        <Route path="documents" element={<Documents />} />
                        <Route path="hr-agent" element={<HRAgentChat />} />
                        <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

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
