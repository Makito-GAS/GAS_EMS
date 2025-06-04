import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog, FaFileAlt, FaFileExcel, FaEye } from 'react-icons/fa';
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
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);

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
          member_id: employeeId,
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

  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Export Employee Growth Data
      const employeeGrowthData = employeeGrowth.map(emp => ({
        'Employee Name': emp.name,
        'Department': emp.department,
        'Performance Score': `${emp.performanceScore}%`,
        'On Track Tasks': emp.onTrackCount,
        'Roadblocks': emp.roadblocksCount,
        'Help Requests': emp.helpRequests,
        'Total Reports': emp.totalReports
      }));
      
      const wsEmployeeGrowth = XLSX.utils.json_to_sheet(employeeGrowthData);
      XLSX.utils.book_append_sheet(wb, wsEmployeeGrowth, 'Employee Growth');

      // Export Department Performance Data
      const deptPerformanceData = departmentData.labels.map((dept, index) => ({
        'Department': dept,
        'On Track Tasks': departmentData.datasets[0].data[index],
        'At Risk Tasks': departmentData.datasets[1].data[index]
      }));
      
      const wsDepartment = XLSX.utils.json_to_sheet(deptPerformanceData);
      XLSX.utils.book_append_sheet(wb, wsDepartment, 'Department Performance');

      // Export Task Status Data
      const taskStatusData = weeklyData.labels.map((status, index) => ({
        'Status': status,
        'Count': weeklyData.datasets[0].data[index]
      }));
      
      const wsTaskStatus = XLSX.utils.json_to_sheet(taskStatusData);
      XLSX.utils.book_append_sheet(wb, wsTaskStatus, 'Task Status');

      // Export Weekly Hours Data if available
      if (weeklyReportData?.hours) {
        const hoursData = weeklyReportData.hours.labels.map((name, index) => ({
          'Employee': name,
          'Planned Hours': weeklyReportData.hours.datasets[0].data[index],
          'Actual Hours': weeklyReportData.hours.datasets[1].data[index]
        }));
        
        const wsHours = XLSX.utils.json_to_sheet(hoursData);
        XLSX.utils.book_append_sheet(wb, wsHours, 'Weekly Hours');
      }

      // Generate Excel file
      const fileName = `performance_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Performance data exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export performance data');
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      setEmployeeLoading(true);
      
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }

      // Get the start of the last 4 weeks
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', employeeId)
        .gte('created_at', startDate.toISOString());

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw new Error('Failed to fetch tasks');
      }

      // Fetch daily reports
      const { data: dailyReports, error: dailyReportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('member_id', employeeId)
        .gte('created_at', startDate.toISOString());

      if (dailyReportsError) {
        console.error('Error fetching daily reports:', dailyReportsError);
        throw new Error('Failed to fetch daily reports');
      }

      // Fetch weekly reports
      const { data: weeklyReports, error: weeklyReportsError } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('member_id', employeeId)
        .gte('created_at', startDate.toISOString());

      if (weeklyReportsError) {
        console.error('Error fetching weekly reports:', weeklyReportsError);
        throw new Error('Failed to fetch weekly reports');
      }

      // Fetch attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', employeeId)
        .gte('date', startDate.toISOString());

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        throw new Error('Failed to fetch attendance records');
      }

      // Process data for charts
      const taskCompletionData = processTaskCompletionData(tasks || []);
      const reportSubmissionData = processReportSubmissionData(dailyReports || [], weeklyReports || []);
      const attendanceData = processAttendanceData(attendance || []);

      setEmployeeDetails({
        taskCompletion: taskCompletionData,
        reportSubmission: reportSubmissionData,
        attendance: attendanceData
      });
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error(error.message || 'Failed to fetch employee details');
      setEmployeeDetails(null);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const processTaskCompletionData = (tasks) => {
    const weeklyData = {};
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return date.toISOString().split('T')[0];
    }).reverse();

    last4Weeks.forEach(week => {
      weeklyData[week] = {
        completed: 0,
        total: 0
      };
    });

    tasks.forEach(task => {
      const taskDate = new Date(task.created_at).toISOString().split('T')[0];
      const weekStart = last4Weeks.find(week => taskDate >= week);
      
      if (weekStart) {
        weeklyData[weekStart].total++;
        if (task.status === 'completed') {
          weeklyData[weekStart].completed++;
        }
      }
    });

    return {
      labels: last4Weeks.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Completed Tasks',
          data: last4Weeks.map(week => weeklyData[week].completed),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'Total Tasks',
          data: last4Weeks.map(week => weeklyData[week].total),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        }
      ]
    };
  };

  const processReportSubmissionData = (dailyReports, weeklyReports) => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last4Weeks.map(week => {
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return dailyReports.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= new Date(week) && reportDate <= weekEnd;
      }).length;
    });

    const weeklyData = last4Weeks.map(week => {
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return weeklyReports.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= new Date(week) && reportDate <= weekEnd;
      }).length;
    });

    return {
      labels: last4Weeks.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Reports',
          data: dailyData,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'Weekly Reports',
          data: weeklyData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        }
      ]
    };
  };

  const processAttendanceData = (attendance) => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return date.toISOString().split('T')[0];
    }).reverse();

    const weeklyData = last4Weeks.map(week => {
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(week) && recordDate <= weekEnd;
      });

      return {
        present: weekAttendance.filter(record => record.status === 'present').length,
        late: weekAttendance.filter(record => record.status === 'late').length,
        absent: weekAttendance.filter(record => record.status === 'absent').length
      };
    });

    return {
      labels: last4Weeks.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Present',
          data: weeklyData.map(week => week.present),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'Late',
          data: weeklyData.map(week => week.late),
          backgroundColor: 'rgba(234, 179, 8, 0.6)',
        },
        {
          label: 'Absent',
          data: weeklyData.map(week => week.absent),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
        }
      ]
    };
  };

  const handleViewEmployee = async (employee) => {
    try {
      if (!employee?.member_id) {
        throw new Error('Invalid employee data');
      }
      setSelectedEmployee(employee);
      setShowEmployeeModal(true);
      await fetchEmployeeDetails(employee.member_id);
    } catch (error) {
      console.error('Error viewing employee:', error);
      toast.error('Failed to load employee details');
      setShowEmployeeModal(false);
    }
  };

  const exportEmployeeDetails = () => {
    try {
      if (!selectedEmployee || !employeeDetails) {
        throw new Error('No employee data available to export');
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Export Task Completion Data
      const taskCompletionData = employeeDetails.taskCompletion.labels.map((week, index) => {
        const completedTasks = employeeDetails.taskCompletion.datasets[0].data[index] || 0;
        const totalTasks = employeeDetails.taskCompletion.datasets[1].data[index] || 0;
        const completionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        return {
          'Week': week,
          'Completed Tasks': completedTasks,
          'Total Tasks': totalTasks,
          'Completion Rate': `${completionRate}%`
        };
      });
      
      const wsTaskCompletion = XLSX.utils.json_to_sheet(taskCompletionData);
      XLSX.utils.book_append_sheet(wb, wsTaskCompletion, 'Task Completion');

      // Export Report Submission Data
      const reportSubmissionData = employeeDetails.reportSubmission.labels.map((week, index) => ({
        'Week': week,
        'Daily Reports': employeeDetails.reportSubmission.datasets[0].data[index] || 0,
        'Weekly Reports': employeeDetails.reportSubmission.datasets[1].data[index] || 0
      }));
      
      const wsReportSubmission = XLSX.utils.json_to_sheet(reportSubmissionData);
      XLSX.utils.book_append_sheet(wb, wsReportSubmission, 'Report Submission');

      // Export Attendance Data
      const attendanceData = employeeDetails.attendance.labels.map((week, index) => {
        const presentDays = employeeDetails.attendance.datasets[0].data[index] || 0;
        const lateDays = employeeDetails.attendance.datasets[1].data[index] || 0;
        const absentDays = employeeDetails.attendance.datasets[2].data[index] || 0;
        const totalDays = presentDays + lateDays + absentDays;
        const attendanceRate = totalDays > 0 
          ? Math.round((presentDays / totalDays) * 100)
          : 0;

        return {
          'Week': week,
          'Present Days': presentDays,
          'Late Days': lateDays,
          'Absent Days': absentDays,
          'Attendance Rate': `${attendanceRate}%`
        };
      });
      
      const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(wb, wsAttendance, 'Attendance');

      // Generate Excel file
      const fileName = `${selectedEmployee.name}_performance_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Employee performance data exported successfully!');
    } catch (error) {
      console.error('Error exporting employee details:', error);
      toast.error(error.message || 'Failed to export employee details');
    }
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Performance Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">Weekly performance and employee growth metrics</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaFileExcel className="mr-2" />
            Export to Excel
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Details
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewEmployee(employee)}
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
          </div>
        )}

        {/* Employee Details Modal */}
        {showEmployeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedEmployee?.name}'s Performance Details
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={exportEmployeeDetails}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaFileExcel className="mr-2" />
                    Export Details
                  </button>
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              </div>

              {employeeLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : employeeDetails ? (
                <div className="space-y-8">
                  {/* Task Completion Chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Task Completion Rate</h3>
                    <div className="h-80">
                      <Bar
                        data={employeeDetails.taskCompletion}
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

                  {/* Report Submission Chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Report Submission Rate</h3>
                    <div className="h-80">
                      <Line
                        data={employeeDetails.reportSubmission}
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

                  {/* Attendance Chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Attendance</h3>
                    <div className="h-80">
                      <Bar
                        data={employeeDetails.attendance}
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
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No detailed data available for this employee.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalytics; 