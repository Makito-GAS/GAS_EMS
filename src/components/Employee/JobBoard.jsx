import React from 'react';

const jobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    department: 'Engineering',
    description: 'Work on modern React applications and UI/UX improvements.'
  },
  {
    id: 2,
    title: 'HR Assistant',
    department: 'Human Resources',
    description: 'Assist with onboarding, employee relations, and HR projects.'
  },
  {
    id: 3,
    title: 'Marketing Specialist',
    department: 'Marketing',
    description: 'Develop and execute marketing campaigns and strategies.'
  }
];

const JobBoard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Internal Job Board</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => (
          <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{job.title}</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">{job.department}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{job.description}</p>
            </div>
            <button className="mt-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobBoard; 