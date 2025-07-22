import React, { useState } from 'react';
import Sidebar, { SidebarItem } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaFileUpload, FaBars, FaTimes, FaProjectDiagram, FaBriefcase } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const EmployeeLayout = () => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          {mobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - hidden on mobile by default, shown when mobileMenuOpen is true */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar>
          <SidebarItem 
            icon={<FaHome className="w-6 h-6" />}
            text={t('dashboard')}
            path="/employee/dashboard"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem 
            icon={<FaTasks className="w-6 h-6" />}
            text={t('tasks')}
            path="/employee/tasks"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem 
            icon={<FaCalendarAlt className="w-6 h-6" />}
            text={t('schedule')}
            path="/employee/schedule"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem 
            icon={<FaUser className="w-6 h-6" />}
            text={t('profile')}
            path="/employee/profile"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem 
            icon={<FaCog className="w-6 h-6" />}
            text={t('settings')}
            path="/employee/settings"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarItem 
            icon={<FaFileUpload className="w-6 h-6" />}
            text="Submit Documents"
            path="/employee/submit-documents"
            onClick={() => setMobileMenuOpen(false)}
          />

              <SidebarItem 
              icon={<FaProjectDiagram className="w-6 h-6" />}
              text={t('projects')}
              path="/employee/eprojects"
              onClick={() => setMobileMenuOpen(false)}
            />
            <SidebarItem 
              icon={<FaBriefcase className="w-6 h-6" />}
              text={t('jobBoard')}
              path="/employee/job-board"
              onClick={() => setMobileMenuOpen(false)}
            />
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
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeLayout; 