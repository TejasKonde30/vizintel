import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux";
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaCog, FaBars, FaTimes } from "react-icons/fa";
import LoadingBar from "react-top-loading-bar";

const AdminNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hamburgerRef = useRef(null);
  const loadingBarRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { isAuthenticated, user, name } = useSelector((state) => state.auth) || { isAuthenticated: false, user: null, name: null };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleHamburger = () => setIsHamburgerOpen(!isHamburgerOpen);

  const closeDropdown = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  const closeHamburger = (event) => {
    if (hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
      setIsHamburgerOpen(false);
    }
  };

  useEffect(() => {
    loadingBarRef.current?.continuousStart();
    const timer = setTimeout(() => loadingBarRef.current?.complete(), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("mousedown", closeHamburger);
    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("mousedown", closeHamburger);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/adminLogin");
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <LoadingBar color="#f97316" ref={loadingBarRef} height={3} shadow={true} />
      <nav className="bg-black text-white sticky top-0 z-[100] shadow-lg border-2 border-black">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <Link to="/AdminDashboard" className="flex items-center">
            <img src="/photos/logo.png" alt="Logo" className="h-10 w-10" />
            <span className="text-orange-500 text-2xl font-bold ml-2">VIZINTEL AdminSphere</span>
          </Link>

          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="hover:text-orange-500">Home</Link>
            <Link to="/ManageUsers" className="hover:text-orange-500">Manage Users</Link>
            <Link to="/UserUploads" className="hover:text-orange-500">UserFiles</Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center text-sm bg-gray-800 rounded-full p-1 focus:ring-4 focus:ring-orange-500 hover:bg-gray-700 transition duration-300"
              >
                <FaUser className="w-6 h-6 text-orange-500" />
              </button>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-gray-700 text-white rounded-lg shadow-lg divide-y divide-gray-600 z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 py-3">
                    <span className="block text-sm font-semibold text-white">{name || "Admin"}</span>
                    <span className="block text-xs text-gray-400 truncate">{user || "admin@example.com"}</span>
                  </div>
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => {
                          navigate("/AdminDashboard");
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                      >
                        <FaTachometerAlt className="mr-2" />
                        Dashboard
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            <div className="md:hidden relative" ref={hamburgerRef}>
              <button
                onClick={toggleHamburger}
                className="p-2 text-white hover:bg-gray-700 rounded-lg transition duration-300"
              >
                {isHamburgerOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
              </button>
              {isHamburgerOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-gray-700 text-white rounded-lg shadow-lg z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ul className="py-2">
                    <li><Link to="/" className="block px-4 py-2 text-sm text-gray-200 hover:text-white transition duration-200" onClick={() => setIsHamburgerOpen(false)}>Home</Link></li>
                    <li><Link to="/ManageUsers" className="block px-4 py-2 text-sm text-gray-200 hover:text-white transition duration-200" onClick={() => setIsHamburgerOpen(false)}>Manage Users</Link></li>
                    <li><Link to="/UserSearch" className="block px-4 py-2 text-sm text-gray-200 hover:text-white transition duration-200" onClick={() => setIsHamburgerOpen(false)}>User Search</Link></li>
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AdminNavbar;



