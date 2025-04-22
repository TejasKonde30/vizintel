import React, { useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

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
      const response = await axios.get("http://localhost:5000/api/user/profile", { params: searchQuery });
      setUsers(response.data);
    } catch (error) {
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
    try {
      await axios.put(`http://localhost:5000/api/user/manage?email=${email}`, {
        suspend: !currentStatus
      });
      setMessage("User status updated");
      handleSearch();
    } catch (err) {
      setMessage("Error updating suspension status");
    }
    setLoading(false);
  };

  const handleUpdate = async (userId, email) => {
    setLoading(true);
    setMessage("");
    try {
      await axios.put(`http://localhost:5000/api/user/manage?email=${email}`, updateData[userId]);
      setMessage("User updated successfully");
      handleSearch();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error updating user");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminNavbar />
    <div className="w-full p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="email"
          placeholder="Search by Email"
          value={searchQuery.email}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="Search by Name"
          value={searchQuery.name}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p className="text-red-500 mb-2">{message}</p>}

      {users.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="border p-2">Email</th>
              <th className="border p-2">Update Name</th>
              <th className="border p-2">Update School</th>
              <th className="border p-2">New Password</th>
              <th className="border p-2">Suspend</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border border-gray-600">
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="newname"
                    placeholder="New Name"
                    onChange={(e) => handleUpdateChange(e, user._id)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="newschoolName"
                    placeholder="New School"
                    onChange={(e) => handleUpdateChange(e, user._id)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    onChange={(e) => handleUpdateChange(e, user._id)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => toggleSuspend(user._id, user.email, user.isSuspended)}
                    className={`px-3 py-1 rounded text-white ${user.isSuspended ? "bg-green-600" : "bg-red-600"}`}
                  >
                    {user.isSuspended ? "Activate" : "Suspend"}
                  </button>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleUpdate(user._id, user.email)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </div>
  );
};

export default ManageUsers;

