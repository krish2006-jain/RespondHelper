import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const getRoleDashboardPath = (role) => {
  if (!role) return '/login';
  if (role === 'resource_provider') return '/ngo';
  return `/${role}`;
};

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-muted text-sm">
        Verifying permissions...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins can access everything
  if (user.role === 'admin') {
    return <Outlet />;
  }

  // Resource Providers share the NGO interface
  if (user.role === 'resource_provider' && allowedRoles.includes('ngo')) {
    return <Outlet />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const fallbackPath = getRoleDashboardPath(user.role);
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};

