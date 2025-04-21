import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import Chart from "chart.js/auto";
import * as d3 from "d3";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

axios.defaults.withCredentials = true;

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const ManualDataEntryPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [manualRows, setManualRows] = useState([{ key: "", value: "" }]);
  const [manualColumns, setManualColumns] = useState(["key", "value"]);
  const [manualFileName, setManualFileName] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState([]);
  const [editColumns, setEditColumns] = useState(["key", "value"]);
  const [editDataId, setEditDataId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const chartRef = useRef(null);
  const d3Ref = useRef(null);
  const donutRef = useRef(null);
  const pieRef = useRef(null);
  const graphSectionRef = useRef(null);

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

    return () => {
      socket.off("dataUpdate");
      if (d3Ref.current && d3Ref.current.__cleanup) {
        d3Ref.current.__cleanup();
      }
    };
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
    if (!manualFileName.trim()) {
      setErrorMessage("File name is required");
      return;
    }
    const dataToSend = manualRows.filter((row) => manualColumns.every((col) => row[col]));
    if (dataToSend.length === 0) {
      setErrorMessage("Please add at least one valid row of data");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/data/manual", { data: dataToSend, fileName: manualFileName.trim() });
      const newData = { data: response.data.data, fileName: response.data.fileName, createdAt: new Date(), _id: response.data._id };
      setUserData((prev) => [...prev, newData]);
      setCurrentData(newData);
      updateGraphs(response.data.data);
      setShowManualPopup(false);
      setManualRows([{ key: "", value: "" }]);
      setManualColumns(["key", "value"]);
      setManualFileName("");
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
      await axios.delete(`http://localhost:5000/api/data/${id}`);
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

  // Manual Data Functions
  const addManualRow = () => {
    const newRow = manualColumns.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
    setManualRows([...manualRows, newRow]);
  };

  const updateManualRow = (index, column, value) => {
    const updatedRows = [...manualRows];
    updatedRows[index][column] = value;
    setManualRows(updatedRows);
  };

  const deleteManualRow = (index) => {
    setManualRows(manualRows.filter((_, i) => i !== index));
  };

  const addManualColumn = () => {
    const newColumn = `column${manualColumns.length + 1}`;
    setManualColumns([...manualColumns, newColumn]);
    setManualRows(manualRows.map((row) => ({ ...row, [newColumn]: "" })));
  };

  const deleteManualColumn = (column) => {
    if (manualColumns.length <= 1) {
      setErrorMessage("At least one column is required");
      return;
    }
    setManualColumns(manualColumns.filter((col) => col !== column));
    setManualRows(manualRows.map((row) => {
      const { [column]: _, ...rest } = row;
      return rest;
    }));
  };

  const updateManualColumnName = (index, newName) => {
    const trimmedName = newName.trim();
    const oldName = manualColumns[index];

    // Skip if no change
    if (trimmedName.toLowerCase() === oldName.toLowerCase()) {
      return;
    }

    // Validate on blur (handled in input's onBlur)
    const updatedColumns = [...manualColumns];
    updatedColumns[index] = trimmedName || oldName; // Fallback to old name if empty
    setManualColumns(updatedColumns);
    setManualRows(manualRows.map((row) => {
      const { [oldName]: value, ...rest } = row;
      return { ...rest, [trimmedName || oldName]: value };
    }));
  };

  const validateManualColumnName = (index, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setErrorMessage("Column name cannot be empty");
      return false;
    }
    if (manualColumns.includes(trimmedName) && trimmedName !== manualColumns[index]) {
      setErrorMessage("Column name must be unique");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  // Edit Data Functions
  const addEditRow = () => {
    const newRow = editColumns.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
    setEditData([...editData, newRow]);
  };

  const deleteEditRow = (index) => {
    setEditData(editData.filter((_, i) => i !== index));
  };

  const updateEditRow = (index, column, value) => {
    const updatedData = [...editData];
    updatedData[index][column] = value;
    setEditData(updatedData);
  };

  const addEditColumn = () => {
    const newColumn = `column${editColumns.length + 1}`;
    setEditColumns([...editColumns, newColumn]);
    setEditData(editData.map((row) => ({ ...row, [newColumn]: "" })));
  };

  const deleteEditColumn = (column) => {
    if (editColumns.length <= 1) {
      setErrorMessage("At least one column is required");
      return;
    }
    setEditColumns(editColumns.filter((col) => col !== column));
    setEditData(editData.map((row) => {
      const { [column]: _, ...rest } = row;
      return rest;
    }));
  };

  const updateEditColumnName = (index, newName) => {
    const trimmedName = newName.trim();
    const oldName = editColumns[index];

    // Skip if no change
    if (trimmedName.toLowerCase() === oldName.toLowerCase()) {
      return;
    }

    // Validate on blur (handled in input's onBlur)
    const updatedColumns = [...editColumns];
    updatedColumns[index] = trimmedName || oldName; // Fallback to old name if empty
    setEditColumns(updatedColumns);
    setEditData(editData.map((row) => {
      const { [oldName]: value, ...rest } = row;
      return { ...rest, [trimmedName || oldName]: value };
    }));
  };

  const validateEditColumnName = (index, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setErrorMessage("Column name cannot be empty");
      return false;
    }
    if (editColumns.includes(trimmedName) && trimmedName !== editColumns[index]) {
      setErrorMessage("Column name must be unique");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const openEditPopup = (dataEntry) => {
    setEditDataId(dataEntry._id);
    setEditData([...dataEntry.data]);
    setEditColumns(Object.keys(dataEntry.data[0] || { key: "", value: "" }));
    setShowEditPopup(true);
  };

  const updateGraphs = (data) => {
    if (!data || data.length === 0) {
      console.error("No data to render graphs");
      return;
    }

    // Destroy existing charts
    if (chartRef.current) chartRef.current.destroy();
    if (donutRef.current) donutRef.current.destroy();
    if (pieRef.current) pieRef.current.destroy();

    // Get numeric columns (exclude 'key' or its renamed equivalent)
    const keyColumn = data[0] ? Object.keys(data[0])[0] : "key"; // Assume first column is the key
    const numericColumns = Object.keys(data[0] || {})
      .filter((key) => key !== keyColumn && data.every((d) => !isNaN(parseFloat(d[key]))))
      .map((col) => ({ name: col, label: col.charAt(0).toUpperCase() + col.slice(1) }));

    if (numericColumns.length === 0) {
      console.error("No numeric columns found for graphing");
      return;
    }

    // Color palette for multiple series
    const colorPalette = [
      "rgba(255, 99, 132, 0.8)", // Red
      "rgba(54, 162, 235, 0.8)", // Blue
      "rgba(255, 206, 86, 0.8)", // Yellow
      "rgba(75, 192, 192, 0.8)", // Teal
      "rgba(153, 102, 255, 0.8)", // Purple
      "rgba(255, 159, 64, 0.8)", // Orange
    ];

    // Bar Chart (Grouped)
    const ctx = document.getElementById("chartCanvas")?.getContext("2d");
    if (ctx) {
      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.map((d) => d[keyColumn] || "Unknown"),
          datasets: numericColumns.map((col, index) => ({
            label: col.label,
            data: data.map((d) => parseFloat(d[col.name]) || 0),
            backgroundColor: colorPalette[index % colorPalette.length],
            borderColor: colorPalette[index % colorPalette.length].replace("0.8", "1"),
            borderWidth: 2,
            borderRadius: 5,
          })),
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: false, ticks: { color: "white" } },
            y: { stacked: false, beginAtZero: true, ticks: { color: "white" } },
          },
          plugins: {
            legend: { labels: { color: "white" } },
          },
        },
      });
    }

    // Responsive Line Chart (Multiple Lines)
    const svg = d3.select(d3Ref.current);
    const container = d3Ref.current.parentElement;

    const updateLineChart = () => {
      const width = container.clientWidth;
      const height = width * 0.75;
      svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 20, bottom: 60, left: 50 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scalePoint().domain(data.map((d) => d[keyColumn])).range([0, chartWidth]).padding(0.1);
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(numericColumns, (col) => d3.max(data, (d) => parseFloat(d[col.name]) || 0))])
        .range([chartHeight, 0])
        .nice();

      // Draw lines for each numeric column
      numericColumns.forEach((col, index) => {
        const line = d3
          .line()
          .x((d) => x(d[keyColumn]))
          .y((d) => y(parseFloat(d[col.name]) || 0))
          .curve(d3.curveCatmullRom.alpha(0.5));

        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colorPalette[index % colorPalette.length].replace("0.8", "1"))
          .attr("stroke-width", width < 400 ? 2 : 3)
          .attr("d", line);
      });

      // Axes
      g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", width < 400 ? "10px" : "12px")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-45)");

      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", width < 400 ? "10px" : "12px");

      g.selectAll(".tick line").style("stroke", "white");
      g.selectAll(".domain").style("stroke", "white");
    };

    updateLineChart();
    window.addEventListener("resize", updateLineChart);
    const currentSvg = d3Ref.current;
    const cleanup = () => {
      window.removeEventListener("resize", updateLineChart);
    };
    currentSvg.__cleanup = cleanup;

    // Donut Chart (Multi-value: each key-column pair is a segment)
    const donutCtx = document.getElementById("donutCanvas")?.getContext("2d");
    if (donutCtx) {
      const multiValueData = [];
      const multiValueLabels = [];
      data.forEach((d) => {
        numericColumns.forEach((col) => {
          multiValueLabels.push(`${d[keyColumn] || "Unknown"}-${col.label}`);
          multiValueData.push(parseFloat(d[col.name]) || 0);
        });
      });

      donutRef.current = new Chart(donutCtx, {
        type: "doughnut",
        data: {
          labels: multiValueLabels,
          datasets: [
            {
              data: multiValueData,
              backgroundColor: multiValueLabels.map((_, index) => colorPalette[index % colorPalette.length]),
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          cutout: "70%",
          rotation: -90,
          circumference: 180,
          plugins: { legend: { labels: { color: "white" } } },
        },
      });
    }

    // Pie Chart (Multi-value: each key-column pair is a segment)
    const pieCtx = document.getElementById("pieCanvas")?.getContext("2d");
    if (pieCtx) {
      const multiValueData = [];
      const multiValueLabels = [];
      data.forEach((d) => {
        numericColumns.forEach((col) => {
          multiValueLabels.push(`${d[keyColumn] || "Unknown"}-${col.label}`);
          multiValueData.push(parseFloat(d[col.name]) || 0);
        });
      });

      pieRef.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: multiValueLabels,
          datasets: [
            {
              data: multiValueData,
              backgroundColor: multiValueLabels.map((_, index) => colorPalette[index % colorPalette.length]),
              borderColor: multiValueLabels.map((_, index) => colorPalette[index % colorPalette.length].replace("0.8", "1")),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top", labels: { color: "white" } } },
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
          .glow-hover:hover {
            box-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
            transition: box-shadow 0.3s ease;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,165,0,0.1)_0%,transparent_70%)] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-orange-500">Manual Data Entry</h2>
          {errorMessage && (
            <div className="bg-red-600 text-white p-3 rounded-lg mb-4">{errorMessage}</div>
          )}

          <button
            onClick={() => setShowManualPopup(true)}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg mb-4 glow-hover"
          >
            Add Data
          </button>
        </motion.div>

        {userData.length > 0 && (
          <motion.div
            className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Uploaded Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-gray-300 text-sm md:text-base">
                <thead>
                  <tr>
                    <th className="border border-gray-700 p-2 rounded-tl-lg whitespace-nowrap">File Name</th>
                    <th className="border border-gray-700 p-2 whitespace-nowrap">Date</th>
                    <th className="border border-gray-700 p-2 rounded-tr-lg whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.map((dataEntry) => (
                    <tr key={dataEntry._id}>
                      <td className="border border-gray-700 p-2 truncate max-w-[150px]">{dataEntry.fileName}</td>
                      <td className="border border-gray-700 p-2 whitespace-nowrap">{new Date(dataEntry.createdAt).toLocaleString()}</td>
                      <td className="border border-gray-700 p-2 flex flex-wrap gap-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditPopup(dataEntry)}
                          className="min-w-[60px] px-2 py-1 bg-orange-500 hover:bg-orange-600 text-black rounded-lg text-xs md:text-sm glow-hover"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCurrentData(dataEntry);
                            updateGraphs(dataEntry.data);
                            if (graphSectionRef.current) {
                              window.scrollTo({
                                top: graphSectionRef.current.offsetTop - 50,
                                behavior: "smooth",
                              });
                            }
                          }}
                          className="min-w-[60px] px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-xs md:text-sm glow-hover"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteData(dataEntry._id)}
                          className="min-w-[60px] px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs md:text-sm glow-hover"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(dataEntry)}
                          className="min-w-[60px] px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm glow-hover"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {currentData && (
          <motion.div
            className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6 text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p><strong>File Name:</strong> {currentData.fileName}</p>
            <p><strong>Date:</strong> {new Date(currentData.createdAt).toLocaleString()}</p>
          </motion.div>
        )}

        <motion.div
          ref={graphSectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-orange-500 mb-4">Data Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
              <h4 className="text-center font-semibold text-white mb-2">2D Bar Graph</h4>
              <canvas id="chartCanvas" width="400" height="300"></canvas>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
              <h4 className="text-center font-semibold text-white mb-2">2D Line Graph</h4>
              <div className="w-full">
                <svg ref={d3Ref} className="w-full"></svg>
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
              <h4 className="text-center font-semibold text-white mb-2">Semi-Circle Donut Chart</h4>
              <canvas id="donutCanvas" width="400" height="300"></canvas>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
              <h4 className="text-center font-semibold text-white mb-2">Pie Chart</h4>
              <canvas id="pieCanvas" width="400" height="300"></canvas>
            </div>
          </div>
        </motion.div>

        {showManualPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Add Data</h3>
              <form onSubmit={handleManualSubmit}>
                <div className="mb-4">
                  <label htmlFor="fileName" className="block text-gray-300 mb-1">File Name</label>
                  <input
                    id="fileName"
                    type="text"
                    value={manualFileName}
                    onChange={(e) => setManualFileName(e.target.value)}
                    className="border border-gray-700 bg-gray-800 text-white p-2 w-full rounded-lg glow-hover"
                    placeholder="Enter file name"
                    required
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mb-4 text-gray-300 text-sm md:text-base">
                    <thead>
                      <tr>
                        {manualColumns.map((column, index) => (
                          <th key={column} className="border border-gray-700 p-2">
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={column}
                                onChange={(e) => updateManualColumnName(index, e.target.value)}
                                onBlur={(e) => validateManualColumnName(index, e.target.value)}
                                className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded-lg glow-hover text-center"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => deleteManualColumn(column)}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg glow-hover text-xs"
                                disabled={manualColumns.length <= 1}
                              >
                                Delete
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="border border-gray-700 p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {manualColumns.map((column) => (
                            <td key={column} className="border border-gray-700 p-2">
                              <input
                                type={column === "value" ? "number" : "text"}
                                value={row[column]}
                                onChange={(e) => updateManualRow(rowIndex, column, e.target.value)}
                                className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded-lg glow-hover"
                                required
                              />
                            </td>
                          ))}
                          <td className="border border-gray-700 p-2">
                            <button
                              type="button"
                              onClick={() => deleteManualRow(rowIndex)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg glow-hover"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={addManualColumn}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Add Column
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualPopup(false);
                      setManualFileName("");
                      setErrorMessage("");
                    }}
                    className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg mr-2 glow-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {showEditPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Data</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mb-4 text-gray-300 text-sm md:text-base">
                    <thead>
                      <tr>
                        {editColumns.map((column, index) => (
                          <th key={column} className="border border-gray-700 p-2">
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={column}
                                onChange={(e) => updateEditColumnName(index, e.target.value)}
                                onBlur={(e) => validateEditColumnName(index, e.target.value)}
                                className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded-lg glow-hover text-center"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => deleteEditColumn(column)}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg glow-hover text-xs"
                                disabled={editColumns.length <= 1}
                              >
                                Delete
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="border border-gray-700 p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {editColumns.map((column) => (
                            <td key={column} className="border border-gray-700 p-2">
                              <input
                                type={column === "value" ? "number" : "text"}
                                value={row[column]}
                                onChange={(e) => updateEditRow(rowIndex, column, e.target.value)}
                                className="border border-gray-700 bg-gray-800 text-white p-1 w-full rounded-lg glow-hover"
                                required
                              />
                            </td>
                          ))}
                          <td className="border border-gray-700 p-2">
                            <button
                              type="button"
                              onClick={() => deleteEditRow(rowIndex)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg glow-hover"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={addEditRow}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={addEditColumn}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Add Column
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditPopup(false)}
                    className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg mr-2 glow-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded-lg glow-hover"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManualDataEntryPage;