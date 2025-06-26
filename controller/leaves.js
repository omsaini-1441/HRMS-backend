const Leave = require("../models/leaves")
const Employee = require("../models/employee")
const path = require("path")
const fs = require("fs")

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "../uploads/leave-documents")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log("Created uploads directory:", uploadsDir)
  }
}

// Get all leaves with database
const getLeaves = async (req, res) => {
  try {
    console.log("getLeaves called")

    const { status } = req.query
    const query = {}

    if (status && status !== "Status") {
      query.status = status
    }

    // Exclude document data from the response to improve performance
    const leaves = await Leave.find(query)
      .populate("employeeId", "fullName email phone position department")
      .select("-documents.data")
      .sort({ appliedDate: -1 })

    res.status(200).json(leaves)
  } catch (error) {
    console.error("Error fetching leaves:", error)
    res.status(500).json({
      message: "Failed to fetch leaves",
      error: error.message,
    })
  }
}

// Create new leave with MongoDB document storage
const createLeave = async (req, res) => {
  try {
    console.log("createLeave called with:", req.body)
    console.log("File uploaded:", req.file)

    const { employeeId, leaveType, startDate, endDate, reason, designation } = req.body

    if (!employeeId || !leaveType || !startDate || !endDate || !reason || !designation) {
      return res.status(400).json({
        message: "All required fields must be provided",
      })
    }

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const timeDiff = end.getTime() - start.getTime()
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

    const leaveData = {
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      designation,
      totalDays,
    }

    // Add document data if file is uploaded
    if (req.file) {
      leaveData.documents = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      }
    }

    const newLeave = new Leave(leaveData)
    await newLeave.save()

    // Populate employee data and exclude document data from response
    await newLeave.populate("employeeId", "fullName email phone position department")

    // Create response object without document data
    const responseLeave = newLeave.toObject()
    if (responseLeave.documents && responseLeave.documents.data) {
      responseLeave.documents = {
        filename: responseLeave.documents.filename,
        contentType: responseLeave.documents.contentType,
        hasDocument: true,
      }
    }

    console.log("Leave created successfully:", newLeave._id)
    res.status(201).json(responseLeave)
  } catch (error) {
    console.error("Error creating leave:", error)
    res.status(500).json({
      message: "Failed to create leave application",
      error: error.message,
    })
  }
}

// Calendar function with database 
const getLeavesForCalendar = async (req, res) => {
  try {
    console.log("getLeavesForCalendar called with query:", req.query)

    const { month, year } = req.query

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    console.log("Querying leaves between:", startDate, "and", endDate)

    const leaves = await Leave.find({
      status: "Approved",
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    })
      .populate("employeeId", "fullName position")
      .select("-documents.data")

    console.log("Found leaves:", leaves.length)

    const leavesByDate = {}

    leaves.forEach((leave) => {
      const leaveStart = new Date(leave.startDate)
      const leaveEnd = new Date(leave.endDate)

      // Generate all dates between start and end
      const currentDate = new Date(leaveStart)
      while (currentDate <= leaveEnd) {
        if (currentDate >= startDate && currentDate <= endDate) {
          // Use local date string to avoid timezone issues
          const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
            2,
            "0",
          )}-${String(currentDate.getDate()).padStart(2, "0")}`

          if (!leavesByDate[dateKey]) {
            leavesByDate[dateKey] = []
          }
          leavesByDate[dateKey].push({
            _id: leave._id,
            employee: leave.employeeId,
            leaveType: leave.leaveType,
          })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    res.status(200).json(leavesByDate)
  } catch (error) {
    console.error("Error in getLeavesForCalendar:", error)
    res.status(500).json({
      message: "Failed to fetch calendar leaves",
      error: error.message,
    })
  }
}

// Get leaves for specific date
const getLeavesByDate = async (req, res) => {
  try {
    const { date } = req.params
    const selectedDate = new Date(date)

    const leaves = await Leave.find({
      status: "Approved",
      startDate: { $lte: selectedDate },
      endDate: { $gte: selectedDate },
    })
      .populate("employeeId", "fullName position department")
      .select("-documents.data")

    res.status(200).json(leaves)
  } catch (error) {
    console.error("Error fetching leaves by date:", error)
    res.status(500).json({
      message: "Failed to fetch leaves for date",
      error: error.message,
    })
  }
}

// Download document from MongoDB
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params

    const leave = await Leave.findById(id).select("documents")
    if (!leave || !leave.documents || !leave.documents.data) {
      return res.status(404).json({ message: "Document not found" })
    }

    res.set({
      "Content-Type": leave.documents.contentType,
      "Content-Disposition": `attachment; filename="${leave.documents.filename}"`,
    })
    res.send(leave.documents.data)
  } catch (error) {
    console.error("Error downloading document:", error)
    res.status(500).json({
      message: "Failed to download document",
      error: error.message,
    })
  }
}

// Update leave status
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const leave = await Leave.findById(id)
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" })
    }

    leave.status = status
    await leave.save()
    await leave.populate("employeeId", "fullName email phone position department")

    // Create response object without document data
    const responseLeave = leave.toObject()
    if (responseLeave.documents && responseLeave.documents.data) {
      responseLeave.documents = {
        filename: responseLeave.documents.filename,
        contentType: responseLeave.documents.contentType,
        hasDocument: true,
      }
    }

    res.status(200).json(responseLeave)
  } catch (error) {
    console.error("Error updating leave status:", error)
    res.status(500).json({
      message: "Failed to update leave status",
      error: error.message,
    })
  }
}

// Delete leave
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params

    const leave = await Leave.findById(id)
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" })
    }

    // No need to delete files from filesystem since they're stored in MongoDB
    await Leave.findByIdAndDelete(id)
    res.status(200).json({ message: "Leave application deleted successfully" })
  } catch (error) {
    console.error("Error deleting leave:", error)
    res.status(500).json({
      message: "Failed to delete leave application",
      error: error.message,
    })
  }
}

// Get leave statistics
const getLeaveStats = async (req, res) => {
  try {
    const totalLeaves = await Leave.countDocuments()
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" })
    const approvedLeaves = await Leave.countDocuments({ status: "Approved" })
    const rejectedLeaves = await Leave.countDocuments({ status: "Rejected" })

    res.status(200).json({
      total: totalLeaves,
      pending: pendingLeaves,
      approved: approvedLeaves,
      rejected: rejectedLeaves,
    })
  } catch (error) {
    console.error("Error fetching leave stats:", error)
    res.status(500).json({
      message: "Failed to fetch leave statistics",
      error: error.message,
    })
  }
}

module.exports = {
  getLeaves,
  createLeave,
  getLeavesForCalendar,
  getLeavesByDate,
  downloadDocument,
  updateLeaveStatus,
  deleteLeave,
  getLeaveStats,
}
