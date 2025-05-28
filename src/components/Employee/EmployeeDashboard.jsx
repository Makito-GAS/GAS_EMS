import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FaTasks, FaCheckCircle, FaClock, FaChartLine, FaHome, FaCalendarAlt, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar'
import { useLanguage } from '../../context/LanguageContext'
import supabase from '../../../supabase-client'

const EmployeeDashboard = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: null,
    checkOut: null
  });
  const [attendanceError, setAttendanceError] = useState('');
  const [leaveRequest, setLeaveRequest] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveError, setLeaveError] = useState('');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [leaveBalance, setLeaveBalance] = useState({
    annual: 15,
    sick: 0,
    emergency: 0
  });
  const [leaveLoading, setLeaveLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
    fetchTaskStats();
    fetchLeaveBalance();
  }, []);

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`created_by.eq.${session.user.id},assigned_to.eq.${session.user.id}`);

      if (error) throw error;

      const stats = {
        total: tasks.length,
        completed: tasks.filter(task => task.status === 'completed').length,
        pending: tasks.filter(task => task.status !== 'completed').length
      };

      setTaskStats(stats);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('member_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      setLeaveLoading(true);
      const { data: approvedLeaves, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('member_id', session?.user?.id)
        .eq('status', 'approved');

      if (error) throw error;

      // Calculate used leave days
      const usedLeaves = approvedLeaves.reduce((acc, leave) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        acc[leave.leave_type] = (acc[leave.leave_type] || 0) + days;
        return acc;
      }, {});

      // Calculate remaining leave days
      setLeaveBalance({
        annual: 15 - (usedLeaves.annual || 0),
        sick: 10 - (usedLeaves.sick || 0),
        emergency: 5 - (usedLeaves.emergency || 0)
      });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveError('');

    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert([
          {
            member_id: session?.user?.id,
            leave_type: leaveRequest.leave_type,
            start_date: leaveRequest.start_date,
            end_date: leaveRequest.end_date,
            reason: leaveRequest.reason,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setShowLeaveModal(false);
      setLeaveRequest({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: ''
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setLeaveError('Failed to submit leave request. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch(error) {
      console.log(error);
    }
  }

  const handleDateChange = (e) => {
    setAttendance(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  const handleCheckIn = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    if (currentHour > 9) {
      setAttendanceError('Check-in is only allowed before 9 AM');
      return;
    }

    setAttendanceError('');
    setAttendance(prev => ({
      ...prev,
      checkIn: currentTime.toLocaleTimeString()
    }));
  };

  const handleCheckOut = () => {
    if (!attendance.checkIn) {
      setAttendanceError('Please check in first');
      return;
    }

    setAttendanceError('');
    setAttendance(prev => ({
      ...prev,
      checkOut: new Date().toLocaleTimeString()
    }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar>
        <SidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text={t('dashboard')}
          path="/employee/dashboard"
        />
        <SidebarItem 
          icon={<FaTasks className="w-6 h-6" />}
          text={t('tasks')}
          path="/employee/tasks"
        />
        <SidebarItem 
          icon={<FaCalendarAlt className="w-6 h-6" />}
          text={t('schedule')}
          path="/employee/schedule"
        />
        <SidebarItem 
          icon={<FaUser className="w-6 h-6" />}
          text={t('profile')}
          path="/employee/profile"
        />
        <SidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text={t('settings')}
          path="/employee/settings"
        />
        <div className="mt-auto pt-4 border-t border-gray-700">
          <SidebarItem 
            icon={<FaSignOutAlt className="w-6 h-6" />}
            text="Sign Out"
            onClick={handleSignOut}
          />
        </div>
      </Sidebar>

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('welcomeBack')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('overview')}</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaClock className="mr-2 text-xl" />
            <span className="text-lg">{t('markAttendance')}</span>
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaCalendarAlt className="mr-2 text-xl" />
            <span className="text-lg">{t('requestLeave')}</span>
          </button>
        </div>

        {/* Leave Requests Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('leaveRequests')}</h2>
          <div className="space-y-4">
            {leaveRequests.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">{t('noLeaveRequests')}</p>
            ) : (
              leaveRequests.map((request) => (
                <div key={request.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {t(request.leave_type)} Leave
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {request.reason}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {t(request.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Task Overview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('taskOverview')}</h2>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('totalTasks')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{taskStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('completedTasks')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{taskStats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('pendingTasks')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{taskStats.pending}</span>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('todayAttendance')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{t('checkIn')}</span>
                <span className="text-gray-800 dark:text-white font-semibold">{attendance.checkIn || t('notCheckedIn')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{t('checkOut')}</span>
                <span className="text-gray-800 dark:text-white font-semibold">{attendance.checkOut || t('notCheckedOut')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">{t('status')}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  attendance.checkIn && attendance.checkOut ? 'status-completed' :
                  attendance.checkIn ? 'status-in-progress' : 'status-pending'
                }`}>
                  {attendance.checkIn && attendance.checkOut ? t('completed') :
                   attendance.checkIn ? t('checkedIn') : t('notStarted')}
                </span>
              </div>
            </div>
          </div>

          {/* Leave Balance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('leaveBalance')}</h2>
            {leaveLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('annualLeave')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{leaveBalance.annual} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('sickLeave')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{leaveBalance.sick} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t('emergencyLeave')}</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{leaveBalance.emergency} days</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leave Request Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{t('requestLeave')}</h2>
              {leaveError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {leaveError}
                </div>
              )}
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">{t('leaveType')}</label>
                  <select
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={leaveRequest.leave_type}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, leave_type: e.target.value })}
                    required
                  >
                    <option value="sick">{t('sickLeave')}</option>
                    <option value="annual">{t('annualLeave')}</option>
                    <option value="emergency">{t('emergencyLeave')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">{t('startDate')}</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={leaveRequest.start_date}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">{t('endDate')}</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={leaveRequest.end_date}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, end_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">{t('reason')}</label>
                  <textarea
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    value={leaveRequest.reason}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                    placeholder={t('enterReasonForLeave')}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {t('submitRequest')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Attendance Modal */}
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t('markAttendance')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">{t('date')}</label>
                  <input 
                    type="date" 
                    value={attendance.date}
                    onChange={handleDateChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="text-center">
                  <p className="text-gray-600 mb-2">{t('currentTime')}</p>
                  <p className="text-2xl font-bold text-gray-800">{new Date().toLocaleTimeString()}</p>
                </div>
                {attendanceError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {attendanceError}
                  </div>
                )}
                <div className="space-y-2">
                  <button 
                    onClick={handleCheckIn}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    {t('checkIn')}
                  </button>
                  <button 
                    onClick={handleCheckOut}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    {t('checkOut')}
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">{t('todayAttendance')}</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">{t('date')}: {attendance.date}</p>
                    <p className="text-sm text-gray-600">{t('checkIn')}: {attendance.checkIn || t('notCheckedIn')}</p>
                    <p className="text-sm text-gray-600">{t('checkOut')}: {attendance.checkOut || t('notCheckedOut')}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowAttendanceModal(false);
                      setAttendanceError('');
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard;