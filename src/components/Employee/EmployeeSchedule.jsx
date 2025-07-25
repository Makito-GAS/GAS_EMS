import React, { useState, useEffect } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../../supabase-client';

const EmployeeSchedule = () => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    date: '',
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

      const formattedEvents = data.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        start: `${schedule.date}T${schedule.time}`,
        extendedProps: {
          description: schedule.description
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info) => {
    setNewSchedule(prev => ({ ...prev, date: info.dateStr }));
    setShowAddModal(true);
  };

  const handleAddSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([
          {
            member_id: session?.user?.id,
            date: newSchedule.date,
            time: newSchedule.time,
            title: newSchedule.title,
            description: newSchedule.description
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh the calendar data after adding a new schedule
      await fetchSchedules();

      setNewSchedule({ date: '', time: '', title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
    }
  };

  const handleEventClick = async (info) => {
    const eventId = info.event.id;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('mySchedule')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('manageYourSchedule')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
        >
          <FaCalendarAlt className="mr-2" />
          {t('addSchedule')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          height="auto"
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
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
  );
};

export default EmployeeSchedule;