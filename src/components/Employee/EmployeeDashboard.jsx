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
    sick: 10,
    emergency: 5
  });
  const [leaveLoading, setLeaveLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchLeaveRequests();
      fetchTaskStats();
      fetchLeaveBalance();
    }
  }, [session]);

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
      
      // First, get the leave policy for the employee
      const { data: policy, error: policyError } = await supabase
        .from('leave_policy')
        .select('*')
        .eq('member_id', session?.user?.id)
        .single();

      if (policyError && policyError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw policyError;
      }

      // If no policy exists, create one with default values
      if (!policy) {
        const { data: newPolicy, error: createError } = await supabase
          .from('leave_policy')
          .insert([
            {
              member_id: session?.user?.id,
              annual_leave: 15,
              sick_leave: 10,
              emergency_leave: 5
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        policy = newPolicy;
      }

      // Get approved leave requests
      const { data: approvedLeaves, error: leavesError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('member_id', session?.user?.id)
        .eq('status', 'approved');

      if (leavesError) throw leavesError;

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
        annual: policy.annual_leave - (usedLeaves.annual || 0),
        sick: policy.sick_leave - (usedLeaves.sick || 0),
        emergency: policy.emergency_leave - (usedLeaves.emergency || 0)
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
      fetchLeaveBalance();
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
      console.error('Error signing out:', error);
    }
  }

  const handleDateChange = (e) => {
    setAttendance(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  const handleCheckIn = async () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    if (currentHour > 9) {
      setAttendanceError('Check-in is only allowed before 9 AM');
      return;
    }

    try {
      // First check if attendance record already exists for today
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', session?.user?.id)
        .eq('date', attendance.date)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAttendance) {
        setAttendanceError('You have already checked in for this date');
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .insert([
          {
            member_id: session?.user?.id,
            date: attendance.date,
            check_in: currentTime.toISOString(),
            status: 'present'
          }
        ]);

      if (error) throw error;

      setAttendanceError('');
      setAttendance(prev => ({
        ...prev,
        checkIn: currentTime.toLocaleTimeString()
      }));
      setShowAttendanceModal(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setAttendanceError('Failed to mark attendance. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      // First get the existing attendance record
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', session?.user?.id)
        .eq('date', attendance.date)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          setAttendanceError('No check-in record found for this date');
        } else {
          throw checkError;
        }
        return;
      }

      if (existingAttendance.check_out) {
        setAttendanceError('You have already checked out for this date');
        return;
      }

      const currentTime = new Date();
      const { error } = await supabase
        .from('attendance')
        .update({ 
          check_out: currentTime.toISOString(),
          updated_at: currentTime.toISOString()
        })
        .eq('member_id', session?.user?.id)
        .eq('date', attendance.date);

      if (error) throw error;

      setAttendanceError('');
      setAttendance(prev => ({
        ...prev,
        checkOut: currentTime.toLocaleTimeString()
      }));
      setShowAttendanceModal(false);
    } catch (error) {
      console.error('Error marking checkout:', error);
      setAttendanceError('Failed to mark checkout. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar>
        <SidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text="Dashboard"
          path="/employee/dashboard"
        />
        <SidebarItem 
          icon={<FaTasks className="w-6 h-6" />}
          text="Tasks"
          path="/employee/tasks"
        />
        <SidebarItem 
          icon={<FaCalendarAlt className="w-6 h-6" />}
          text="Schedule"
          path="/employee/schedule"
        />
        <SidebarItem 
          icon={<FaUser className="w-6 h-6" />}
          text="Profile"
          path="/employee/profile"
        />
        <SidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text="Settings"
          path="/employee/settings"
        />
      </Sidebar>

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-300">Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Task Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Task Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Total Tasks</span>
                <span className="text-gray-800 dark:text-white font-semibold">{taskStats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Completed</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">{taskStats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Pending</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{taskStats.pending}</span>
              </div>
            </div>
          </div>

          {/* Leave Balance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Leave Balance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Annual Leave</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{leaveBalance.annual} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Sick Leave</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">{leaveBalance.sick} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Emergency Leave</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">{leaveBalance.emergency} days</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FaClock className="mr-2" />
                Mark Attendance
              </button>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaCalendarAlt className="mr-2" />
                Request Leave
              </button>
            </div>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Leave Requests</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300">Start Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300">End Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.slice(0, 5).map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-white capitalize">{request.leave_type}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-white">{new Date(request.start_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-white">{new Date(request.end_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Mark Attendance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={attendance.date}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              {attendanceError && (
                <p className="text-red-500 text-sm">{attendanceError}</p>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={handleCheckIn}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Check Out
                </button>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Request Leave</h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-2">Leave Type</label>
                <select
                  value={leaveRequest.leave_type}
                  onChange={(e) => setLeaveRequest(prev => ({ ...prev, leave_type: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={leaveRequest.start_date}
                  onChange={(e) => setLeaveRequest(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={leaveRequest.end_date}
                  onChange={(e) => setLeaveRequest(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-300 mb-2">Reason</label>
                <textarea
                  value={leaveRequest.reason}
                  onChange={(e) => setLeaveRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                />
              </div>
              {leaveError && (
                <p className="text-red-500 text-sm">{leaveError}</p>
              )}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;