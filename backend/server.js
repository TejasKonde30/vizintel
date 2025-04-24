require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const multer = require("multer");
const XLSX = require("xlsx");
const { Server } = require("socket.io");
const http = require("http");
const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 100 },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 8 },
  schoolName: { type: String, required: true },
  isSuspended: { type: Boolean, default: false },
  authType: { type: String, enum: ["manual", "google"], default: "manual" },
});
const User = mongoose.model("User", userSchema);

// SuperAdmin Schema
const superAdminSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 100 },
  identity: { type: Number, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 8 },
  schoolName: { type: String, required: true },
  isSuspended: { type: Boolean, default: false },
  authType: { type: String, enum: ["manual", "google"], default: "manual" },
});
const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

// Data Schema for storing Excel/Manual data
const dataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  data: { type: Array, required: true },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Data = mongoose.model("Data", dataSchema);

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Resolved", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});
const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

// Multer Setup for Excel Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "Uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ message: "Token expired" });
      }
      return res.status(403).json({ message: "Invalid token", error: err.message });
    }
    req.user = decoded;
    next();
  });
};

// Get All Users
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, "name email _id");
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get All Data Entries
app.get("/api/data/all", authenticateToken, async (req, res) => {
  try {
    const data = await Data.find({}, "userId fileName createdAt _id");
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Data for a Specific User
app.get("/api/data/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await Data.find({ userId });
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No data found for this user" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Register User
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, schoolName } = req.body;
  try {
    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, schoolName, authType: "manual" });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.isSuspended) return res.status(403).json({ message: "Account suspended" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({
      message: "Login successful",
      authToken: token,
      email,
      name: user.name,
      identity: 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Register SuperAdmin
app.post("/api/auth/superadminregister", async (req, res) => {
  const { name, identity, email, password, schoolName } = req.body;
  try {
    if (!name || !email || !password || !schoolName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    let superAdmin = await SuperAdmin.findOne({ email });
    if (superAdmin) return res.status(400).json({ message: "Admin already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    superAdmin = new SuperAdmin({ name, identity: 1, email, password: hashedPassword, schoolName, authType: "manual" });
    await superAdmin.save();
    res.status(201).json({ message: "SuperAdmin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login SuperAdmin
app.post("/api/auth/superadminlogin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) return res.status(400).json({ message: "Invalid credentials" });
    if (superAdmin.isSuspended) return res.status(403).json({ message: "Account suspended" });
    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: superAdmin._id, role: "superadmin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({
      message: "SuperAdmin login successful",
      authToken: token,
      email,
      name: superAdmin.name,
      identity: 1,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Google Auth User
app.post("/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    const { email, name } = googleResponse.data;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, password: "ef45de35690ecdd11d6b8dca52657144", schoolName: "test", authType: "google" });
      await user.save();
    } else if (user.isSuspended) {
      return res.status(403).json({ message: "Account suspended" });
    }
    const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({
      message: "User login successful",
      authToken,
      email,
      name: user.name,
      identity: 0,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token" });
  }
});

// Google Auth Admin
app.post("/adminAuth/google", async (req, res) => {
  try {
    const { token } = req.body;
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    const { email, name } = googleResponse.data;
    let superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      superAdmin = new SuperAdmin({
        name,
        email,
        password: "ef45de35690ecdd11d6b8dca52657144",
        schoolName: "test",
        identity: 1,
        authType: "google",
      });
      await superAdmin.save();
    } else if (superAdmin.isSuspended) {
      return res.status(403).json({ message: "Account suspended" });
    }
    const authToken = jwt.sign({ userId: superAdmin._id, role: "superadmin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({
      message: "SuperAdmin login successful",
      authToken,
      email,
      name: superAdmin.name,
      identity: 1,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token" });
  }
});

// Get User Profile Route (Case-Insensitive Search)
app.get("/api/user/profile", async (req, res) => {
  const { email, name } = req.query;
  try {
    const query = {};
    if (email) query.email = { $regex: email, $options: "i" };
    if (name) query.name = { $regex: name, $options: "i" };
    const users = await User.find(query);
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update User Route (Handle Suspend and Other Updates)
app.put("/api/user/manage", async (req, res) => {
  const { email } = req.query;
  const { newPassword, newname, newschoolName, suspend } = req.body;
  try {
    const query = {};
    if (email) query.email = { $regex: email, $options: "i" };
    let users = await User.find(query);
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    if (users.length > 1) {
      return res.status(400).json({ message: "Multiple users found; please specify a unique email" });
    }
    const user = users[0];
    if (newPassword) user.password = await bcrypt.hash(newPassword, 10);
    if (newname) user.name = newname;
    if (newschoolName) user.schoolName = newschoolName;
    if (suspend !== undefined) user.isSuspended = suspend;
    await user.save();
    res.json({ message: `User ${user.email} updated successfully`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Excel Upload Route
app.post("/api/data/upload", authenticateToken, upload.single("excel"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const newData = new Data({ userId: req.user.userId, data, fileName: req.file.originalname });
    await newData.save();
    io.to(req.user.userId.toString()).emit("dataUpdate", {
      userId: req.user.userId,
      data,
      fileName: req.file.originalname,
      _id: newData._id,
    });
    res.json({ message: "Excel data uploaded successfully", data, fileName: req.file.originalname, _id: newData._id });
  } catch (error) {
    res.status(500).json({ message: "Error uploading Excel", error: error.message });
  }
});

// Manual Data Entry Route
app.post("/api/data/manual", authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }
    const newData = new Data({ userId: req.user.userId, data, fileName: "Manual Entry" });
    await newData.save();
    io.to(req.user.userId.toString()).emit("dataUpdate", {
      userId: req.user.userId,
      data,
      fileName: "Manual Entry",
      _id: newData._id,
    });
    res.json({ message: "Manual data added successfully", data, fileName: "Manual Entry", _id: newData._id });
  } catch (error) {
    res.status(500).json({ message: "Error adding manual data", error: error.message });
  }
});

// Fetch User Data Route
app.get("/api/data", authenticateToken, async (req, res) => {
  try {
    const userData = await Data.find({ userId: req.user.userId });
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});

// Update Data Route
app.put("/api/data/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid data format" });
    }
    const existingData = await Data.findOne({ _id: id, userId: req.user.userId });
    if (!existingData) {
      return res.status(404).json({ message: "Data not found" });
    }
    existingData.data = data;
    existingData.createdAt = new Date();
    await existingData.save();
    io.to(req.user.userId.toString()).emit("dataUpdate", {
      userId: req.user.userId,
      data,
      fileName: existingData.fileName,
      _id: existingData._id,
    });
    res.json({ message: "Data updated successfully", data, fileName: existingData.fileName });
  } catch (error) {
    res.status(500).json({ message: "Error updating data", error: error.message });
  }
});

// Delete Data Route
app.delete("/api/data/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dataEntry = await Data.findOne({ _id: id, userId: req.user.userId });
    if (!dataEntry) {
      return res.status(404).json({ message: "Data not found" });
    }
    await Data.deleteOne({ _id: id });
    res.json({ message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting data", error: error.message });
  }
});

// Password Reset
app.post("/api/auth/password-reset", async (req, res) => {
  const { email, schoolName, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.schoolName !== schoolName) {
      return res.status(400).json({ message: "Incorrect security answer" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Test Route
app.get("/", (req, res) => res.send("API is running..."));

// Get Users Count
app.get("/api/users/count", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// Get Data Count
app.get("/api/datas/count", async (req, res) => {
  try {
    const totaldata = await Data.countDocuments();
    res.json({ totaldata });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// Create Support Ticket (User)
app.post("/api/support", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "User ID and message are required" });
    }
    const newTicket = new SupportTicket({ userId, message });
    await newTicket.save();
    res.status(201).json({ message: "Support ticket created successfully", ticket: newTicket });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get All Support Tickets (Admin Panel)
app.get("/api/support/admin", async (req, res) => {
  try {
    const tickets = await SupportTicket.find();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get All Tickets for a Specific User
app.get("/api/support/:userId", async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.params.userId });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Ticket Status (Admin)
app.put("/api/support/:ticketId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Resolved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.ticketId,
      { status },
      { new: true }
    );
    if (!updatedTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json({ message: "Ticket updated successfully", updatedTicket });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Support Ticket (Admin)
app.delete("/api/support/:ticketId", async (req, res) => {
  try {
    const deletedTicket = await SupportTicket.findByIdAndDelete(req.params.ticketId);
    if (!deletedTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Traffic Schema
const TrafficSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  count: { type: Number, default: 0 },
});
const Traffic = mongoose.model("Traffic", TrafficSchema);

// Middleware to track traffic (e.g., page views)
app.use(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    await Traffic.findOneAndUpdate(
      { date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error tracking traffic:", err);
  }
  next();
});

// API to get weekly traffic data
app.get("/api/traffic/week", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const traffic = await Traffic.find({
      date: { $gte: weekAgo, $lte: today },
    }).sort({ date: 1 });

    const trafficCounts = Array(7).fill(0);
    traffic.forEach((t) => {
      const dayIndex = Math.floor((t.date - weekAgo) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        trafficCounts[dayIndex] = t.count;
      }
    });

    res.json({ trafficCounts });
  } catch (err) {
    console.error("Error fetching traffic data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User ${userId} joined room ${userId}`);
    }
  });
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));