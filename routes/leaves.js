const express = require("express")
const router = express.Router()
const multer = require("multer")
const {
  getLeaves,
  createLeave,
  getLeavesForCalendar,
  getLeavesByDate,
  downloadDocument,
  updateLeaveStatus,
  deleteLeave,
  getLeaveStats,
} = require("../controller/leaves")

// Configure multer for memory storage (MongoDB storage)
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only images, PDFs, and Word documents are allowed"))
    }
  },
})

// Routes
router.get("/", getLeaves)
router.post("/", upload.single("documents"), createLeave)
router.get("/calendar", getLeavesForCalendar)
router.get("/stats", getLeaveStats)
router.get("/date/:date", getLeavesByDate)
router.get("/:id/document", downloadDocument)
router.put("/:id/status", updateLeaveStatus)
router.delete("/:id", deleteLeave)

module.exports = router
