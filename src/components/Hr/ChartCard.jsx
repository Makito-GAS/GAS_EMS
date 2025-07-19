import React from 'react';

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-lg shadow p-6 flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <span className="font-semibold text-gray-700">{title}</span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
    <div className="h-32 w-full flex items-center justify-center">
      {children}
    </div>
  </div>
);

export default ChartCard; 