import React from 'react';

const WelcomeTasks = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Welcome Aboard!</h2>
      <p className="text-gray-700 mb-4">
        We're excited to have you on the team! Here are a few things you can do to get started:
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li>Familiarize yourself with the company's mission and values.</li>
        <li>Explore the employee directory to get to know your colleagues.</li>
        <li>Check out the internal documentation for your team.</li>
        <li>Schedule a coffee chat with someone from another department.</li>
      </ul>
    </div>
  );
};

export default WelcomeTasks;
 