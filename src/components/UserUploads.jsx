import React, { useEffect, useState } from "react";
import { FaFileExcel, FaSpinner } from "react-icons/fa";
import AdminNavbar from "./AdminNavbar";

const UserUploads = () => {
  const [userUploads, setUserUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserUploads = async () => {
      try {
        setError("");
        // Fetch all users
        const usersRes = await fetch("http://localhost:5000/api/users", {
          credentials: "include",
        });
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const users = await usersRes.json();

        // Fetch all data entries
        const dataRes = await fetch("http://localhost:5000/api/data/all", {
          credentials: "include",
        });
        if (!dataRes.ok) throw new Error("Failed to fetch data");
        const data = await dataRes.json();

        // Map users to their uploads
        const uploads = users.map((user) => ({
          userId: user._id,
          email: user.email,
          name: user.name,
          uploads: data.filter((d) => d.userId.toString() === user._id.toString()),
          uploadCount: data.filter((d) => d.userId.toString() === user._id.toString()).length,
        }));

        setUserUploads(uploads);
      } catch (error) {
        console.error("Error fetching user uploads:", error);
        setError(error.message || "Failed to load user uploads");
        setUserUploads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserUploads();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <AdminNavbar />
      <div className="pt-16 max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-orange-500 mb-8">User Uploads</h2>
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">{error}</div>
        )}
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <FaSpinner className="animate-spin text-orange-500 text-3xl" />
          </div>
        ) : userUploads.length === 0 ? (
          <p className="text-gray-400">No uploads found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {userUploads.map((user) => (
              <div key={user.userId} className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-gray-400">Email: {user.email}</p>
                <p className="text-sm text-gray-400 mt-2">Total Uploads: {user.uploadCount}</p>
                {user.uploadCount > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-white">Uploaded Files:</p>
                    <ul className="list-disc pl-5 text-sm text-gray-300">
                      {user.uploads.map((upload) => (
                        <li key={upload._id} className="flex items-center gap-2">
                          <FaFileExcel className="text-green-500" />
                          {upload.fileName} ({new Date(upload.createdAt).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserUploads;