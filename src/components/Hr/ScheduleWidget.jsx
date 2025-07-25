import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import supabase from '../../../supabase-client';
import { useAuth } from '../../context/AuthContext'; // Import the useAuth hook

const ScheduleWidget = () => {
  const { session } = useAuth(); // Access the session object

  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ date: '', time: '', title: '', description: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from('schedules').select('*');
      if (error) throw error;

      const formattedEvents = data.map((event) => {
        const date = event.date || '';
        const time = event.time || '00:00'; // Default to midnight if time is missing

        return {
          id: event.id,
          title: event.title,
          start: `${date}T${time}`,
          extendedProps: {
            description: event.description
          }
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleDateClick = (info) => {
    setNewEvent(prev => ({ ...prev, date: info.dateStr }));
    setShowAddModal(true);
  };

  const handleAddEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([
          {
            member_id: session?.user?.id, // Ensure this matches the authenticated user's ID
            date: newEvent.date,
            time: newEvent.time,
            title: newEvent.title,
            description: newEvent.description
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => ([
        ...prev,
        {
          id: data.id,
          title: data.title,
          start: `${data.date}T${data.time}`,
          extendedProps: {
            description: data.description
          }
        }
    ]));

      setNewEvent({ date: '', time: '', title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleEventClick = async (info) => {
    const eventId = info.event.id;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', eventId);
      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div className="p-3 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="font-bold text-blue-600 text-lg mb-1">{eventInfo.event.title}</div>
        <div className="text-gray-700 text-sm mb-1">{eventInfo.event.extendedProps.description}</div>
        <div className="text-gray-500 text-xs">{eventInfo.timeText}</div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventContent} // Use custom event rendering
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        height="auto"
      />

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;