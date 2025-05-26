import React, { useState, useEffect } from 'react';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../../supabase-client';

const EmployeeTasks = () => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    project: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending',
    progress: 0,
    assigned_to: ''
  });
  const [dailyReport, setDailyReport] = useState({
    task_status: 'On Track',
    full_name: '',
    department: '',
    accomplishments: '',
    has_roadblocks: false,
    roadblocks_description: '',
    needs_help: false,
    help_description: '',
    additional_notes: ''
  });

  // Fetch tasks and employees when component mounts
  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`created_by.eq.${session.user.id},assigned_to.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks');
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('member')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddTask = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!newTask.title || !newTask.project || !newTask.dueDate) {
        setError('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            project: newTask.project,
            description: newTask.description,
            due_date: newTask.dueDate,
            priority: newTask.priority,
            status: newTask.status,
            progress: newTask.progress,
            created_by: session.user.id,
            assigned_to: newTask.assigned_to || null
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        return;
      }

      // Refresh tasks after adding new task
      await fetchTasks();
      
      setNewTask({
        title: '',
        project: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
        progress: 0,
        assigned_to: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
        return;
      }

      // Refresh tasks after deletion
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleProgressChange = async (taskId, newProgress) => {
    try {
      const status = newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'pending';
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          progress: newProgress,
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task progress');
        return;
      }

      // Refresh tasks after update
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task progress');
    }
  };

  const handleSubmitReport = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!dailyReport.full_name || !dailyReport.department || !dailyReport.accomplishments) {
        setError('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('daily_reports')
        .insert([
          {
            member_id: session.user.id,
            ...dailyReport
          }
        ]);

      if (error) throw error;

      setShowReportModal(false);
      setDailyReport({
        task_status: 'On Track',
        full_name: '',
        department: '',
        accomplishments: '',
        has_roadblocks: false,
        roadblocks_description: '',
        needs_help: false,
        help_description: '',
        additional_notes: ''
      });
    } catch (error) {
      console.error('Error submitting daily report:', error);
      setError('Failed to submit daily report. Please try again.');
    }
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
      </Sidebar>

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('tasks')}</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FaFileAlt className="mr-2" />
              {t('submitDailyReport')}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              {t('addTask')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No tasks found. Create a new task to get started!
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Title: {task.title}</h3>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Project: {task.project}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">Description: {task.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('dueDate')}</p>
                      <p className="text-gray-800 dark:text-white">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('priority')}</p>
                      <p className={`font-medium ${
                        task.priority === 'high' ? 'text-red-600' :
                        task.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {t(task.priority)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('status')}</p>
                      <p className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-green-600' :
                        task.status === 'in-progress' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {t(task.status)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={task.progress}
                    onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Daily Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('dailyReport')}</h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitReport(); }} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">🟢 Overall status of your immediate tasks/priorities for today *</label>
                  <select
                    value={dailyReport.task_status}
                    onChange={(e) => setDailyReport({ ...dailyReport, task_status: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Full Name & Surname *</label>
                  <input
                    type="text"
                    value={dailyReport.full_name}
                    onChange={(e) => setDailyReport({ ...dailyReport, full_name: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Department *</label>
                  <select
                    value={dailyReport.department}
                    onChange={(e) => setDailyReport({ ...dailyReport, department: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Administration">Administration</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Human Resource">Human Resource</option>
                    <option value="Training">Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">📌 What have you focused on and completed today? *</label>
                  <textarea
                    value={dailyReport.accomplishments}
                    onChange={(e) => setDailyReport({ ...dailyReport, accomplishments: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    placeholder="Enter your response in text format. Focus on 2-3 key accomplishments."
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">⚠ Did you encounter any immediate roadblocks or problems today? *</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={dailyReport.has_roadblocks}
                        onChange={() => setDailyReport({ ...dailyReport, has_roadblocks: true })}
                        className="form-radio"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!dailyReport.has_roadblocks}
                        onChange={() => setDailyReport({ ...dailyReport, has_roadblocks: false })}
                        className="form-radio"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {dailyReport.has_roadblocks && (
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">🧩 If yes, what was the nature of the problem?</label>
                    <textarea
                      value={dailyReport.roadblocks_description}
                      onChange={(e) => setDailyReport({ ...dailyReport, roadblocks_description: e.target.value })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows="3"
                      placeholder="Enter your response in text format."
                    ></textarea>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">🤝 Do you need any immediate help or unblockers for tomorrow? *</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={dailyReport.needs_help}
                        onChange={() => setDailyReport({ ...dailyReport, needs_help: true })}
                        className="form-radio"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={!dailyReport.needs_help}
                        onChange={() => setDailyReport({ ...dailyReport, needs_help: false })}
                        className="form-radio"
                      />
                      <span className="ml-2">No</span>
                    </label>
                  </div>
                </div>

                {dailyReport.needs_help && (
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">🛠 If yes, please describe the kind of help you need</label>
                    <textarea
                      value={dailyReport.help_description}
                      onChange={(e) => setDailyReport({ ...dailyReport, help_description: e.target.value })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows="3"
                      placeholder="Enter your response in text format."
                    ></textarea>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">🗣 Anything quick I need to know?</label>
                  <textarea
                    value={dailyReport.additional_notes}
                    onChange={(e) => setDailyReport({ ...dailyReport, additional_notes: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    placeholder="Enter your response in text format."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {t('submitReport')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('addTask')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('taskTitle')}
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('project')}
                  </label>
                  <input
                    type="text"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('taskDescription')}
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dueDate')}
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('priority')}
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="low">{t('low')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="high">{t('high')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('assignTo')}
                  </label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">{t('selectAssignee')}</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('addTask')}
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

export default EmployeeTasks; 