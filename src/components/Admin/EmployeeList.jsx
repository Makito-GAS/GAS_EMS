import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import supabase from '../../../supabase-client';

const EmployeeList = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    gender: '',
    department: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, roleFilter, statusFilter, departmentFilter]);

  const filterMembers = () => {
    let filtered = [...members];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.department?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(member => member.department === departmentFilter);
    }

    setFilteredMembers(filtered);
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('member')
        .select(`
          *,
          permission:permission (
            role,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten the permission object
      const transformedData = data.map(member => ({
        ...member,
        role: member.permission?.[0]?.role || 'employee',
        status: member.permission?.[0]?.status || 'active'
      }));
      
      setMembers(transformedData);
      setFilteredMembers(transformedData);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        // First delete from permission table
        const { error: permissionError } = await supabase
          .from('permission')
          .delete()
          .eq('member_id', memberId);

        if (permissionError) throw permissionError;

        // Then delete from member table
        const { error: memberError } = await supabase
          .from('member')
          .delete()
          .eq('id', memberId);

        if (memberError) throw memberError;
        
        await fetchMembers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting member:', error);
        setError(error.message);
      }
    }
  };

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || '',
      status: member.status || '',
      gender: member.gender || '',
      department: member.department || ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update member table
      const { error: memberError } = await supabase
        .from('member')
        .update({
          name: editFormData.name,
          email: editFormData.email,
          gender: editFormData.gender,
          department: editFormData.department
        })
        .eq('id', selectedMember.id);

      if (memberError) throw memberError;

      // Update permission table
      const { error: permissionError } = await supabase
        .from('permission')
        .update({
          role: editFormData.role,
          status: editFormData.status
        })
        .eq('member_id', selectedMember.id);

      if (permissionError) throw permissionError;

      await fetchMembers(); // Refresh the list
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating member:', error);
      setError(error.message);
    }
  };

  // Get unique roles, statuses, and departments for filter dropdowns
  const uniqueRoles = [...new Set(members.map(member => member.role))];
  const uniqueStatuses = [...new Set(members.map(member => member.status))];
  const uniqueDepartments = [...new Set(members.map(member => member.department).filter(Boolean))];

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Employee Management</h1>
          <p className="text-gray-600 dark:text-white">View and manage all employees in the system</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(department => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setStatusFilter('');
              setDepartmentFilter('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-white font-medium">
                                {member.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{member.department || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {member.role || 'employee'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(member)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FaEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Edit Employee Details</h2>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Role</label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a role</option>
                      {uniqueRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Status</label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select status</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Gender</label>
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={editFormData.department}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;