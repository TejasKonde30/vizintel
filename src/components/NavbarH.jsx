import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux";
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaCog, FaBars, FaTimes } from "react-icons/fa";
import LoadingBar from "react-top-loading-bar";
import axios from "axios";

const Navbar = () => {
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

    const timer = setTimeout(() => {
      loadingBarRef.current?.complete();
    }, 100);


    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      loadingBarRef.current?.continuousStart();
      return config;
    }, (error) => {
      loadingBarRef.current?.complete();
      return Promise.reject(error);
    });

    const responseInterceptor = axios.interceptors.response.use((response) => {
      loadingBarRef.current?.complete();
      return response;
    }, (error) => {
      loadingBarRef.current?.complete();
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

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
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="relative">
      {/* Loading Bar */}
      <LoadingBar color="#f97316" ref={loadingBarRef} height={3} shadow={true} />

      {/* Navbar */}
      <nav className="bg-black text-white sticky top-0 z-50 shadow-lg border-2px border-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img src="photos/logo.png" alt="Logo" className="h-10 w-10" />
              <span className="text-orange-500 text-2xl font-bold ml-2">VIZINTEL</span>
            </a>
          </div>

          {/* Center Menu (Visible on Medium and Larger Screens) */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="hover:text-orange-500 transition duration-300"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right-Side of User Dropdown and Hamburger */}
          <div className="flex items-center space-x-4">
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center text-sm bg-gray-800 rounded-full p-1 focus:ring-4 focus:ring-orange-500 hover:bg-gray-700 transition duration-300"
              >
                <span className="sr-only">Open user menu</span>
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
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3">
                        <span className="block text-sm font-semibold text-white">{name || "User"}</span>
                        <span className="block text-xs text-gray-400 truncate">{user || "email@example.com"}</span>
                      </div>
                      <ul className="py-2">
                        <li>
                          <button
                            onClick={() => {
                              navigate("/dashboard");
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
                            onClick={() => {
                              navigate("/settings");
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                          >
                            <FaCog className="mr-2" />
                            Settings
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
                    </>
                  ) : (
                    <ul className="py-2">
                      <li>
                        <button
                          onClick={() => {
                            navigate("/Login");
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                        >
                          Sign In
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            navigate("/register");
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                        >
                          Sign Up
                        </button>
                      </li>
                    </ul>
                  )}
                </motion.div>
              )}
            </div>

            {/*Hamburger*/}
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
                    {navItems.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.path}
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white transition duration-200"
                          onClick={() => setIsHamburgerOpen(false)}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
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

export default Navbar;
