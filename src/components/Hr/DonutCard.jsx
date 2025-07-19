import React from 'react';

const DonutCard = ({ value, label, legend = [] }) => (
  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
    <span className="font-semibold text-gray-700 mb-2">{label}</span>
    <div className="relative flex items-center justify-center mb-2">
      {/* Donut Placeholder */}
      <div className="w-20 h-20 rounded-full border-8 border-orange-400 border-t-green-400" style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}></div>
      <span className="absolute text-xl font-bold">{value}</span>
    </div>
    <div className="flex flex-col items-center text-xs text-gray-500">
      {legend.map((item, i) => (
        <span key={i}><span className={`font-bold`} style={{color: item.color}}>{item.value}</span> {item.text}</span>
      ))}
    </div>
  </div>
);

export default DonutCard; 