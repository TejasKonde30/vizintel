import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, identity } = useSelector((state) => state.auth);

  return isAuthenticated && identity ? children : <Navigate to="/Adminlogin" replace />;
};

export default AdminProtectedRoute;
