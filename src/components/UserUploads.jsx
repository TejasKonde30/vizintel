// UserUploads.jsx
import React, { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import AdminNavbar from "./AdminNavbar";

const UserUploads = () => {
  const [userUploads, setUserUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserUploads = async () => {
      try {
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
        setUserUploads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserUploads();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
        <AdminNavbar />
    <div className="bg-black min-h-screen text-white p-6">
      <h2 className="text-2xl font-bold mb-4">User Uploads</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : userUploads.length === 0 ? (
        <p className="text-gray-400">No uploads found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {userUploads.map((user) => (
            <div key={user.userId} className="bg-gray-800 p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-400">Email: {user.email}</p>
              <p className="text-sm mt-2">Total Uploads: {user.uploadCount}</p>
              {user.uploadCount > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  <ul className="list-disc pl-5 text-sm">
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