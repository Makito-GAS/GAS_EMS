import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
  
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
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
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
  // Add state for department filter
  const [departmentFilter, setDepartmentFilter] = useState('All');
  // State for time range filter
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  // State for top/bottom performers
  const [topPerformers, setTopPerformers] = useState([]);
  const [bottomPerformers, setBottomPerformers] = useState([]);
  // State for summary insights
  const [insights, setInsights] = useState([]);
  // State for all departments (for dropdown)
  const [allDepartments, setAllDepartments] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [departmentFilter, dateRange]);

  // Fetch all departments for dropdown on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('department')
        .neq('department', null);
      if (!error && data) {
        const uniqueDepts = Array.from(new Set(data.map(r => r.department)));
        setAllDepartments(uniqueDepts);
      }
    };
    fetchDepartments();
  }, []);

  // Helper to get unique department names from reports
  const getDepartments = (reports) => {
    const depts = new Set(reports.map(r => r.department));
    return Array.from(depts);
  };

  // Enhanced fetchAnalyticsData with date range and insights
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      let dailyReportsQuery = supabase.from('daily_reports').select('*');
      // Apply date range filter if set
      if (dateRange.start && dateRange.end) {
        dailyReportsQuery = dailyReportsQuery.gte('created_at', new Date(dateRange.start).toISOString()).lte('created_at', new Date(dateRange.end).toISOString());
      } else {
        // Default: current week
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        dailyReportsQuery = dailyReportsQuery.gte('created_at', startOfWeek.toISOString());
      }
      if (departmentFilter !== 'All') {
        dailyReportsQuery = dailyReportsQuery.eq('department', departmentFilter);
      }
      const { data: dailyReports, error: dailyReportsError } = await dailyReportsQuery.order('created_at', { ascending: true });
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

      // Calculate top/bottom performers
      const growth = dailyReports?.length > 0 ? processEmployeeGrowth(dailyReports) : [];
      setEmployeeGrowth(growth);
      setTopPerformers(growth.slice().sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5));
      setBottomPerformers(growth.slice().sort((a, b) => a.performanceScore - b.performanceScore).slice(0, 5));
      // Generate summary insights
      const pendingReports = growth.filter(e => e.totalReports < 4).length;
      const lowPerformance = growth.filter(e => e.performanceScore < 60).length;
      setInsights([
        `${pendingReports} employees have not submitted all weekly reports in the selected period.`,
        `${lowPerformance} employees have a performance score below 60%.`
      ]);
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

      console.log('Fetching details for employeeId:', employeeId);

      // Get the start of the last 4 weeks
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      // Fetch all tasks for summary stats (no date filter)
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', employeeId);
      if (allTasksError) throw allTasksError;
      console.log('All tasks for employee:', allTasks);

      // Fetch tasks for the last 4 weeks for the chart
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', employeeId)
        .gte('created_at', startDate.toISOString());
      if (tasksError) throw tasksError;
      console.log('Recent tasks for employee:', tasks);

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

      // Calculate task stats
      const completedCount = allTasks.filter(task => task.status === 'completed').length;
      const totalCount = allTasks.length;
      const pendingCount = allTasks.filter(task => task.status !== 'completed').length;

      setEmployeeDetails({
        taskCompletion: taskCompletionData,
        reportSubmission: reportSubmissionData,
        attendance: attendanceData,
        taskStats: {
          total: totalCount,
          completed: completedCount,
          pending: pendingCount
        }
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
    // Get the last 4 full weeks (Monday to Sunday)
    const weeks = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Find last Monday
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(lastMonday);
      weekStart.setDate(lastMonday.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeks.push({
        start: new Date(weekStart),
        end: new Date(weekEnd),
        label: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
      });
    }

    const weeklyData = weeks.map(() => ({ completed: 0, total: 0 }));

    // Count total tasks by created_at week
    tasks.forEach(task => {
      const createdAt = new Date(task.created_at);
      weeks.forEach((week, idx) => {
        if (createdAt >= week.start && createdAt <= week.end) {
          weeklyData[idx].total++;
        }
      });
    });

    // Count completed tasks by completed_at week
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completed_at) {
        const completedAt = new Date(task.completed_at);
        weeks.forEach((week, idx) => {
          if (completedAt >= week.start && completedAt <= week.end) {
            weeklyData[idx].completed++;
          }
        });
      }
    });

    return {
      labels: weeks.map(week => week.label),
      datasets: [
        {
          label: 'Completed Tasks',
          data: weeklyData.map(w => w.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'Total Tasks',
          data: weeklyData.map(w => w.total),
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

  // DEBUG: Fetch and log the first 5 tasks in the table to inspect created_by values
  const debugFetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);
    if (error) {
      console.error('DEBUG: Error fetching tasks:', error);
    } else {
      console.log('DEBUG: First 5 tasks:', data);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
     
      <div className="ml-30 flex-1 p-8 overflow-y-auto h-screen">
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
        {/* Department Filter Dropdown */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Department
            </label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="block w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Departments</option>
              {/* Dynamically list departments */}
              {allDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Date Range
            </label>
            <div className="flex gap-2">
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="px-2 py-1 border rounded" />
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="px-2 py-1 border rounded" />
            </div>
          </div>
        </div>
        {/* Insights Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Key Insights</h3>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            {insights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
        {/* Top/Bottom Performers */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">Top 5 Performers</h4>
            <ul>
              {topPerformers.map(emp => (
                <li key={emp.member_id} className="flex justify-between border-b py-1">
                  <span>{emp.name}</span>
                  <span className="font-bold">{emp.performanceScore}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 className="font-semibold mb-2 text-red-700 dark:text-red-400">Bottom 5 Performers</h4>
            <ul>
              {bottomPerformers.map(emp => (
                <li key={emp.member_id} className="flex justify-between border-b py-1">
                  <span>{emp.name}</span>
                  <span className="font-bold">{emp.performanceScore}%</span>
                </li>
              ))}
            </ul>
          </div>
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
              <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                <div className="h-96 w-full md:w-2/3">
                  <Doughnut data={weeklyData} options={{ maintainAspectRatio: false }} />
                </div>
                {/* Pie chart values/legend with percentages */}
                <div className="mt-6 md:mt-0 md:w-1/3 flex flex-col items-center">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Status Breakdown</h3>
                  <ul className="space-y-2 w-full">
                    {weeklyData && weeklyData.labels.map((label, idx) => {
                      const value = weeklyData.datasets[0].data[idx];
                      const total = weeklyData.datasets[0].data.reduce((a, b) => a + b, 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      const color = weeklyData.datasets[0].backgroundColor[idx];
                      return (
                        <li key={label} className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ backgroundColor: color, color: '#fff' }}>
                          <span className="font-medium">{label}</span>
                          <span className="font-bold">{value} <span className="ml-2">({percent}%)</span></span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* OKR Status Distribution */}
            {weeklyReportData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quarterly OKR Status Distribution</h2>
                <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                  <div className="h-96 w-full md:w-2/3">
                    <Doughnut data={weeklyReportData.okrStatus} options={{ maintainAspectRatio: false }} />
                  </div>
                  {/* Pie chart values/legend with percentages */}
                  <div className="mt-6 md:mt-0 md:w-1/3 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">OKR Breakdown</h3>
                    <ul className="space-y-2 w-full">
                      {weeklyReportData.okrStatus && weeklyReportData.okrStatus.labels.map((label, idx) => {
                        const value = weeklyReportData.okrStatus.datasets[0].data[idx];
                        const total = weeklyReportData.okrStatus.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        const color = weeklyReportData.okrStatus.datasets[0].backgroundColor[idx];
                        return (
                          <li key={label} className="flex items-center justify-between px-4 py-2 rounded-lg" style={{ backgroundColor: color, color: '#fff' }}>
                            <span className="font-medium">{label}</span>
                            <span className="font-bold">{value} <span className="ml-2">({percent}%)</span></span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
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
                  {/* Task Overview */}
                  {employeeDetails && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Task Overview</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">Total Tasks</span>
                          <span className="text-gray-800 dark:text-white font-semibold">{employeeDetails.taskStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">Completed</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">{employeeDetails.taskStats.completed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">Pending</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{employeeDetails.taskStats.pending}</span>
                        </div>
                      </div>
                    </div>
                  )}

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