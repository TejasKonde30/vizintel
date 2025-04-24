import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";
import { FaSearch, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState({ email: "", name: "" });
  const [users, setUsers] = useState([]);
  const [updateData, setUpdateData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.get("http://localhost:5000/api/user/profile", {
        params: {
          email: searchQuery.email.toLowerCase(),
          name: searchQuery.name.toLowerCase(),
        },
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage(error.response?.data?.message || "Error fetching users");
      setUsers([]);
    }
    setLoading(false);
  };

  const handleUpdateChange = (e, userId) => {
    setUpdateData({
      ...updateData,
      [userId]: { ...updateData[userId], [e.target.name]: e.target.value },
    });
  };

  const toggleSuspend = async (userId, email, currentStatus) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.put(
        `http://localhost:5000/api/user/manage?email=${email}`,
        { suspend: !currentStatus },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setMessage(`User ${email} ${currentStatus ? "activated" : "suspended"} successfully`);
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), message: `User ${email} ${currentStatus ? "activated" : "suspended"}` },
        ]);
        handleSearch();
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error updating suspension status:", error);
      setMessage(error.response?.data?.message || "Error updating suspension status");
    }
    setLoading(false);
  };

  const handleUpdate = async (userId, email) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.put(
        `http://localhost:5000/api/user/manage?email=${email}`,
        updateData[userId],
        { withCredentials: true }
      );
      if (response.status === 200) {
        const updatedUser = users.find((u) => u._id === userId);
        const userName = updatedUser?.name || "User";
        setMessage(response.data.message);
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: `✅ ${userName}'s data updated (Email: ${email})`,
          },
        ]);
        handleSearch();
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage(error.response?.data?.message || "Error updating user");
    }
    setLoading(false);
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
    <div className="min-h-screen bg-black">
      <AdminNavbar />
      <div className="pt-16 max-w-7xl mx-auto p-6">
        {/* Toast Notifications */}
        {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-[9999] space-y-2">
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

        {/* Search Form */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-orange-500 mb-8">Search Users</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              name="email"
              placeholder="Search by Email"
              value={searchQuery.email}
              onChange={handleChange}
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
            />
            <input
              type="text"
              name="name"
              placeholder="Search by Name"
              value={searchQuery.name}
              onChange={handleChange}
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-orange-500 text-black px-6 py-3 rounded-lg flex items-center justify-center hover:bg-orange-600 transition duration-200 disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" />}
              Search
            </button>
          </div>
        </div>

        {/* Message and Loading */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes("Error") ? "bg-red-600" : "bg-green-600"} text-white`}>
            {message}
          </div>
        )}
        {loading && !message && (
          <div className="flex justify-center items-center p-6">
            <FaSpinner className="animate-spin text-orange-500 text-3xl" />
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 && (
          <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Auth Type</th>
                    <th className="p-4 text-left">Update Name</th>
                    <th className="p-4 text-left">Update School</th>
                    <th className="p-4 text-left">New Password</th>
                    <th className="p-4 text-left">Suspend</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-700 hover:bg-gray-800 transition duration-200">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4 capitalize">{user.authType}</td>
                      <td className="p-4">
                        <input
                          type="text"
                          name="newname"
                          placeholder="New Name"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          name="newschoolName"
                          placeholder="New School"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="password"
                          name="newPassword"
                          placeholder="New Password"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleSuspend(user._id, user.email, user.isSuspended)}
                          className={`px-4 py-2 rounded-lg text-black ${
                            user.isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                          } transition duration-200`}
                        >
                          {user.isSuspended ? "Activate" : "Suspend"}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdate(user._id, user.email)}
                          className="bg-orange-500 text-black px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;