import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h2>Profile Not Configured</h2>
        <p>Your user account exists, but no profile was found in the system. Please contact the administrator.</p>
      </div>
    );
  }

  if (profile?.is_active === false) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h2>Account Inactive</h2>
        <p>Your staff account is currently inactive. Please contact the administrator.</p>
      </div>
    );
  }

  if (requireRole && profile?.role !== requireRole) {
    // If an admin or non-staff user tries to access staff routes, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};
