import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";

axios.defaults.withCredentials = true;

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, name } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter, setFilter] = useState({ search: "", date: "" });
  const [stats, setStats] = useState({ totalDatasets: 0, avgValue: 0 });
  const [notifications, setNotifications] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState([]);
  const [editDataId, setEditDataId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
      return;
    }

    socket.emit("join", user);
    fetchData();

    socket.on("dataUpdate", (update) => {
      if (update.userId === user) {
        const newData = { data: update.data, createdAt: new Date(), fileName: update.fileName, _id: update._id };
        setUserData((prev) => [...prev, newData]);
        setNotifications((prev) => [...prev, { id: Date.now(), message: `New data added: ${update.fileName}` }]);
        updateStats([...userData, newData]);
      }
    });

    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (hasSeenWelcome) setShowWelcomePopup(false);

    return () => socket.off("dataUpdate");
  }, [isAuthenticated, navigate, user]);

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/data");
      setUserData(response.data);
      setFilteredData(response.data);
      updateStats(response.data);
    } catch (error) {
      handleAuthError(error, "Error fetching data");
    }
  };

  const updateStats = (data) => {
    const totalDatasets = data.length;
    const allValues = data.flatMap((entry) => entry.data.map((d) => Number(d.value) || 0));
    const avgValue = allValues.length ? (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(2) : 0;
    setStats({ totalDatasets, avgValue });
  };

  const handleFilter = () => {
    let filtered = [...userData];
    if (filter.search) {
      filtered = filtered.filter((entry) =>
        entry.fileName.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    if (filter.date) {
      filtered = filtered.filter((entry) =>
        new Date(entry.createdAt).toLocaleDateString() === new Date(filter.date).toLocaleDateString()
      );
    }
    setFilteredData(filtered);
  };

  const handleExportAll = () => {
    const allData = userData.flatMap((entry) =>
      entry.data.map((d) => ({
        FileName: entry.fileName,
        Key: d.key,
        Value: d.value,
        CreatedAt: new Date(entry.createdAt).toLocaleString(),
      }))
    );
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Data");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "All_Dashboard_Data.xlsx");
  };

  const handleAuthError = (error, context) => {
    if (error.response) {
      const { message } = error.response.data;
      if (message === "No token provided" || message === "Invalid token" || message === "Token expired") {
        setErrorMessage("Session expired. Please log in again.");
        dispatch(logout());
        navigate("/login", { replace: true });
      } else {
        setErrorMessage(`${context}: ${message}`);
      }
    } else {
      setErrorMessage(`${context}: ${error.message}`);
    }
  };

  const handleDeleteData = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/data/${id}`);
      setUserData((prev) => prev.filter((item) => item._id !== id));
      setFilteredData((prev) => prev.filter((item) => item._id !== id));
      updateStats(userData.filter((item) => item._id !== id));
      setNotifications((prev) => [...prev, { id: Date.now(), message: `Data deleted: ID ${id}` }]);
      setErrorMessage("");
    } catch (error) {
      handleAuthError(error, "Delete data error");
    }
  };

  const openEditPopup = (dataEntry) => {
    setEditDataId(dataEntry._id);
    setEditData([...dataEntry.data]);
    setShowEditPopup(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:5000/api/data/${editDataId}`, { data: editData });
      const updatedData = { data: response.data.data, fileName: response.data.fileName, createdAt: new Date(), _id: editDataId };
      setUserData((prev) => prev.map((item) => (item._id === editDataId ? updatedData : item)));
      setFilteredData((prev) => prev.map((item) => (item._id === editDataId ? updatedData : item)));
      updateStats(userData.map((item) => (item._id === editDataId ? updatedData : item)));
      setNotifications((prev) => [...prev, { id: Date.now(), message: `Data updated: ${response.data.fileName}` }]);
      setShowEditPopup(false);
      setErrorMessage("");
    } catch (error) {
      handleAuthError(error, "Edit data error");
    }
  };

  const addEditRow = () => {
    setEditData([...editData, { key: "", value: "" }]);
  };

  const deleteEditRow = (index) => {
    setEditData(editData.filter((_, i) => i !== index));
  };

  const updateEditRow = (index, field, value) => {
    const updatedData = [...editData];
    updatedData[index][field] = value;
    setEditData(updatedData);
  };

  const dismissWelcomePopup = () => {
    setShowWelcomePopup(false);
    localStorage.setItem("hasSeenWelcome", "true");
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((note) => note.id !== id));
  };

  useEffect(() => {
    const timers = notifications.map((note) =>
      setTimeout(() => dismissNotification(note.id), 5000)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [notifications]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <style>
        {`
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(255, 165, 0, 0.3), 0 0 10px rgba(255, 165, 0, 0.2); }
            50% { box-shadow: 0 0 10px rgba(255, 165, 0, 0.5), 0 0 20px rgba(255, 165, 0, 0.3); }
            100% { box-shadow: 0 0 5px rgba(255, 165, 0, 0.3), 0 0 10px rgba(255, 165, 0, 0.2); }
          }
          .glow-border {
            animation: glow 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0% { background-color: rgba(0, 0, 0, 0.75); }
            50% { background-color: rgba(0, 0, 0, 0.85); }
            100% { background-color: rgba(0, 0, 0, 0.75); }
          }
          .pulse-bg {
            animation: pulse 3s ease-in-out infinite;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto p-6">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <AnimatePresence>
            {notifications.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 border-l-4 border-orange-500 rounded-lg p-4 shadow-lg flex items-center justify-between max-w-sm"
              >
                <span className="text-gray-300">{note.message}</span>
                <button
                  onClick={() => dismissNotification(note.id)}
                  className="text-gray-400 hover:text-orange-500"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Animated Welcome Banner */}
        <motion.div
          className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800 glow-border relative overflow-hidden"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,165,0,0.1)_0%,transparent_70%)] pointer-events-none"></div>
          <motion.h2
            className="text-4xl font-bold text-orange-500 drop-shadow-md"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome, {name || "User"}!
          </motion.h2>
          <motion.p
            className="text-gray-300 mt-3 text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Dive into your data journey with Vizintel. Upload files or add entries to visualize insights.
          </motion.p>
        </motion.div>

        {/* Welcome Popup */}
        {showWelcomePopup && (
          <motion.div
            className="fixed inset-0 pulse-bg flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-800 glow-border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex items-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <svg
                  className="w-8 h-8 text-orange-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19V6l7 7-7 6z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-white">Welcome to VIZINTEL</h3>
              </motion.div>
              <motion.p
                className="text-gray-300 mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                This dashboard empowers you to visualize and manage data effortlessly. Upload Excel files or add manual entries to unlock powerful insights!
              </motion.p>
              <motion.button
                onClick={dismissWelcomePopup}
                className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Got It!
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        <h2 className="text-3xl font-bold mb-8 text-orange-500">Dashboard</h2>
        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-8">{errorMessage}</div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white">Total Datasets</h3>
            <p className="text-2xl text-orange-500">{stats.totalDatasets}</p>
          </motion.div>
          <motion.div
            className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white">Average Value</h3>
            <p className="text-2xl text-orange-500">{stats.avgValue}</p>
          </motion.div>
        </div>

        {/* Sticky Filters */}
        <motion.div
          className="bg-gray-900 rounded-2xl p-6 mb-8 shadow-lg border border-gray-800 sticky top-0 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">Filter Data</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by file name"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="border border-gray-700 bg-gray-800 text-white p-2 rounded-lg w-full md:w-1/2"
            />
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              className="border border-gray-700 bg-gray-800 text-white p-2 rounded-lg w-full md:w-1/2"
            />
            <button
              onClick={handleFilter}
              className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg"
            >
              Apply Filter
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {filteredData.length > 0 && (
          <motion.div
            className="bg-gray-900 rounded-2xl p-6 mb-8 shadow-lg border border-gray-800 overflow-x-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <table className="w-full border-collapse text-gray-300 min-w-[600px]">
              <thead>
                <tr>
                  <th className="border border-gray-700 p-2">File Name</th>
                  <th className="border border-gray-700 p-2">Date</th>
                  <th className="border border-gray-700 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 5).map((dataEntry) => (
                  <tr key={dataEntry._id}>
                    <td className="border border-gray-700 p-2">{dataEntry.fileName}</td>
                    <td className="border border-gray-700 p-2">
                      {new Date(dataEntry.createdAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-700 p-2">
                      <button
                        onClick={() => navigate("/file-upload")}
                        className="p-1 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditPopup(dataEntry)}
                        className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteData(dataEntry._id)}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Edit Popup */}
        {showWelcomePopup && (
          <motion.div
            className="fixed inset-0 pulse-bg flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-800 glow-border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex items-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <svg
                  className="w-8 h-8 text-orange-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19V6l7 7-7 6z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-white">Welcome to VIZINTEL</h3>
              </motion.div>
              <motion.p
                className="text-gray-300 mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                This dashboard empowers you to visualize and manage data effortlessly. Upload Excel files or add manual entries to unlock powerful insights!
              </motion.p>
              <motion.button
                onClick={dismissWelcomePopup}
                className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Got It!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
        {showEditPopup && (
          <motion.div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl shadow-lg border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Data</h3>
              <form onSubmit={handleEditSubmit}>
                <table className="w-full border-collapse mb-4 text-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-700 p-2">Key</th>
                      <th className="border border-gray-700 p-2">Value</th>
                      <th className="border border-gray-700 p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editData.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-gray-700 p-2">
                          <input
                            type="text"
                            value={row.key}
                            onChange={(e) => updateEditRow(index, "key", e.target.value)}
                            className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded"
                            required
                          />
                        </td>
                        <td className="border border-gray-700 p-2">
                          <input
                            type="number"
                            value={row.value}
                            onChange={(e) => updateEditRow(index, "value", e.target.value)}
                            className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded"
                            required
                          />
                        </td>
                        <td className="border border-gray-700 p-2">
                          <button
                            type="button"
                            onClick={() => deleteEditRow(index)}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addEditRow}
                  className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mb-4"
                >
                  Add Row
                </button>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditPopup(false)}
                    className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Export All Data */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={handleExportAll}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Export All Data as Excel
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;