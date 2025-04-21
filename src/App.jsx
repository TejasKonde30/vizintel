import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux";

import Navbar from "./components/NavbarH";
import MainSection from "./components/MainSection";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import FileUploadPage from "./components/FileUploadPage"; // New component
import ManualDataEntryPage from "./components/ManualDataEntryPage"; // New component
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Contact from "./components/Contact";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ManageUsers from "./components/ManageUsers";
import UserSearch from "./components/UserSearch";

const AppContent = () => {
  const location = useLocation();

  // Define routes where the Navbar should NOT be shown (only admin routes)
  const hideNavbarRoutes = ["/Admindashboard", "/UserSearch", "/ManageUsers"];

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
        <Route path="/file-upload" element={<ProtectedRoute><FileUploadPage /></ProtectedRoute>} />
        <Route path="/manual-data-entry" element={<ProtectedRoute><ManualDataEntryPage /></ProtectedRoute>} />
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