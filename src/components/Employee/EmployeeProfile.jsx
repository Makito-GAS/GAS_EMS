import React, { useState, useEffect } from 'react';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';
import { FaHome, FaTasks, FaCalendarAlt, FaUser, FaCog, FaEdit, FaSave } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const EmployeeProfile = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: session?.user?.user_metadata?.name || 'User',
    position: 'Software Developer',
    email: session?.user?.email || '',
    phone: '+1 234 567 890',
    department: 'Engineering',
    employeeId: 'EMP001',
    skills: ['React', 'JavaScript', 'Node.js', 'TypeScript']
  });

  // Update profile data when session changes
  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.user_metadata?.name || 'User',
        email: session.user.email || ''
      }));
    }
  }, [session]);

  const [newSkill, setNewSkill] = useState('');

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

  const handleSave = () => {
    // Here you would typically make an API call to save the updated profile
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  return (
    <div className="flex">
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
          <h1 className="text-2xl font-bold">{t('myProfile')}</h1>
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
        
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <FaUser className="w-12 h-12 text-gray-400" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder={t('fullName')}
                    />
                    <input
                      type="text"
                      name="position"
                      value={profileData.position}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder={t('position')}
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold">{profileData.name}</h2>
                    <p className="text-gray-600">{profileData.position}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">{t('personalInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">{t('email')}</p>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{profileData.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">{t('phone')}</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{profileData.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">{t('department')}</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={profileData.department}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{profileData.department}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">{t('employeeId')}</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="employeeId"
                      value={profileData.employeeId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{profileData.employeeId}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
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
                    className="flex-1 p-2 border rounded"
                    placeholder="Add new skill"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile; 