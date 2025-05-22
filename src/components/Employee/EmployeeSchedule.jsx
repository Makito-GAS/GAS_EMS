import React, { useState } from 'react';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaPlus } from 'react-icons/fa';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const EmployeeSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState({
    '2024-03-18': [
      { time: '9:00 AM', title: 'Team Standup', description: 'Daily team meeting' },
      { time: '11:00 AM', title: 'Project Review', description: 'Review project progress' },
      { time: '2:00 PM', title: 'Client Meeting', description: 'Discuss project requirements' }
    ],
    '2024-03-19': [
      { time: '10:00 AM', title: 'Training Session', description: 'New technology training' },
      { time: '1:00 PM', title: 'Code Review', description: 'Review team code changes' }
    ],
    '2024-03-20': [
      { time: '9:30 AM', title: 'Sprint Planning', description: 'Plan next sprint tasks' },
      { time: '3:00 PM', title: 'Team Building', description: 'Team building activities' }
    ]
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    time: '',
    title: '',
    description: ''
  });

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddSchedule = () => {
    const dateStr = formatDate(selectedDate);
    setSchedules(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newSchedule]
    }));
    setNewSchedule({ time: '', title: '', description: '' });
    setShowAddModal(false);
  };

  const tileClassName = ({ date }) => {
    const dateStr = formatDate(date);
    return schedules[dateStr] ? 'has-schedule' : null;
  };

  return (
    <div className="flex">
      <Sidebar>
        <SidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text="Dashboard"
          path="/employee/dashboard"
        />
        <SidebarItem 
          icon={<FaTasks className="w-6 h-6" />}
          text="My Tasks"
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

      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaPlus className="mr-2" />
            Add Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full border-none"
            />
          </div>

          {/* Schedule List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Schedule for {selectedDate.toLocaleDateString()}
            </h2>
            <div className="space-y-4">
              {schedules[formatDate(selectedDate)]?.map((schedule, index) => (
                <div key={index} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{schedule.title}</h3>
                      <p className="text-gray-600">{schedule.description}</p>
                    </div>
                    <span className="text-blue-600 font-medium">{schedule.time}</span>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500">No schedules for this date</p>
              )}
            </div>
          </div>
        </div>

        {/* Add Schedule Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Schedule</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter schedule title"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter schedule description"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Schedule
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

export default EmployeeSchedule; 