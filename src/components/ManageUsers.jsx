import React, { useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";
import { FaSearch, FaSpinner } from "react-icons/fa";

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState({ email: "", name: "" });
  const [users, setUsers] = useState([]);
  const [updateData, setUpdateData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        setMessage(response.data.message); // e.g., "User test@example.com updated successfully"
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

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      <div className="pt-16 max-w-7xl mx-auto p-6">
        {/* Search Form */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Search Users</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              name="email"
              placeholder="Search by Email"
              value={searchQuery.email}
              onChange={handleChange}
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
            />
            <input
              type="text"
              name="name"
              placeholder="Search by Name"
              value={searchQuery.name}
              onChange={handleChange}
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-orange-600 transition duration-200 disabled:opacity-50"
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
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-black">
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
                    <tr key={user._id} className="border-b border-gray-700 hover:bg-gray-700 transition duration-200">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4 capitalize">{user.authType}</td>
                      <td className="p-4">
                        <input
                          type="text"
                          name="newname"
                          placeholder="New Name"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          name="newschoolName"
                          placeholder="New School"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="password"
                          name="newPassword"
                          placeholder="New Password"
                          onChange={(e) => handleUpdateChange(e, user._id)}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleSuspend(user._id, user.email, user.isSuspended)}
                          className={`px-4 py-2 rounded-lg text-white ${
                            user.isSuspended ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                          } transition duration-200`}
                        >
                          {user.isSuspended ? "Activate" : "Suspend"}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdate(user._id, user.email)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
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