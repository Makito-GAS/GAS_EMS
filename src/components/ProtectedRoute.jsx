import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { session, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, store the current path and redirect to login
  if (!session) {
    // Store the current path in localStorage
    localStorage.setItem('redirectPath', location.pathname);
    toast.error('Please login to access this page');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If no roles are specified, allow access to any authenticated user
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has the required role
  const hasRequiredRole = allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    toast.error('You do not have permission to access this page');
    // Redirect to appropriate dashboard based on role
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute; 