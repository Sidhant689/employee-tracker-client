// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  // Show nothing while checking authentication
  if (loading) return null;
  
  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // Check role authorization if roles specified
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;