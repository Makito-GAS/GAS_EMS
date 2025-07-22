import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [expanded, setExpanded] = useState(true);
  const sidebarWidth = expanded ? 'w-64' : 'w-20';
  const mainMargin = expanded ? 'ml-64' : 'ml-20';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar expanded={expanded} setExpanded={setExpanded} />
      <div className={`transition-all duration-300 flex-1 p-4 sm:p-8 ${mainMargin}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 