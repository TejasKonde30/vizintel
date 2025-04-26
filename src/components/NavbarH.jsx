import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux";
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaCog, FaBars, FaTimes, FaUpload, FaEdit } from "react-icons/fa";
import LoadingBar from "react-top-loading-bar";
import axios from "axios";

const UserNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hamburgerRef = useRef(null);
  const servicesRef = useRef(null);
  const loadingBarRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { isAuthenticated, user, name, identity } = useSelector((state) => state.auth) || {};

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleHamburger = () => setIsHamburgerOpen(!isHamburgerOpen);
  const toggleServices = () => setIsServicesOpen(!isServicesOpen);

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

  const closeServices = (event) => {
    if (servicesRef.current && !servicesRef.current.contains(event.target)) {
      setIsServicesOpen(false);
    }
  };

  useEffect(() => {
    loadingBarRef.current?.continuousStart();
    const timer = setTimeout(() => loadingBarRef.current?.complete(), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        loadingBarRef.current?.continuousStart();
        return config;
      },
      (error) => {
        loadingBarRef.current?.complete();
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        loadingBarRef.current?.complete();
        return response;
      },
      (error) => {
        loadingBarRef.current?.complete();
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("mousedown", closeHamburger);
    document.addEventListener("mousedown", closeServices);
    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("mousedown", closeHamburger);
      document.removeEventListener("mousedown", closeServices);
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
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="relative">
      <LoadingBar color="#f97316" ref={loadingBarRef} height={3} shadow={true} />
      <nav className="bg-black text-white sticky top-0 z-[100] shadow-lg border-2 border-black">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img src="photos/logo.png" alt="Logo" className="h-10 w-10" />
              <span className="text-orange-500 text-2xl font-bold ml-2">VIZINTEL</span>
            </a>
          </div>

          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <a key={item.label} href={item.path} className="hover:text-orange-500 transition duration-300">
                {item.label}
              </a>
            ))}
            {isAuthenticated && identity === 0 && (
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={toggleServices}
                  className="hover:text-orange-500 transition duration-300 flex items-center"
                >
                  Services
                </button>
                {isServicesOpen && (
                  <motion.div
                    className="absolute left-0 mt-2 w-48 bg-gray-700 text-white rounded-lg shadow-lg z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ul className="py-2">
                      <li>
                        <button
                          onClick={() => {
                            navigate("/file-upload");
                            setIsServicesOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                        >
                          <FaUpload className="mr-2" />
                          File Upload
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            navigate("/manual-data-entry");
                            setIsServicesOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                        >
                          <FaEdit className="mr-2" />
                          Manual Data Entry
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </div>
            )}
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
                              navigate(identity === 1 ? "/Admindashboard" : "/Dashboard");
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
                      <li>
                        <button
                          onClick={() => {
                            navigate("/adminlogin");
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:text-orange-500 transition duration-200"
                        >
                          Admin
                        </button>
                      </li>
                    </ul>
                  )}
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
                    {isAuthenticated && identity === 0 && (
                      <>
                        <li>
                          <button
                            onClick={() => {
                              navigate("/file-upload");
                              setIsHamburgerOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white transition duration-200"
                          >
                            File Upload
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              navigate("/manual-data-entry");
                              setIsHamburgerOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white transition duration-200"
                          >
                            Manual Data Entry
                          </button>
                        </li>
                      </>
                    )}
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

export default UserNavbar;
