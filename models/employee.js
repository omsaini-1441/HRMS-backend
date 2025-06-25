const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/
  },
  phone: {
    type: String,
    required: true,
    match: /^\+?[\d\s-]{10,15}$/
  },
  position: {
    type: String,
    required: true,
    enum: ['Senior Developer', 'Human Resource Lead', 'Designer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Product Manager', 'Intern']
  },
  department: {
    type: String,
    required: true,
    enum: ['Human Resource', 'Developer', 'Designer', 'Default']
  },
  dateOfJoining: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);