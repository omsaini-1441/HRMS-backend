const Attendance = require("../models/Attendance")
const Employee = require("../models/employee")
const mongoose = require("mongoose")

// Get all attendance records with filters
const getAttendance = async (req, res) => {
  try {
    const { date, status, employeeId, startDate, endDate } = req.query
    const query = {}

    // Filter by specific date
    if (date) {
      const selectedDate = new Date(date)
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)

      query.date = {
        $gte: selectedDate,
        $lt: nextDay,
      }
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Filter by status
    if (status && status !== "Status") {
      query.status = status
    }

    // Filter by employee
    if (employeeId) {
      query.employeeId = employeeId
    }

    const attendance = await Attendance.find(query)
      .populate("employeeId", "fullName email phone position department")
      .sort({ date: -1, "employeeId.fullName": 1 })

    res.status(200).json(attendance)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    res.status(500).json({
      message: "Failed to fetch attendance records",
      error: error.message,
    })
  }
}

// Get attendance for a specific date
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params
    const selectedDate = new Date(date)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get all employees
    const employees = await Employee.find({})

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: selectedDate,
        $lt: nextDay,
      },
    }).populate("employeeId")

    // Create a map of employee attendance
    const attendanceMap = {}
    attendanceRecords.forEach((record) => {
      if (record.employeeId) {
        attendanceMap[record.employeeId._id.toString()] = record
      }
    })

    // Create response with all employees and their attendance status
    const result = employees.map((employee) => {
      const attendance = attendanceMap[employee._id.toString()]
      return {
        employee: employee,
        attendance: attendance || {
          employeeId: employee._id,
          date: selectedDate,
          status: "Present",
          task: "",
          _id: null,
        },
      }
    })

    res.status(200).json(result)
  } catch (error) {
    console.error("Error fetching attendance by date:", error)
    res.status(500).json({
      message: "Failed to fetch attendance for date",
      error: error.message,
    })
  }
}

// Create or update attendance record
const createOrUpdateAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, task, clockInTime, clockOutTime, notes } = req.body

    // Validate required fields
    if (!employeeId || !date) {
      return res.status(400).json({
        message: "Employee ID and date are required",
      })
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const selectedDate = new Date(date)

    // Find existing attendance record for the employee and date
    let attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
    })

    if (attendance) {
      // Update existing record
      attendance.status = status || attendance.status
      attendance.task = task !== undefined ? task : attendance.task
      attendance.clockInTime = clockInTime || attendance.clockInTime
      attendance.clockOutTime = clockOutTime || attendance.clockOutTime
      attendance.notes = notes !== undefined ? notes : attendance.notes

      await attendance.save()
    } else {
      // Create new record
      attendance = new Attendance({
        employeeId,
        date: new Date(date),
        status: status || "Present",
        task: task || "",
        clockInTime,
        clockOutTime,
        notes: notes || "",
      })

      await attendance.save()
    }

    // Populate employee data before sending response
    await attendance.populate("employeeId", "fullName email phone position department")

    res.status(200).json(attendance)
  } catch (error) {
    console.error("Error creating/updating attendance:", error)

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Attendance record already exists for this employee and date",
      })
    }

    res.status(500).json({
      message: "Failed to create/update attendance record",
      error: error.message,
    })
  }
}

// Update specific attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params
    const { status, task, clockInTime, clockOutTime, notes } = req.body

    const attendance = await Attendance.findById(id)
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    // Update fields
    if (status) attendance.status = status
    if (task !== undefined) attendance.task = task
    if (clockInTime) attendance.clockInTime = clockInTime
    if (clockOutTime) attendance.clockOutTime = clockOutTime
    if (notes !== undefined) attendance.notes = notes

    await attendance.save()
    await attendance.populate("employeeId", "fullName email phone position department")

    res.status(200).json(attendance)
  } catch (error) {
    console.error("Error updating attendance:", error)
    res.status(500).json({
      message: "Failed to update attendance record",
      error: error.message,
    })
  }
}

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params

    const attendance = await Attendance.findByIdAndDelete(id)
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    res.status(200).json({ message: "Attendance record deleted successfully" })
  } catch (error) {
    console.error("Error deleting attendance:", error)
    res.status(500).json({
      message: "Failed to delete attendance record",
      error: error.message,
    })
  }
}

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query

    const matchQuery = {}

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (employeeId) {
      matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId)
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const totalEmployees = await Employee.countDocuments()

    res.status(200).json({
      stats,
      totalEmployees,
    })
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    res.status(500).json({
      message: "Failed to fetch attendance statistics",
      error: error.message,
    })
  }
}

module.exports = {
  getAttendance,
  getAttendanceByDate,
  createOrUpdateAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
}
