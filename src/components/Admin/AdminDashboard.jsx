import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { FaUsers, FaTasks, FaChartLine, FaCalendarAlt, FaComments, FaFileAlt } from 'react-icons/fa'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useLanguage } from '../../context/LanguageContext'
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar'
import { FaHome, FaUserPlus, FaChartBar, FaCog } from 'react-icons/fa'
import supabase from '../../../supabase-client'

const AdminDashboard = () => {
  const {session, signOut} = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    upcomingEvents: 0,
    unreadMessages: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Memoize fetchStats to prevent unnecessary re-renders
  const fetchStats = useCallback(async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('member')
        .select('*', { count: 'exact', head: true });

      // Fetch upcoming events
      const { data: events, count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (events) {
        setUpcomingEvents(events);
      }

      // Fetch unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', session?.user?.id)
        .eq('is_read', false);

      setStats(prev => ({
        ...prev,
        totalEmployees: employeeCount || 0,
        upcomingEvents: eventCount || 0,
        unreadMessages: messageCount || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [session?.user?.id]);

  // Create debounced version of fetchStats
  const debouncedFetchStats = useCallback(
    debounce(fetchStats, 300),
    [fetchStats]
  );

  useEffect(() => {
    if (session?.user) {
      fetchStats();
      fetchAttendanceData();
      fetchEmployeePerformance();
    }
    
    // Subscribe to message updates
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${session?.user?.id}`
      }, (payload) => {
        // Only refresh if the message was marked as read
        if (payload.new.is_read && !payload.old.is_read) {
          debouncedFetchStats();
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${session?.user?.id}`
      }, () => {
        debouncedFetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session, debouncedFetchStats]);

  const fetchAttendanceData = async () => {
    try {
      // Get the start of the current week
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      // Fetch attendance records for the current week
      const { data: attendanceRecords, error } = await supabase
        .from('attendance')
        .select(`
          *,
          member:member_id (
            name,
            department
          )
        `)
        .gte('date', startOfWeek.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      // Process attendance data by day
      const attendanceByDay = {};
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      
      // Initialize attendance data for each day
      days.forEach(day => {
        attendanceByDay[day] = {
          onTime: 0,
          late: 0,
          total: 0
        };
      });

      // Count attendance for each day
      attendanceRecords.forEach(record => {
        const date = new Date(record.date);
        const dayIndex = date.getDay() - 1; // Convert to 0-4 for Mon-Fri
        
        if (dayIndex >= 0 && dayIndex < 5) { // Only count weekdays
          const day = days[dayIndex];
          attendanceByDay[day].total++;
          
          if (record.status === 'present') {
            attendanceByDay[day].onTime++;
          } else if (record.status === 'late') {
            attendanceByDay[day].late++;
          }
        }
      });

      // Calculate attendance percentages for each day
      const processedData = days.map(day => ({
        name: day,
        onTime: attendanceByDay[day].total > 0 
          ? Math.round((attendanceByDay[day].onTime / attendanceByDay[day].total) * 100)
          : 0,
        late: attendanceByDay[day].total > 0 
          ? Math.round((attendanceByDay[day].late / attendanceByDay[day].total) * 100)
          : 0
      }));

      setPerformanceData(processedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchEmployeePerformance = async () => {
    try {
      // Get the start of the last 6 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      // Fetch all employees
      const { data: employees, error: employeesError } = await supabase
        .from('member')
        .select('id, name, created_at')
        .order('created_at', { ascending: true });

      if (employeesError) throw employeesError;

      // Fetch attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate.toISOString());

      if (attendanceError) throw attendanceError;

      // Fetch daily reports
      const { data: dailyReports, error: dailyReportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (dailyReportsError) throw dailyReportsError;

      // Process data by month
      const monthlyStats = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Initialize monthly stats
      months.forEach(month => {
        monthlyStats[month] = {
          total: 0,
          active: 0,
          performance: 0
        };
      });

      // Calculate monthly statistics
      employees.forEach(employee => {
        const joinDate = new Date(employee.created_at);
        const joinMonth = months[joinDate.getMonth()];
        
        // Count total employees
        for (let i = months.indexOf(joinMonth); i < months.length; i++) {
          monthlyStats[months[i]].total++;
        }
      });

      // Calculate active employees and performance metrics
      const currentDate = new Date();
      const currentMonth = months[currentDate.getMonth()];
      
      for (let i = 0; i <= months.indexOf(currentMonth); i++) {
        const month = months[i];
        const monthStart = new Date(currentDate.getFullYear(), i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), i + 1, 0);

        // Calculate active employees (those with attendance or reports)
        const activeEmployees = new Set();
        
        // Check attendance records
        attendanceRecords.forEach(record => {
          const recordDate = new Date(record.date);
          if (recordDate >= monthStart && recordDate <= monthEnd) {
            activeEmployees.add(record.member_id);
          }
        });

        // Check daily reports
        dailyReports.forEach(report => {
          const reportDate = new Date(report.created_at);
          if (reportDate >= monthStart && reportDate <= monthEnd) {
            activeEmployees.add(report.member_id);
          }
        });

        monthlyStats[month].active = activeEmployees.size;

        // Calculate performance score
        let totalPerformance = 0;
        let performanceCount = 0;

        // Calculate attendance performance
        const monthAttendance = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        if (monthAttendance.length > 0) {
          const onTimeCount = monthAttendance.filter(record => record.status === 'present').length;
          const attendanceScore = (onTimeCount / monthAttendance.length) * 100;
          totalPerformance += attendanceScore;
          performanceCount++;
        }

        // Calculate daily report performance
        const monthReports = dailyReports.filter(report => {
          const reportDate = new Date(report.created_at);
          return reportDate >= monthStart && reportDate <= monthEnd;
        });

        if (monthReports.length > 0) {
          const onTrackCount = monthReports.filter(report => report.task_status === 'On Track').length;
          const reportScore = (onTrackCount / monthReports.length) * 100;
          totalPerformance += reportScore;
          performanceCount++;
        }

        // Calculate average performance
        monthlyStats[month].performance = performanceCount > 0 
          ? Math.round(totalPerformance / performanceCount)
          : 0;
      }

      // Convert to array format for the chart
      const processedData = months.map(month => ({
        name: month,
        total: monthlyStats[month].total,
        active: monthlyStats[month].active,
        performance: monthlyStats[month].performance
      }));

      setEmployeeStats(processedData);
    } catch (error) {
      console.error('Error fetching employee performance:', error);
    }
  };

  const statCards = [
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: t('totalEmployees'),
      value: stats.totalEmployees,
      color: 'bg-blue-500'
    },
    {
      icon: <FaCalendarAlt className="w-8 h-8" />,
      title: t('upcomingEvents'),
      value: stats.upcomingEvents,
      color: 'bg-purple-500'
    },
    {
      icon: <FaComments className="w-8 h-8" />,
      title: t('unreadMessages'),
      value: stats.unreadMessages,
      color: 'bg-red-500'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar className=''>
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
          icon={<FaCalendarAlt className="w-6 h-6" />}
          text="Leave Requests"
          path="/admin/leave-requests"
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.email?.split('@')[0] || 'Admin'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-full text-white`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
            <button
              onClick={() => navigate('/admin/EventSchedule')}
              className="text-blue-500 hover:text-blue-600"
            >
              View All
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming events scheduled</p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">{event.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(event.start_time)} - {formatDate(event.end_time)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-600">📍 {event.location}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                      event.type === 'training' ? 'bg-green-100 text-green-800' :
                      event.type === 'holiday' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Employee Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={employeeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" name="Total Employees" />
                  <Area type="monotone" dataKey="active" stroke="#82ca9d" fill="#82ca9d" name="Active Employees" />
                  <Area type="monotone" dataKey="performance" stroke="#ff7300" fill="#ff7300" name="Performance %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Weekly Attendance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onTime" fill="#4CAF50" name="On Time %" />
                  <Bar dataKey="late" fill="#FFA726" name="Late %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/employees')}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <FaUsers className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-gray-800">{t('manageEmployees')}</p>
            </button>
            <button
              onClick={() => navigate('/admin/EventSchedule')}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <FaCalendarAlt className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-gray-800">{t('manageSchedule')}</p>
            </button>
            <button
              onClick={() => navigate('/admin/chat')}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <FaComments className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-gray-800">{t('openChat')}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard;