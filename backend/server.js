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
mongoose.connect(process.env.MONGO_URI, {
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
});
const User = mongoose.model("User", userSchema);

// Data Schema for storing Excel/Manual data
const dataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  data: { type: Array, required: true },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Data = mongoose.model("Data", dataSchema);

// Multer Setup for Excel Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.mimetype === "application/vnd.ms-excel") {
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

    // Emit to the specific user using their userId as a room
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

    // Emit to the specific user using their userId as a room
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
    console.log("Fetching data for userId:", req.user.userId); // Debug log
    const userData = await Data.find({ userId: req.user.userId });
    console.log("Found data:", userData); // Debug log
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

    // Emit to the specific user using their userId as a room
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

// SuperAdmin Schema and Routes
const superAdminSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 100 },
  identity: { type: Number, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 8 },
  schoolName: { type: String, required: true },
});
const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

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
    user = new User({ name, email, password: hashedPassword, schoolName });
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
    superAdmin = new SuperAdmin({ name, identity: 1, email, password: hashedPassword, schoolName });
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
      user = new User({ name, email, password: "ef45de35690ecdd11d6b8dca52657144", schoolName: "test" });
      await user.save();
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
      });
      await superAdmin.save();
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

// Test Route
app.get("/", (req, res) => res.send("API is running..."));

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room based on userId (passed from the client)
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