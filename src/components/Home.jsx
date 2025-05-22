import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar/Sidebar'
import { FaBox, FaBuilding, FaChartBar, FaUser, FaTasks, FaCog, FaBell, FaQuestionCircle } from 'react-icons/fa'
import { SidebarItem } from './Sidebar/Sidebar'
import AdminDashboard from './Admin/AdminDashboard'

const Home = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  React.useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, navigate]);

  return (
    <div>
      <main className='grid gap-4 p-4 grid-cols-[220px_1fr]'>
        <Sidebar>
          <SidebarItem text="Dashboard" icon={<FaBox />} path="/home" />
          <SidebarItem text="Employees" icon={<FaUser />} path="/employeeList" alert />
          <SidebarItem text="Create User" icon={<FaUser />} path="/createUser" alert />
          <SidebarItem text="Create Member" icon={<FaUser />} path="/createMember" alert />
          <SidebarItem text="Tasks" icon={<FaTasks />} path="/tasks" alert />
          <SidebarItem text="Departments" icon={<FaBuilding />} path="/departments" alert />
          <hr className='my-3'/>
          <SidebarItem text="Settings" icon={<FaCog />} path="/settings" />
          <SidebarItem text="Notifications" icon={<FaBell />} path="/notifications" alert />
          <SidebarItem text="Help" icon={<FaQuestionCircle />} path="/help" />
        </Sidebar>
        
        <AdminDashboard />
      </main>
    </div>
  )
}

export default Home