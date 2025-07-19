import React, { useState } from 'react';

const onboardingTasks = [
  { id: 1, text: 'Complete your employee profile' },
  { id: 2, text: 'Sign the employment contract' },
  { id: 3, text: 'Upload required documents (ID, etc.)' },
  { id: 4, text: 'Set up your work email' },
  { id: 5, text: 'Review the company handbook' },
  { id: 6, text: 'Meet your manager' },
];

const OnboardingChecklist = () => {
  const [tasks, setTasks] = useState(
    onboardingTasks.map(task => ({ ...task, completed: false }))
  );

  const handleToggle = id => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Onboarding Checklist</h2>
      <ul className="space-y-3">
        {tasks.map(task => (
          <li key={task.id} className="flex items-center">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleToggle(task.id)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span
              className={`ml-3 text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnboardingChecklist;
