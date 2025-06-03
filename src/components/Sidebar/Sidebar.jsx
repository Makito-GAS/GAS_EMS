import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedLogo from './AnimatedLogo';
import { FaChevronRight, FaChevronLeft, FaSignOutAlt, FaEllipsisV, FaComments } from 'react-icons/fa';
import { useNavigate, NavLink } from 'react-router-dom';

export const SidebarItem = ({ icon, text, path, onClick }) => {
  const { expanded } = React.useContext(SidebarContext);

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
      >
        {icon}
        {expanded && <span className="ml-3">{text}</span>}
      </button>
    );
  }

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg ${
          isActive ? 'bg-gray-700 text-white' : ''
        }`
      }
    >
      {icon}
      {expanded && <span className="ml-3">{text}</span>}
    </NavLink>
  );
};

// Create a context for the sidebar state
const SidebarContext = React.createContext();

const Sidebar = ({ children }) => {
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

  return (
    <SidebarContext.Provider value={{ expanded }}>
      <aside className="fixed h-screen bg-gray-800">
        <nav className={`h-full flex flex-col ${expanded ? 'w-64' : 'w-20'} transition-all duration-300`}>
          <div className="p-4 pb-2 flex justify-between items-center">
            <AnimatedLogo isVisible={expanded} />
            <button 
              className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => setExpanded(curr => !curr)}
            >
              {expanded ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>

          <ul className="flex-1 px-3 space-y-1">
            {children}
            <SidebarItem 
              icon={<FaComments className="w-6 h-6" />}
              text={t('chat')}
              path="/chat"
            />
          </ul>

          {/* User details */}
          <div className="border-t border-gray-700 flex p-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
              {session?.user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>
              <div className="leading-4">
                <h4 className="font-semibold text-white">{session?.user?.email?.split('@')[0] || 'Admin'}</h4>
                <span className="text-xs text-gray-400">{session?.user?.email || 'admin@example.com'}</span>
              </div>
              <FaEllipsisV className="text-gray-400" />
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
    </SidebarContext.Provider>
  );
};

export default Sidebar;
