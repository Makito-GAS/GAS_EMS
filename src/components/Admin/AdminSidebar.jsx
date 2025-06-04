import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedLogo from '../Sidebar/AnimatedLogo';
import { FaChevronRight, FaChevronLeft, FaSignOutAlt, FaUsers, FaUserPlus, FaChartBar, FaCog, FaHome, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { useNavigate, NavLink } from 'react-router-dom';

const AdminSidebar = ({ children }) => {
  const { session, signOut } = useAuth();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('theme');
      navigate('/');
    } catch(error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <aside className="fixed top-0 left-0 h-full  bg-gray-800 shadow-lg z-50">
      <nav className={`h-full flex flex-col ${expanded ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out`}>
        <div className="p-4 pb-2 flex justify-between items-center">
          <AnimatedLogo isVisible={expanded} />
          <button 
            className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            onClick={toggleSidebar}
          >
            {expanded ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <ul className="flex-1 px-3 space-y-1">
          {React.Children.map(children, child => 
            React.cloneElement(child, { expanded })
          )}
        </ul>

        {/* User details */}
        <div className="border-t border-gray-700 flex p-3">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
            {session?.user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className={`flex justify-between items-center overflow-hidden transition-all duration-300 ${expanded ? "w-52 ml-3" : "w-0"}`}>
            <div className="leading-4">
              <h4 className="font-semibold text-white">{session?.user?.email?.split('@')[0] || 'Admin'}</h4>
              <span className="text-xs text-gray-400">{session?.user?.email || 'admin@example.com'}</span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="border-t border-gray-700 p-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
          >
            <FaSignOutAlt className="w-5 h-5" />
            {expanded && <span className="ml-3">{t('signOut')}</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export const AdminSidebarItem = ({ icon, text, path, expanded = true, onClick }) => {
  const { t } = useLanguage();
  const isActive = window.location.pathname === path;

  return (
    <li>
      {path ? (
        <NavLink
          to={path}
          className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors ${
            isActive ? 'bg-gray-700' : ''
          }`}
        >
          <span className="flex-shrink-0">{icon}</span>
          {expanded && <span className="ml-3">{text}</span>}
        </NavLink>
      ) : (
        <button
          onClick={onClick}
          className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <span className="flex-shrink-0">{icon}</span>
          {expanded && <span className="ml-3">{text}</span>}
        </button>
      )}
    </li>
  );
};

export default AdminSidebar; 