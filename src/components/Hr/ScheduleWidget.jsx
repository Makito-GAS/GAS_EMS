import React from 'react';

const ScheduleWidget = ({ date, events }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-gray-700">Schedule</span>
      <button className="text-xs text-gray-400">See All</button>
    </div>
    <div className="flex items-center justify-between mb-4">
      <button className="text-xs text-gray-400">{'<'}</button>
      <span className="text-sm font-semibold">{date}</span>
      <button className="text-xs text-gray-400">{'>'}</button>
    </div>
    <div className="space-y-4">
      {events.map((e, i) => (
        <div key={i}>
          <div className="text-xs text-gray-400">{e.time}</div>
          <div className="font-medium">{e.title}</div>
          {e.person && <div className="text-xs text-gray-500">{e.person}</div>}
        </div>
      ))}
    </div>
  </div>
);

export default ScheduleWidget; 