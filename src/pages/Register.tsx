
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// This is a simple redirect component to handle the "/register" route
// It redirects to the "/signup" page which already exists
const Register: React.FC = () => {
  return <Navigate to="/signup" replace />;
};

export default Register;
