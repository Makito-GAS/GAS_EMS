import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../../supabase-client';

const WeeklyReportForm = ({ onClose, onSuccess }) => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState({
    task_status: 'On Track',
    full_name: '',
    department: '',
    weekly_accomplishments: '',
    has_problems: false,
    problems_description: '',
    next_week_deliverables: '',
    needs_help: false,
    help_description: '',
    planned_hours: '',
    actual_hours: '',
    additional_notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Validate required fields
      if (!weeklyReport.full_name || !weeklyReport.department || !weeklyReport.weekly_accomplishments) {
        setError('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('weekly_reports')
        .insert([
          {
            member_id: session.user.id,
            ...weeklyReport
          }
        ]);

      if (error) throw error;

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting weekly report:', error);
      setError('Failed to submit weekly report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Weekly Report</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              🟢 Overall status of your OKR (Objectives and Key Results) for this quarter *
            </label>
            <select
              value={weeklyReport.task_status}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, task_status: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Full Name & Surname *</label>
            <input
              type="text"
              value={weeklyReport.full_name}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, full_name: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Department *</label>
            <select
              value={weeklyReport.department}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, department: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select Department</option>
              <option value="Administration">Administration</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Designer">Designer</option>
              <option value="Developer">Developer</option>
              <option value="Human Resource">Human Resource</option>
              <option value="Training">Training</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">📌 What have you done this week? *</label>
            <textarea
              value={weeklyReport.weekly_accomplishments}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, weekly_accomplishments: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="4"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">⚠ Did you encounter any problems this week? *</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={weeklyReport.has_problems}
                  onChange={() => setWeeklyReport({ ...weeklyReport, has_problems: true })}
                  className="form-radio"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={!weeklyReport.has_problems}
                  onChange={() => setWeeklyReport({ ...weeklyReport, has_problems: false })}
                  className="form-radio"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>

          {weeklyReport.has_problems && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">🧩 If yes, what was the nature of the problem?</label>
              <textarea
                value={weeklyReport.problems_description}
                onChange={(e) => setWeeklyReport({ ...weeklyReport, problems_description: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              ></textarea>
            </div>
          )}

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">📆 What are your deliverables for next week? *</label>
            <textarea
              value={weeklyReport.next_week_deliverables}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, next_week_deliverables: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">🤝 Do you need any help? *</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={weeklyReport.needs_help}
                  onChange={() => setWeeklyReport({ ...weeklyReport, needs_help: true })}
                  className="form-radio"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={!weeklyReport.needs_help}
                  onChange={() => setWeeklyReport({ ...weeklyReport, needs_help: false })}
                  className="form-radio"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>

          {weeklyReport.needs_help && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">🛠 If yes, please describe the kind of help you need</label>
              <textarea
                value={weeklyReport.help_description}
                onChange={(e) => setWeeklyReport({ ...weeklyReport, help_description: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              ></textarea>
            </div>
          )}

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">⏳ Planned hours worked *</label>
            <input
              type="number"
              value={weeklyReport.planned_hours}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, planned_hours: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="0"
              max="168"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">⌚ Actual hours worked *</label>
            <input
              type="number"
              value={weeklyReport.actual_hours}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, actual_hours: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              min="0"
              max="168"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              🗣 Anything you think I need to know?
              <span className="text-sm text-gray-500">For example: new ideas, team successes, feedback on processes, etc</span>
            </label>
            <textarea
              value={weeklyReport.additional_notes}
              onChange={(e) => setWeeklyReport({ ...weeklyReport, additional_notes: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeeklyReportForm; 