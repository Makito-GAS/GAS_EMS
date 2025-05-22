import React, { useState } from 'react';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaPlus, FaTrash } from 'react-icons/fa';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { useLanguage } from '../../context/LanguageContext';

const EmployeeTasks = () => {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending',
    progress: 0
  });

  const handleAddTask = () => {
    setTasks([...tasks, { ...newTask, id: Date.now() }]);
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending',
      progress: 0
    });
    setShowModal(false);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleProgressChange = (taskId, newProgress) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const status = newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'pending';
        return { ...task, progress: newProgress, status };
      }
      return task;
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
      </Sidebar>

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('tasks')}</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            {t('addTask')}
          </button>
        </div>

        <div className="grid gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{task.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
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
                  <p className="text-gray-800 dark:text-white">{task.dueDate}</p>
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
          ))}
        </div>
      </div>

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
                  <option value="high">{t('high')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="low">{t('low')}</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('addTask')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks; 