import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog, FaEye, FaFilter, FaSearch } from 'react-icons/fa';
import supabase from '../../../supabase-client';

const DailyReports = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('daily'); // 'daily' or 'weekly'
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const table = reportType === 'daily' ? 'daily_reports' : 'weekly_reports';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data);
    } catch (error) {
      console.error(`Error fetching ${reportType} reports:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || report.department === departmentFilter;
    const matchesStatus = !statusFilter || report.task_status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {reportType === 'daily' ? 'Daily Reports' : 'Weekly Reports'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View all employee {reportType} reports
          </p>
        </div>

        {/* Report Type Toggle */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daily Reports
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Weekly Reports
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Departments</option>
            <option value="Administration">Administration</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Designer">Designer</option>
            <option value="Developer">Developer</option>
            <option value="Human Resource">Human Resource</option>
            <option value="Training">Training</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
          </select>
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
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{report.full_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{report.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{report.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.task_status === 'On Track' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {report.task_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {reportType === 'daily' ? 'Daily Report Details' : 'Weekly Report Details'}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Employee Information</h3>
                  <p className="text-gray-600 dark:text-gray-300">Name: {selectedReport.full_name}</p>
                  <p className="text-gray-600 dark:text-gray-300">Department: {selectedReport.department}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Status</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedReport.task_status === 'On Track' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedReport.task_status}
                  </span>
                </div>

                {reportType === 'daily' ? (
                  <>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Accomplishments</h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.accomplishments}</p>
                    </div>

                    {selectedReport.has_roadblocks && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Roadblocks</h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.roadblocks_description}</p>
                      </div>
                    )}

                    {selectedReport.needs_help && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Help Needed</h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.help_description}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Weekly Accomplishments</h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.weekly_accomplishments}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Next Week's Deliverables</h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.next_week_deliverables}</p>
                    </div>

                    {selectedReport.has_problems && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Problems Encountered</h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.problems_description}</p>
                      </div>
                    )}

                    {selectedReport.needs_help && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Help Needed</h3>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.help_description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Hours</h3>
                      <p className="text-gray-600 dark:text-gray-300">Planned: {selectedReport.planned_hours}</p>
                      <p className="text-gray-600 dark:text-gray-300">Actual: {selectedReport.actual_hours}</p>
                    </div>
                  </>
                )}

                {selectedReport.additional_notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Additional Notes</h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedReport.additional_notes}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReports; 