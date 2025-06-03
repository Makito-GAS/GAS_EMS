import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog } from 'react-icons/fa';
import supabase from '../../../supabase-client';

const CreateMember = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const { session, createMember } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRolesAndStatuses();
  }, []);

  const fetchRolesAndStatuses = async () => {
    try {
      // Fetch unique roles from permission table
      const { data: roleData, error: roleError } = await supabase
        .from('permission')
        .select('role')
        .order('role');

      if (roleError) throw roleError;
      
      // Get unique roles
      const uniqueRoles = [...new Set(roleData.map(item => item.role))];
      setRoles(uniqueRoles);

      // Fetch unique statuses from permission table
      const { data: statusData, error: statusError } = await supabase
        .from('permission')
        .select('status')
        .order('status');

      if (statusError) throw statusError;
      
      // Get unique statuses
      const uniqueStatuses = [...new Set(statusData.map(item => item.status))];
      setStatuses(uniqueStatuses);
    } catch (error) {
      console.error('Error fetching roles and statuses:', error);
      setError('Failed to load roles and statuses');
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await createMember(email, password, name, role, status, gender, department);
      if (result.success) {
        navigate('/admin/employees');
      } else {
        setError('Member creation failed.');
      }
    } catch (error) {
      setError('Error creating member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50  dark:bg-gray-900">
      <AdminSidebar>
        <AdminSidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text="Dashboard"
          path="/admin/dashboard"
        />
        <AdminSidebarItem 
          icon={<FaUsers className="w-6 h-6" />}
          text="Manage Employees"
          path="/admin/employees"
        />
        <AdminSidebarItem 
          icon={<FaUserPlus className="w-6 h-6" />}
          text="Add Employee"
          path="/admin/add-employee"
        />
        <AdminSidebarItem 
          icon={<FaChartBar className="w-6 h-6" />}
          text="Reports"
          path="/admin/reports"
        />
        <AdminSidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text="Settings"
          path="/admin/settings"
        />
      </AdminSidebar>

      <div className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Add New Employee</h1>
          <p className="text-gray-600 dark:text-white">Create a new employee account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
          <form onSubmit={handleCreateMember}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Role</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value.toLowerCase())}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((roleOption) => (
                    <option key={roleOption} value={roleOption.toLowerCase()}>
                      {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="">Select status</option>
                  {statuses.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                    </option>
                  ))} b
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Gender</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Department</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Administration">Administration</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Designer">Designer</option>
                  <option value="Developer">Developer</option>
                  <option value="Human Resource">Human Resource</option>
                  <option value="Training">Training</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 dark:bg-blue-600 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMember;
