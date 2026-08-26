import React, { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/customer')) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;