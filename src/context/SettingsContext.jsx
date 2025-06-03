import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      density: 'comfortable',
      colorScheme: 'default',
      sidebarPosition: 'left',
      sidebarCollapsed: false,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      taskReminders: true,
      leaveRequestAlerts: true,
      systemUpdates: true,
    },
    display: {
      showAvatars: true,
      showStatusIndicators: true,
      showQuickActions: true,
      showRecentActivity: true,
      showStatistics: true,
    },
    language: localStorage.getItem('language') || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Keep the current language from localStorage
      parsedSettings.language = localStorage.getItem('language') || 'en';
      setSettings(parsedSettings);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.appearance.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.appearance.theme]);

  // Apply font size changes
  useEffect(() => {
    const root = window.document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.fontSize = sizes[settings.appearance.fontSize];
  }, [settings.appearance.fontSize]);

  // Apply density changes
  useEffect(() => {
    const root = window.document.documentElement;
    const densities = {
      comfortable: '1.5rem',
      compact: '1rem',
      spacious: '2rem',
    };
    root.style.setProperty('--spacing-unit', densities[settings.appearance.density]);
  }, [settings.appearance.density]);

  const updateSettings = (section, key, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
      localStorage.setItem('adminSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const toggleSetting = (section, key) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: !prev[section][key]
        }
      };
      localStorage.setItem('adminSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        density: 'comfortable',
        colorScheme: 'default',
        sidebarPosition: 'left',
        sidebarCollapsed: false,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        leaveRequestAlerts: true,
        systemUpdates: true,
      },
      display: {
        showAvatars: true,
        showStatusIndicators: true,
        showQuickActions: true,
        showRecentActivity: true,
        showStatistics: true,
      },
      language: localStorage.getItem('language') || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };
    setSettings(defaultSettings);
    localStorage.setItem('adminSettings', JSON.stringify(defaultSettings));
    toast.success('Settings reset to default');
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 