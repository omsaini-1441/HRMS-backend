const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const candidateSchema = new Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    minlength: [2, "Full name must be at least 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    match: [/^\+?[\d\s-]{10,15}$/, "Please provide a valid phone number"],
  },
  position: {
    type: String,
    required: [true, "Position is required"],
    trim: true,
  },
  experience: {
    type: String,
    required: [true, "Experience is required"],
    trim: true,
  },
  resume: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
  status: {
    type: String,
    enum: ["New", "Scheduled", "Ongoing", "Selected", "Rejected"],
    default: "New",
  },
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);