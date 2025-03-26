import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Chart from "chart.js/auto";
import * as d3 from "d3";
import { saveAs } from "file-saver"; // For downloading Excel files
import * as XLSX from "xlsx"; // For generating Excel files

axios.defaults.withCredentials = true;

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const ManualDataEntryPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, name } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [manualRows, setManualRows] = useState([{ key: "", value: "" }]);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState([]);
  const [editDataId, setEditDataId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const chartRef = useRef(null);
  const d3Ref = useRef(null);
  const donutRef = useRef(null);

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
        setCurrentData(newData);
        updateGraphs(update.data);
      }
    });

    return () => socket.off("dataUpdate");
  }, [isAuthenticated, navigate, user]);

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/data");
      setUserData(response.data);
      if (response.data.length > 0) {
        const latestData = response.data[response.data.length - 1];
        setCurrentData(latestData);
        updateGraphs(latestData.data);
      }
    } catch (error) {
      handleAuthError(error, "Error fetching initial data");
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = manualRows.filter((row) => row.key && row.value);
    if (dataToSend.length === 0) {
      setErrorMessage("Please add at least one valid row of data");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/data/manual", { data: dataToSend });
      const newData = { data: response.data.data, fileName: response.data.fileName, createdAt: new Date(), _id: response.data._id };
      setUserData((prev) => [...prev, newData]);
      setCurrentData(newData);
      updateGraphs(response.data.data);
      setShowManualPopup(false);
      setManualRows([{ key: "", value: "" }]);
      setErrorMessage("");
    } catch (error) {
      handleAuthError(error, "Manual data error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:5000/api/data/${editDataId}`, { data: editData });
      const updatedData = { data: response.data.data, fileName: response.data.fileName, createdAt: new Date(), _id: editDataId };
      setUserData((prev) => prev.map((item) => (item._id === editDataId ? updatedData : item)));
      setCurrentData(updatedData);
      updateGraphs(response.data.data);
      setShowEditPopup(false);
      setErrorMessage("");
    } catch (error) {
      handleAuthError(error, "Edit data error");
    }
  };

  const handleDeleteData = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/data/${id}`); // New backend route needed
      setUserData((prev) => prev.filter((item) => item._id !== id));
      if (currentData?._id === id) setCurrentData(null);
      setErrorMessage("");
    } catch (error) {
      handleAuthError(error, "Delete data error");
    }
  };

  const handleDownloadExcel = (dataEntry) => {
    const worksheet = XLSX.utils.json_to_sheet(dataEntry.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${dataEntry.fileName || "data"}.xlsx`);
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
    console.error(`${context}:`, error.response?.data || error.message);
  };

  const addManualRow = () => {
    setManualRows([...manualRows, { key: "", value: "" }]);
  };

  const updateManualRow = (index, field, value) => {
    const updatedRows = [...manualRows];
    updatedRows[index][field] = value;
    setManualRows(updatedRows);
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

  const openEditPopup = (dataEntry) => {
    setEditDataId(dataEntry._id);
    setEditData([...dataEntry.data]);
    setShowEditPopup(true);
  };

  const updateGraphs = (data) => {
    if (!data || data.length === 0) {
      console.error("No data to render graphs");
      return;
    }

    if (chartRef.current) chartRef.current.destroy();
    const ctx = document.getElementById("chartCanvas")?.getContext("2d");
    if (ctx) {
      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.map((d) => d.key || "Unknown"),
          datasets: [
            {
              label: "Values",
              data: data.map((d) => d.value || 0),
              backgroundColor: "rgba(255, 99, 132, 0.8)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 2,
              borderRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    const svg = d3.select(d3Ref.current).attr("width", 400).attr("height", 300);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scalePoint().domain(data.map((d) => d.key)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value || 0)]).range([height, 0]);
    const line = d3.line().x((d) => x(d.key)).y((d) => y(d.value || 0)).curve(d3.curveCatmullRom.alpha(0.5));
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("path").datum(data).attr("fill", "none").attr("stroke", "#ff6f61").attr("stroke-width", 3).attr("d", line);

    if (donutRef.current) donutRef.current.destroy();
    const donutCtx = document.getElementById("donutCanvas")?.getContext("2d");
    if (donutCtx) {
      donutRef.current = new Chart(donutCtx, {
        type: "doughnut",
        data: {
          labels: data.map((d) => d.key || "Unknown"),
          datasets: [
            {
              data: data.map((d) => d.value || 0),
              backgroundColor: ["#ff6f61", "#6b7280", "#10b981", "#f59e0b", "#3b82f6"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          cutout: "70%",
          rotation: -90,
          circumference: 180,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h2 className="text-3xl font-bold mb-4 text-orange-500">Manual Data Entry</h2>
      {errorMessage && <div className="bg-red-600 text-white p-3 rounded-lg mb-4">{errorMessage}</div>}

      <button
        onClick={() => setShowManualPopup(true)}
        className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mb-4"
      >
        Add Data
      </button>

      {userData.length > 0 && (
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Uploaded Data</h3>
          <table className="w-full border-collapse text-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-700 p-2">File Name</th>
                <th className="border border-gray-700 p-2">Date</th>
                <th className="border border-gray-700 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((dataEntry) => (
                <tr key={dataEntry._id}>
                  <td className="border border-gray-700 p-2">{dataEntry.fileName}</td>
                  <td className="border border-gray-700 p-2">{new Date(dataEntry.createdAt).toLocaleString()}</td>
                  <td className="border border-gray-700 p-2">
                    <button
                      onClick={() => openEditPopup(dataEntry)}
                      className="p-1 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setCurrentData(dataEntry);
                        updateGraphs(dataEntry.data);
                      }}
                      className="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteData(dataEntry._id)}
                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg mr-2"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleDownloadExcel(dataEntry)}
                      className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentData && (
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6 text-gray-300">
          <p><strong>File Name:</strong> {currentData.fileName}</p>
          <p><strong>Date:</strong> {new Date(currentData.createdAt).toLocaleString()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
          <h3 className="text-center font-semibold text-lg mb-2 text-white">2D Bar Graph</h3>
          <canvas id="chartCanvas" width="400" height="300"></canvas>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
          <h3 className="text-center font-semibold text-lg mb-2 text-white">2D Line Graph</h3>
          <svg ref={d3Ref}></svg>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
          <h3 className="text-center font-semibold text-lg mb-2 text-white">Semi-Circle Donut Chart</h3>
          <canvas id="donutCanvas" width="400" height="300"></canvas>
        </div>
      </div>

      {showManualPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-1/2">
            <h3 className="text-lg font-semibold text-white mb-4">Add Data</h3>
            <form onSubmit={handleManualSubmit}>
              <table className="w-full border-collapse mb-4 text-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-700 p-2">Key</th>
                    <th className="border border-gray-700 p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) => updateManualRow(index, "key", e.target.value)}
                          className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded"
                          required
                        />
                      </td>
                      <td className="border border-gray-700 p-2">
                        <input
                          type="number"
                          value={row.value}
                          onChange={(e) => updateManualRow(index, "value", e.target.value)}
                          className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded"
                          required
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={addManualRow}
                className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mb-4"
              >
                Add Row
              </button>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManualPopup(false)}
                  className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg mr-2"
                >
                  Cancel
                </button>
                <button type="submit" className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-1/2">
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
                <button type="submit" className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualDataEntryPage;