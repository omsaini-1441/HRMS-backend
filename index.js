const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidate");
const employeeRoutes = require("./routes/employee");
const attendanceRoutes = require("./routes/attendance")
const leaveRoutes = require("./routes/leaves")
require("dotenv").config();
require("./config/db");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes)
app.use("/api/leaves", leaveRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));