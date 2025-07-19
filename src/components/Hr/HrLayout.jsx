import React, { useState } from 'react';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import { FaHome, FaUser, FaUserPlus, FaMoneyCheckAlt, FaCalendarAlt, FaChartBar, FaSitemap, FaCog, FaQuestionCircle } from 'react-icons/fa';

const HrLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <span className="sr-only">Toggle sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar>
          <SidebarItem icon={<FaHome className="w-6 h-6" />} text="Dashboard" path="/hr/dashboard" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaUser className="w-6 h-6" />} text="Employee" path="/hr/employee" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaUserPlus className="w-6 h-6" />} text="Recruitment" path="/hr/recruitment" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaMoneyCheckAlt className="w-6 h-6" />} text="Payroll" path="/hr/payroll" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaCalendarAlt className="w-6 h-6" />} text="Schedule" path="/hr/schedule" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaChartBar className="w-6 h-6" />} text="Reports" path="/hr/reports" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaSitemap className="w-6 h-6" />} text="Structure" path="/hr/structure" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaCog className="w-6 h-6" />} text="Settings" path="/hr/settings" onClick={() => setMobileMenuOpen(false)} />
          <SidebarItem icon={<FaQuestionCircle className="w-6 h-6" />} text="Help" path="/hr/help" onClick={() => setMobileMenuOpen(false)} />
        </Sidebar>
      </div>
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Main content */}
      <div className="flex-1 lg:ml-64 h-screen overflow-y-auto p-4 lg:p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default HrLayout; 