const express = require("express")
const router = express.Router()
const {
  getAttendance,
  getAttendanceByDate,
  createOrUpdateAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
} = require("../controller/Attendance") // Assuming you have a controller for attendance
const auth = require("../middleware/auth") // Assuming you have auth middleware

// Apply authentication middleware to all routes
router.use(auth)

// GET /api/attendance - Get all attendance records with filters
router.get("/", getAttendance)

// GET /api/attendance/stats - Get attendance statistics
router.get("/stats", getAttendanceStats)

// GET /api/attendance/date/:date - Get attendance for specific date
router.get("/date/:date", getAttendanceByDate)

// POST /api/attendance - Create or update attendance record
router.post("/", createOrUpdateAttendance)

// PUT /api/attendance/:id - Update specific attendance record
router.put("/:id", updateAttendance)

// DELETE /api/attendance/:id - Delete attendance record
router.delete("/:id", deleteAttendance)

module.exports = router
