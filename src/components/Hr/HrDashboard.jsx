import React from 'react';
import { FaSearch } from 'react-icons/fa';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import DonutCard from './DonutCard';
import MemberList from './MemberList';
import ScheduleWidget from './ScheduleWidget';

const mockMembers = [
  { name: 'Theo Lawrence', email: 'theo.lawrence@gmail.com', type: 'Fulltime', department: 'Product Design', status: 'Absent', date: '12 Oct 2025', avatar: '/src/data/avatar.jpg' },
  { name: 'Anita Elizabeth', email: 'elizabethanita@gmail.com', type: 'Freelance', department: 'Development', status: 'Invited', date: '6 Nov 2025', avatar: '/src/data/avatar2.jpg' },
];

const donutLegend = [
  { color: '#fb923c', value: 206, text: 'Fulltime' },
  { color: '#22c55e', value: 48, text: 'Remote' },
  { color: '#fb923c', value: '+2', text: 'Intern' },
  { color: '#22c55e', value: '+3', text: 'Onboarding' },
];

const scheduleEvents = [
  { time: '10:45 AM - 11:30 AM', title: 'Call with Alex Shotay - UX Design...', person: 'Theo Lawrence' },
  { time: '01:30 PM - 02:30 PM', title: 'Interview with Project Manager', person: 'Alex Shotay' },
  { time: '03:00 PM - 04:00 PM', title: 'Interview with UX Designer', person: 'Jun Lee' },
  { time: '04:30 PM - 05:00 PM', title: 'Kick Off - Mobile App Project' },
];

const HrDashboard = () => {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow border">
          <FaSearch className="text-gray-400" />
          <input className="outline-none bg-transparent ml-2" placeholder="Search" />
        </div>
      </div>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Top Row: Avg Work Hours + Member Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avg Work Hours Chart */}
            <div className="col-span-2">
              <ChartCard title="Avg. Work Hours" subtitle="8 Nov 2024 - 14 Nov 2024 | Last 7 days">
                <span className="text-gray-300">[Line Chart]</span>
              </ChartCard>
            </div>
            {/* Member Type Donut */}
            <DonutCard value={254} label="Member Type" legend={donutLegend} />
          </div>
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard label="Total Payroll" value="$34,428.50" trend="▼ 24% vs Last Week" trendColor="text-red-500">
              <span className="text-gray-300">[Bar Chart]</span>
            </StatCard>
            <StatCard label="Job Applicant" value="12,845" trend="▲ 15% vs Last Week" trendColor="text-green-500">
              <span className="text-gray-300">[Bar Chart]</span>
            </StatCard>
          </div>
          {/* List of Members Table */}
          <MemberList members={mockMembers} />
        </div>
        {/* Right Column: Schedule */}
        <div className="flex flex-col gap-6">
          <ScheduleWidget date="10 Nov 2025" events={scheduleEvents} />
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
