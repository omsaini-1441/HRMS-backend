const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["Sick Leave", "Casual Leave", "Annual Leave", "Maternity Leave", "Paternity Leave", "Emergency Leave"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
    },
    documents: {
      data: Buffer,
      contentType: String,
      filename: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    totalDays: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Leave", leaveSchema)
