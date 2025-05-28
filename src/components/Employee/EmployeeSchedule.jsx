import React, { useState, useEffect } from 'react';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaPlus, FaClock, FaTrash } from 'react-icons/fa';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../../supabase-client';

const EmployeeSchedule = () => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    time: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('member_id', session?.user?.id);

      if (error) throw error;

      // Group schedules by date
      const groupedSchedules = data.reduce((acc, schedule) => {
        const date = schedule.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: schedule.id,
          time: schedule.time,
          title: schedule.title,
          description: schedule.description
        });
        return acc;
      }, {});

      setSchedules(groupedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([
          {
            member_id: session?.user?.id,
            date: formatDate(selectedDate),
            time: newSchedule.time,
            title: newSchedule.title,
            description: newSchedule.description
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSchedules(prev => ({
        ...prev,
        [formatDate(selectedDate)]: [
          ...(prev[formatDate(selectedDate)] || []),
          {
            id: data.id,
            time: newSchedule.time,
            title: newSchedule.title,
            description: newSchedule.description
          }
        ]
      }));

      setNewSchedule({ time: '', title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const handleDeleteSchedule = async (dateStr, index) => {
    try {
      const scheduleToDelete = schedules[dateStr][index];
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleToDelete.id);

      if (error) throw error;

      // Update local state
      setSchedules(prev => ({
        ...prev,
        [dateStr]: prev[dateStr].filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const tileClassName = ({ date }) => {
    const dateStr = formatDate(date);
    return schedules[dateStr] ? 'has-schedule' : null;
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
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('mySchedule')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{t('manageYourSchedule')}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            <FaPlus className="mr-2" />
            {t('addSchedule')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <Calendar
                onChange={handleDateClick}
                value={selectedDate}
                tileClassName={tileClassName}
                className="w-full border-none custom-calendar"
              />
            </div>
          </div>

          {/* Schedule List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {selectedDate.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules[formatDate(selectedDate)]?.map((schedule, index) => (
                    <div 
                      key={schedule.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <FaClock className="w-5 h-5 text-blue-500 dark:text-blue-300" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {schedule.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              {schedule.description}
                            </p>
                            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <FaClock className="w-4 h-4 mr-1" />
                              {schedule.time}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(formatDate(selectedDate), index)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        {t('noSchedulesForThisDate')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Schedule Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                {t('addNewSchedule')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    {t('time')}
                  </label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    {t('title')}
                  </label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('enterScheduleTitle')}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    {t('description')}
                  </label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('enterScheduleDescription')}
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {t('addSchedule')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-calendar {
          width: 100%;
          border: none;
          background: transparent;
        }
        
        .custom-calendar .react-calendar__tile {
          padding: 1em 0.5em;
          border-radius: 0.5rem;
          margin: 0.2rem;
        }
        
        .custom-calendar .react-calendar__tile--now {
          background: #EBF5FF;
          color: #2563EB;
        }
        
        .custom-calendar .react-calendar__tile--active {
          background: #2563EB;
          color: white;
        }
        
        .custom-calendar .react-calendar__tile.has-schedule {
          position: relative;
        }
        
        .custom-calendar .react-calendar__tile.has-schedule::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #2563EB;
          border-radius: 50%;
        }
        
        .dark .custom-calendar .react-calendar__tile--now {
          background: #1E3A8A;
          color: #60A5FA;
        }
        
        .dark .custom-calendar .react-calendar__tile--active {
          background: #2563EB;
          color: white;
        }
        
        .dark .custom-calendar .react-calendar__tile.has-schedule::after {
          background: #60A5FA;
        }
      `}</style>
    </div>
  );
};

export default EmployeeSchedule; 