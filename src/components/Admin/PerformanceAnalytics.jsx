import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog, FaFileAlt } from 'react-icons/fa';
import supabase from '../../../supabase-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PerformanceAnalytics = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [employeeGrowth, setEmployeeGrowth] = useState([]);
  const [weeklyReportData, setWeeklyReportData] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get the start of the current week
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      // Fetch daily reports for the current week
      const { data: dailyReports, error: dailyReportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true });

      if (dailyReportsError) throw dailyReportsError;

      // Fetch weekly reports for the current quarter
      const startOfQuarter = new Date();
      startOfQuarter.setMonth(Math.floor(startOfQuarter.getMonth() / 3) * 3, 1);
      startOfQuarter.setHours(0, 0, 0, 0);

      const { data: weeklyReports, error: weeklyReportsError } = await supabase
        .from('weekly_reports')
        .select('*')
        .gte('created_at', startOfQuarter.toISOString())
        .order('created_at', { ascending: true });

      if (weeklyReportsError) throw weeklyReportsError;

      // Initialize default data for charts
      const defaultTaskStatusData = {
        labels: ['On Track', 'At Risk'],
        datasets: [{
          label: 'Task Status Distribution',
          data: [0, 0],
          backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          borderWidth: 1
        }]
      };

      const defaultDepartmentData = {
        labels: [],
        datasets: [
          {
            label: 'On Track Tasks',
            data: [],
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
          },
          {
            label: 'At Risk Tasks',
            data: [],
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
          }
        ]
      };

      const defaultWeeklyReportData = {
        okrStatus: {
          labels: ['On Track', 'At Risk'],
          datasets: [{
            label: 'OKR Status Distribution',
            data: [0, 0],
            backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
            borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
            borderWidth: 1
          }]
        },
        hours: {
          labels: [],
          datasets: [
            {
              label: 'Planned Hours',
              data: [],
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
            },
            {
              label: 'Actual Hours',
              data: [],
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
            }
          ]
        }
      };

      // Process data for charts if we have data
      const taskStatusData = dailyReports?.length > 0 ? processTaskStatusData(dailyReports) : defaultTaskStatusData;
      const departmentPerformanceData = dailyReports?.length > 0 ? processDepartmentData(dailyReports) : defaultDepartmentData;
      const employeeGrowthData = dailyReports?.length > 0 ? processEmployeeGrowth(dailyReports) : [];
      const weeklyReportAnalytics = weeklyReports?.length > 0 ? processWeeklyReportData(weeklyReports) : defaultWeeklyReportData;

      setWeeklyData(taskStatusData);
      setDepartmentData(departmentPerformanceData);
      setEmployeeGrowth(employeeGrowthData);
      setWeeklyReportData(weeklyReportAnalytics);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processTaskStatusData = (reports) => {
    const statusCount = {
      'On Track': 0,
      'At Risk': 0
    };

    reports.forEach(report => {
      statusCount[report.task_status]++;
    });

    return {
      labels: ['On Track', 'At Risk'],
      datasets: [{
        label: 'Task Status Distribution',
        data: [statusCount['On Track'], statusCount['At Risk']],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 1
      }]
    };
  };

  const processDepartmentData = (reports) => {
    const departmentStats = {};
    
    reports.forEach(report => {
      const dept = report.department;
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          total: 0,
          onTrack: 0,
          atRisk: 0,
          roadblocks: 0
        };
      }
      
      departmentStats[dept].total++;
      if (report.task_status === 'On Track') {
        departmentStats[dept].onTrack++;
      } else {
        departmentStats[dept].atRisk++;
      }
      if (report.has_roadblocks) {
        departmentStats[dept].roadblocks++;
      }
    });

    return {
      labels: Object.keys(departmentStats),
      datasets: [
        {
          label: 'On Track Tasks',
          data: Object.values(departmentStats).map(stat => stat.onTrack),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'At Risk Tasks',
          data: Object.values(departmentStats).map(stat => stat.atRisk),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
        }
      ]
    };
  };

  const processEmployeeGrowth = (reports) => {
    const employeeStats = {};
    
    reports.forEach(report => {
      const employeeId = report.member_id;
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          name: report.full_name,
          department: report.department,
          totalReports: 0,
          onTrackCount: 0,
          roadblocksCount: 0,
          helpRequests: 0
        };
      }
      
      employeeStats[employeeId].totalReports++;
      if (report.task_status === 'On Track') {
        employeeStats[employeeId].onTrackCount++;
      }
      if (report.has_roadblocks) {
        employeeStats[employeeId].roadblocksCount++;
      }
      if (report.needs_help) {
        employeeStats[employeeId].helpRequests++;
      }
    });

    return Object.values(employeeStats).map(stat => ({
      ...stat,
      performanceScore: calculatePerformanceScore(stat)
    }));
  };

  const calculatePerformanceScore = (stat) => {
    const onTrackRatio = stat.onTrackCount / stat.totalReports;
    const roadblockRatio = stat.roadblocksCount / stat.totalReports;
    const helpRequestRatio = stat.helpRequests / stat.totalReports;
    
    // Weighted scoring system
    return Math.round(
      (onTrackRatio * 0.5 + (1 - roadblockRatio) * 0.3 + (1 - helpRequestRatio) * 0.2) * 100
    );
  };

  const processWeeklyReportData = (reports) => {
    const okrStatusData = {
      labels: ['On Track', 'At Risk'],
      datasets: [{
        label: 'OKR Status Distribution',
        data: [
          reports.filter(r => r.task_status === 'On Track').length,
          reports.filter(r => r.task_status === 'At Risk').length
        ],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 1
      }]
    };

    const hoursData = {
      labels: reports.map(r => r.full_name),
      datasets: [
        {
          label: 'Planned Hours',
          data: reports.map(r => r.planned_hours),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        },
        {
          label: 'Actual Hours',
          data: reports.map(r => r.actual_hours),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
        }
      ]
    };

    return {
      okrStatus: okrStatusData,
      hours: hoursData
    };
  };

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
          icon={<FaFileAlt className="w-6 h-6" />}
          text="Daily Reports"
          path="/admin/daily-reports"
        />
        <AdminSidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text="Settings"
          path="/admin/settings"
        />
      </AdminSidebar>

      <div className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Performance Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">Weekly performance and employee growth metrics</p>
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
          <div className="space-y-8">
            {/* Task Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Daily Task Status Distribution</h2>
              <div className="h-80">
                <Pie data={weeklyData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            {/* OKR Status Distribution */}
            {weeklyReportData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quarterly OKR Status Distribution</h2>
                <div className="h-80">
                  <Pie data={weeklyReportData.okrStatus} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            )}

            {/* Department Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Department Performance</h2>
              <div className="h-80">
                <Bar 
                  data={departmentData} 
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        stacked: true
                      },
                      x: {
                        stacked: true
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Hours Tracking */}
            {weeklyReportData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Weekly Hours Tracking</h2>
                <div className="h-80">
                  <Bar 
                    data={weeklyReportData.hours} 
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Employee Growth Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-6">Employee Growth</h2>
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
                        Performance Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        On Track Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Roadblocks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Help Requests
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employeeGrowth.map((employee) => (
                      <tr key={employee.name}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{employee.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{employee.performanceScore}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{employee.onTrackCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{employee.roadblocksCount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{employee.helpRequests}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalytics; 