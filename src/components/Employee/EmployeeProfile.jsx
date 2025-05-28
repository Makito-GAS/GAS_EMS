import React, { useState, useEffect } from 'react';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaEdit, FaSave } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../../supabase-client';

const EmployeeProfile = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    department: '',
    employeeId: '',
    skills: []
  });

  const [newSkill, setNewSkill] = useState('');

  // Fetch user profile data
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('member')
        .select(`
          *,
          permission:permission (
            role
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          name: data.name || session.user.user_metadata?.name || 'User',
          position: data.position || 'Employee',
          email: data.email || session.user.email || '',
          phone: data.phone || '',
          department: data.department || '',
          employeeId: data.employee_id || '',
          skills: data.skills || []
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill && !profileData.skills.includes(newSkill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('member')
        .update({
          name: profileData.name,
          position: profileData.position,
          phone: profileData.phone,
          department: profileData.department,
          skills: profileData.skills
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar>
          <SidebarItem 
            icon={<FaHome className="w-6 h-6" />}
            text={t('dashboard')}
            path="/employee/dashboard"
          />
          <SidebarItem 
            icon={<FaTasks className="w-6 h-6" />}
            text={t('tasks')}
            path="/employee/tasks"
          />
          <SidebarItem 
            icon={<FaCalendarAlt className="w-6 h-6" />}
            text={t('schedule')}
            path="/employee/schedule"
          />
          <SidebarItem 
            icon={<FaUser className="w-6 h-6" />}
            text={t('profile')}
            path="/employee/profile"
          />
          <SidebarItem 
            icon={<FaCog className="w-6 h-6" />}
            text={t('settings')}
            path="/employee/settings"
          />
        </Sidebar>

        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar>
        <SidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text={t('dashboard')}
          path="/employee/dashboard"
        />
        <SidebarItem 
          icon={<FaTasks className="w-6 h-6" />}
          text={t('tasks')}
          path="/employee/tasks"
        />
        <SidebarItem 
          icon={<FaCalendarAlt className="w-6 h-6" />}
          text={t('schedule')}
          path="/employee/schedule"
        />
        <SidebarItem 
          icon={<FaUser className="w-6 h-6" />}
          text={t('profile')}
          path="/employee/profile"
        />
        <SidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text={t('settings')}
          path="/employee/settings"
        />
      </Sidebar>

      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('myProfile')}</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEditing ? (
              <>
                <FaSave className="mr-2" />
                {t('saveChanges')}
              </>
            ) : (
              <>
                <FaEdit className="mr-2" />
                {t('editProfile')}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FaUser className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('fullName')}
                  />
                  <input
                    type="text"
                    name="position"
                    value={profileData.position}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('position')}
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{profileData.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{profileData.position}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t('personalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-300">{t('email')}</p>
                <p className="font-medium text-gray-800 dark:text-white">{profileData.email}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">{t('phone')}</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-white">{profileData.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">{t('department')}</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-white">{profileData.department || 'Not set'}</p>
                )}
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">{t('employeeId')}</p>
                <p className="font-medium text-gray-800 dark:text-white">{profileData.employeeId || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t('skills')}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full flex items-center">
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('addNewSkill')}
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('add')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile; 