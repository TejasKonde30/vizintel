import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, identity } = useSelector((state) => state.auth);

  // Only allow if the user is authenticated AND identity is 0 (regular user)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (identity !== 0) {
    return <Navigate to="/adminlogin" replace />;
  }

  return children;
};

export default ProtectedRoute;
