require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dayjs = require("dayjs");
const dayjsRecur = require("dayjs-recur");

// Import configurations and routes
const { db, connect } = require("./config/database");
const { authenticateToken, requireRole, limiter } = require("./config/security");
 
const userRoutes = require("./routes/users");
const profileRoutes = require("./routes/profile");
const projectRoutes = require("./routes/projects");
const boardRoutes = require("./routes/board");
const councilRoutes = require("./routes/council")
const clubRoutes = require("./routes/clubs");
const meetingRoutes = require("./routes/meeting");
const attendanceRoutes = require("./routes/attendance")

// Initialize dayjs plugins
dayjs.extend(dayjsRecur);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Routes
//app.use("/users", authRoutes);
app.use("/", userRoutes);
app.use("/", profileRoutes);
app.use("/", projectRoutes);
app.use("/", boardRoutes);
app.use("/", councilRoutes);
app.use("/", clubRoutes);
app.use("/", meetingRoutes);
app.use("/", attendanceRoutes);

app.post("/users/verify-token", authenticateToken, (req, res) => {
  //console.log("ran")
  res.json({ 
    valid: true, 
    user: req.user,
    message: "Token is valid" 
  });
});


// Additional routes that aren't sorted yet

app.post("/send-messages", async (req, res) => {
  const { senderId } = req.body;
  const query = "SELECT * FROM boardmember WHERE member_id = ?";
  db.query(query, [senderId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json(result);
  });
});


// Start server
app.listen(+process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ` + process.env.PORT);
});

//connect()

module.exports = app;