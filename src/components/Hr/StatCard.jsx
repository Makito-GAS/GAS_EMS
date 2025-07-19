import React from 'react';

const StatCard = ({ label, value, trend, trendColor = 'text-gray-500', children }) => (
  <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-gray-700">{label}</span>
      {trend && <span className={`text-xs ${trendColor}`}>{trend}</span>}
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <div className="h-16 flex items-center justify-center">
      {children}
    </div>
  </div>
);

export default StatCard; 