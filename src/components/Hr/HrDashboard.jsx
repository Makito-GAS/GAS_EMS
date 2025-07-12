import React from 'react';
import { FaFileAlt, FaChartBar, FaUserCheck, FaClipboardList, FaBriefcase, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HrDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    // Use React Router navigation to ensure app state resets
    navigate('/');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">HR Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaFileAlt className="text-4xl text-blue-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Documents</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">Manage employee documents, upload, review, and approve submissions.</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => navigate('/hr/documents')}>Go to Documents</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaChartBar className="text-4xl text-green-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">View HR analytics, employee performance, and compliance reports.</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">View Analytics</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaUserCheck className="text-4xl text-yellow-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Attendance</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">Track employee attendance, leaves, and absences.</p>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Check Attendance</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaClipboardList className="text-4xl text-purple-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">Assign and manage HR tasks, monitor progress, and deadlines.</p>
          <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Manage Tasks</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaBriefcase className="text-4xl text-pink-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Job Openings</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">Post new job openings, review applications, and schedule interviews.</p>
          <button className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600">View Openings</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <FaUserPlus className="text-4xl text-indigo-500 mb-2" />
          <h2 className="text-xl font-semibold mb-2">Employee Onboarding</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">Automate onboarding: checklists, document collection, and welcome tasks for new hires.</p>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">Start Onboarding</button>
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
