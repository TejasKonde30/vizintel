import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { motion } from "framer-motion";
import { FaUsers, FaFileAlt, FaChartLine, FaSpinner } from "react-icons/fa";
import Chart from "chart.js/auto";
import { Line } from "react-chartjs-2";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(null);
  const [dataCount, setDataCount] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const [datasets, setDatasets] = useState([]);
  const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const userRes = await fetch("http://localhost:5000/api/users/count", {
          credentials: "include",
        });
        const userData = await userRes.json();
        setUserCount(userData.totalUsers);

        const dataRes = await fetch("http://localhost:5000/api/datas/count", {
          credentials: "include",
        });
        const dataData = await dataRes.json();
        setDataCount(dataData.totaldata);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    const fetchTickets = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/support/admin", {
          credentials: "include",
        });
        const data = await res.json();
        setTickets(data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllDatasets = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/data", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Unauthorized or failed to fetch datasets");
        }
        const data = await res.json();
        setDatasets(data);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        setDatasets([]);
      }
    };

    const fetchTrafficData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/traffic/week", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch traffic data");
        const data = await res.json();
        setTrafficData(data.trafficCounts);
      } catch (error) {
        console.error("Error fetching traffic data:", error);
        setTrafficData([0, 0, 0, 0, 0, 0, 0]);
      }
    };

    fetchCounts();
    fetchTickets();
    fetchAllDatasets();
    fetchTrafficData();
  }, []);

  const updateStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/support/${ticketId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t._id === ticketId ? { ...t, status: newStatus } : t
          )
        );
      } else {
        console.error("Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const deleteDataset = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/data/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDatasets(datasets.filter((d) => d._id !== id));
        alert("Dataset deleted successfully");
      } else {
        console.error("Failed to delete dataset");
      }
    } catch (err) {
      console.error("Error deleting dataset:", err);
    }
  };

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "User Traffic",
        data: trafficData.length > 0 ? trafficData : [0, 0, 0, 0, 0, 0, 0],
        fill: false,
        backgroundColor: "#f97316",
        borderColor: "#f97316",
      },
    ],
  };

  const filteredTickets =
    selectedTab === "All"
      ? tickets
      : tickets.filter((t) => t.status === selectedTab);

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />
      <div className="pt-16 max-w-7xl mx-auto p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            className="bg-gray-900 p-6 rounded-2xl shadow-lg flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition duration-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigate("/ManageUsers")}
          >
            <FaUsers className="text-4xl text-orange-500" />
            <div>
              <p className="text-sm text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-white">{userCount ?? "..."}</p>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-900 p-6 rounded-2xl shadow-lg flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition duration-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => navigate("/UserUploads")}
          >
            <FaFileAlt className="text-4xl text-orange-500" />
            <div>
              <p className="text-sm text-gray-300">Excel Sheets Uploaded</p>
              <p className="text-2xl font-bold text-white">{dataCount ?? "..."}</p>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-900 p-6 rounded-2xl shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FaChartLine className="text-2xl text-orange-500" />
              <h3 className="text-lg font-semibold text-white">User Traffic</h3>
            </div>
            <Line data={chartData} />
          </motion.div>
        </div>

        {/* Support Tickets Section */}
        <div className="mt-10">
          <h2 className="text-3xl font-bold mb-8 text-orange-500">Support Tickets</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {["All", "Pending", "Resolved", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedTab(status)}
                className={`px-4 py-2 rounded-lg text-sm transition duration-200 ${
                  selectedTab === status
                    ? "bg-orange-500 text-black"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-6">
              <FaSpinner className="animate-spin text-orange-500 text-3xl" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <p className="text-gray-300">No tickets found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-gray-900 p-6 rounded-2xl shadow-lg"
                >
                  <p className="text-sm text-white">{ticket.message}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    User ID: {ticket.userId}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                  <p
                    className={`text-sm mt-2 font-semibold ${
                      ticket.status === "Resolved"
                        ? "text-green-400"
                        : ticket.status === "Rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    Status: {ticket.status}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Resolved", "Pending", "Rejected"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(ticket._id, status)}
                        disabled={ticket.status === status}
                        className={`px-3 py-1 text-xs rounded-lg text-black transition duration-200 ${
                          status === "Resolved"
                            ? "bg-green-600 hover:bg-green-700"
                            : status === "Rejected"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-orange-500 hover:bg-orange-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Mark {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;