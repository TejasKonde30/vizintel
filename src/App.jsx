import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux";

import Navbar from "./components/NavbarH";
import MainSection from "./components/MainSection";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Contact from "./components/Contact";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ManageUsers from "./components/ManageUsers";
import UserSearch from "./components/UserSearch";

const AppContent = () => {
  const location = useLocation(); // Use useLocation to get the current route

  // Define routes where the Navbar should NOT be shown
  const hideNavbarRoutes = [
    "/dashboard", // Hide on Dashboard
    "/Admindashboard", // Hide on AdminDashboard
    "/UserSearch", // Hide on UserSearch
    "/ManageUsers", // Hide on ManageUsers
  ];

  return (
    <>
      {/* Conditionally render the Navbar */}
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<MainSection />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/Adminlogin" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        {/* Admin Routes */}
        <Route path="/Admindashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/UserSearch" element={<AdminProtectedRoute><UserSearch /></AdminProtectedRoute>} />
        <Route path="/ManageUsers" element={<AdminProtectedRoute><ManageUsers /></AdminProtectedRoute>} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <Router>
          <AppContent />
        </Router>
      </PersistGate>
    </Provider>
  );
};

export default App;