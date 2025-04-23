import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux";

import Navbar from "./components/NavbarH";
import AdminNavbar from "./components/AdminNavbar";

import MainSection from "./components/MainSection";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import FileUploadPage from "./components/FileUploadPage";
import ManualDataEntryPage from "./components/ManualDataEntryPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Contact from "./components/Contact";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminProtectedRoute from "./AdminProtectedRoute";
import ManageUsers from "./components/ManageUsers";
import UserSearch from "./components/UserSearch";
import UserUploads from "./components/UserUploads";
import About from "./components/About";

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, identity } = useSelector((state) => state.auth);

  const hideNavbarRoutes = [
    "/admindashboard",
    "/usersearch",
    "/manageusers",
    "/useruploads",
    "/adminlogin",
  ];

  const currentPath = location.pathname.toLowerCase();
  const hideNavbar = hideNavbarRoutes.includes(currentPath);

  const showAdminNavbar = isAuthenticated && identity === 1;

  return (
    <>
      {!hideNavbar && (showAdminNavbar ? <AdminNavbar /> : <Navbar />)}

      <Routes>
        <Route path="/" element={<MainSection />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/file-upload" element={<ProtectedRoute><FileUploadPage /></ProtectedRoute>} />
        <Route path="/manual-data-entry" element={<ProtectedRoute><ManualDataEntryPage /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />

        {/* Admin Routes */}
        <Route path="/admindashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/usersearch" element={<AdminProtectedRoute><UserSearch /></AdminProtectedRoute>} />
        <Route path="/manageusers" element={<AdminProtectedRoute><ManageUsers /></AdminProtectedRoute>} />
        <Route path="/useruploads" element={<AdminProtectedRoute><UserUploads /></AdminProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<div>404: Page Not Found</div>} />
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
