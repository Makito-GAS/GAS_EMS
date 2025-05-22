import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { FaUsers, FaTasks, FaChartLine, FaCalendarAlt } from 'react-icons/fa'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useLanguage } from '../../context/LanguageContext'
import AdminSidebar, { AdminSidebarItem } from './AdminSidebar'
import { FaHome, FaUserPlus, FaChartBar, FaCog } from 'react-icons/fa'

const AdminDashboard = () => {
  const {session, signOut} = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Sample data for charts
  const employeeStats = [
    { name: 'Jan', total: 40, active: 35 },
    { name: 'Feb', total: 45, active: 40 },
    { name: 'Mar', total: 50, active: 45 },
    { name: 'Apr', total: 55, active: 50 },
    { name: 'May', total: 60, active: 55 },
    { name: 'Jun', total: 65, active: 60 },
  ];

  const performanceData = [
    { name: 'Mon', attendance: 95, productivity: 88 },
    { name: 'Tue', attendance: 92, productivity: 85 },
    { name: 'Wed', attendance: 90, productivity: 90 },
    { name: 'Thu', attendance: 88, productivity: 87 },
    { name: 'Fri', attendance: 85, productivity: 92 },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar>
        <AdminSidebarItem 
          icon={<FaHome className="w-6 h-6" />}
          text="Dashboard"
          path="/admin/dashboard"
        />
        <AdminSidebarItem 
          icon={<FaUsers className="w-6 h-6" />}
          text="Manage Employees"
          path="/admin/employees"
        />
        <AdminSidebarItem 
          icon={<FaUserPlus className="w-6 h-6" />}
          text="Add Employee"
          path="/admin/add-employee"
        />
        <AdminSidebarItem 
          icon={<FaChartBar className="w-6 h-6" />}
          text="Reports"
          path="/admin/reports"
        />
        <AdminSidebarItem 
          icon={<FaCog className="w-6 h-6" />}
          text="Settings"
          path="/admin/settings"
        />
      </AdminSidebar>

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.email?.split('@')[0] || 'Admin'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Employees</h3>
            <p className="text-3xl font-bold text-blue-600">65</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-green-600">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Tasks</h3>
            <p className="text-3xl font-bold text-orange-600">24</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Employee Growth</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={employeeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="active" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Weekly Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#8884d8" />
                  <Bar dataKey="productivity" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">New employee joined</p>
                <p className="text-sm text-gray-600">John Doe joined the team</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Project completed</p>
                <p className="text-sm text-gray-600">Website redesign project finished</p>
              </div>
              <span className="text-sm text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Task assigned</p>
                <p className="text-sm text-gray-600">New task assigned to Sarah Smith</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard;