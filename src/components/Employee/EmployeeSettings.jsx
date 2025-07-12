import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaMoon, FaSun, FaBell, FaLock, FaLanguage, FaSignOutAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const EmployeeSettings = () => {
  const { signOut } = useAuth();
  const { language, setLanguage: setAppLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('theme');
      navigate('/login');
    } catch(error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleLanguageChange = (e) => {
    setAppLanguage(e.target.value);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('settings')}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{t('customizeExperience')}</p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="card rounded-lg p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? (
                <FaMoon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <FaSun className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('theme')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {darkMode ? t('darkMode') : t('lightMode')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                darkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card rounded-lg p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaBell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('notifications')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {notifications ? t('enabled') : t('disabled')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="card rounded-lg p-6 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaLanguage className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('language')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('selectLanguage')}</p>
              </div>
            </div>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSettings; 