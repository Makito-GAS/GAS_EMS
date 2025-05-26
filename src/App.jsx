import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import EmployeeTasks from './components/Employee/EmployeeTasks';
import EmployeeSchedule from './components/Employee/EmployeeSchedule';
import EmployeeProfile from './components/Employee/EmployeeProfile';
import EmployeeSettings from './components/Employee/EmployeeSettings';
import AdminDashboard from './components/Admin/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AuthForm from './components/Auth/Authform';
import CreateMember from './components/Admin/CreateMember';
import EmployeeList from './components/Admin/EmployeeList';
import LeaveRequests from './components/Admin/LeaveRequests';
import Chat from './components/Chat/Chat';
import DailyReports from './components/Admin/DailyReports';
import PerformanceAnalytics from './components/Admin/PerformanceAnalytics';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<AuthForm />} />
              
              {/* Employee Routes */}
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/tasks" element={<EmployeeTasks />} />
              <Route path="/employee/schedule" element={<EmployeeSchedule />} />
              <Route path="/employee/profile" element={<EmployeeProfile />} />
              <Route path="/employee/settings" element={<EmployeeSettings />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<EmployeeList/>} /> {/* Temporary, should be replaced with actual component */}
              <Route path="/admin/add-employee" element={<CreateMember />} />
              <Route path="/admin/reports" element={<PerformanceAnalytics />} />
              <Route path="/admin/settings" element={<AdminDashboard />} /> {/* Temporary, should be replaced with actual component */}
              <Route path="/admin/createMember" element={<CreateMember />} />
              <Route path="/admin/leave-requests" element={<LeaveRequests />} />
              <Route path="/admin/daily-reports" element={<DailyReports />} />
              
              {/* Chat Route */}
              <Route path="/chat" element={<Chat />} />
              
              {/* Default Route */}
              <Route path="/employee" element={<EmployeeDashboard />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
