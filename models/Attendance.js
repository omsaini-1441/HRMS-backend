const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Medical Leave", "Work from Home"],
      default: "Present",
    },
    task: {
      type: String,
      default: "",
    },
    clockInTime: {
      type: Date,
    },
    clockOutTime: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Create compound index for employeeId and date to ensure one record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })

// Virtual to format date
attendanceSchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0]
})

// Method to check if attendance is for today
attendanceSchema.methods.isToday = function () {
  const today = new Date()
  const attendanceDate = new Date(this.date)
  return today.toDateString() === attendanceDate.toDateString()
}

// Static method to get attendance by date range
attendanceSchema.statics.getByDateRange = function (startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).populate("employeeId")
}

module.exports = mongoose.model("Attendance", attendanceSchema)
