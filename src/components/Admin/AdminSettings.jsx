import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar';
import { FaHome, FaUsers, FaUserPlus, FaChartBar, FaCog, FaBell, FaMoon, FaSun, FaLanguage, FaDesktop, FaTabletAlt, FaMobile, FaFont, FaPalette, FaUndo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
  const { session } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings, toggleSetting, resetSettings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.appearance.theme === 'dark');

  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleAppearanceChange = (setting, value) => {
    updateSettings('appearance', setting, value);
    if (setting === 'theme') {
      setDarkMode(value === 'dark');
      document.documentElement.classList.toggle('dark', value === 'dark');
      localStorage.setItem('theme', value);
    }
    toast.success(t('appearanceSettingsUpdated'));
  };

  const handleNotificationChange = (setting) => {
    toggleSetting('notifications', setting);
    toast.success(t('notificationSettingsUpdated'));
  };

  const handleDisplayChange = (setting) => {
    toggleSetting('display', setting);
    toast.success(t('displaySettingsUpdated'));
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    // Update the language context first
    setLanguage(newLanguage);
    // Then update the settings
    updateSettings('language', 'language', newLanguage);
    toast.success(t('languageSettingsUpdated'));
  };

  const handleDateFormatChange = (e) => {
    updateSettings('dateFormat', 'dateFormat', e.target.value);
    toast.success(t('dateFormatUpdated'));
  };

  const handleTimeFormatChange = (e) => {
    updateSettings('timeFormat', 'timeFormat', e.target.value);
    toast.success(t('timeFormatUpdated'));
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar>
        <AdminSidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text={t('dashboard')}
          path="/admin/dashboard"
        />
        <AdminSidebarItem 
          icon={<FaUsers className="w-6 h-6" />}
          text={t('manageEmployees')}
          path="/admin/employees"
        />
        <AdminSidebarItem 
          icon={<FaUserPlus className="w-6 h-6" />}
          text={t('addEmployee')}
          path="/admin/add-employee"
        />
        <AdminSidebarItem 
          icon={<FaChartBar className="w-6 h-6" />}
          text={t('reports')}
          path="/admin/reports"
        />
        <AdminSidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text={t('settings')}
          path="/admin/settings"
        />
      </AdminSidebar>

      <div className="ml-64 p-6 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('settings')}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">{t('customizeAdminExperience')}</p>
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
                onClick={() => handleAppearanceChange('theme', darkMode ? 'light' : 'dark')}
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
                    {settings.notifications.enabled ? t('enabled') : t('disabled')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
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
                <option value="en">{t('english')}</option>
                <option value="es">{t('spanish')}</option>
                <option value="fr">{t('french')}</option>
                <option value="de">{t('german')}</option>
                <option value="af">{t('afrikaans')}</option>
              </select>
            </div>
          </div>

          {/* Display Settings */}
          <div className="card rounded-lg p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaDesktop className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('display')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t('customizeDisplaySettings')}</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDisplayChange('compactMode')}
                  className={`px-3 py-1 rounded ${
                    settings.display.compactMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t('compact')}
                </button>
                <button
                  onClick={() => handleDisplayChange('showSidebar')}
                  className={`px-3 py-1 rounded ${
                    settings.display.showSidebar
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t('sidebar')}
                </button>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="card rounded-lg p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaUndo className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('resetSettings')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t('restoreDefaultSettings')}</p>
                </div>
              </div>
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('reset')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 