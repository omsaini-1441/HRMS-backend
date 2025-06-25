const Candidate = require('../models/candidate');

const createCandidate = async (req, res) => {
  try {
    const { fullName, email, phone, position, experience } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const candidate = new Candidate({
      fullName,
      email,
      phone,
      position,
      experience,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      },
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({
      message: error.message || 'Failed to create candidate',
      error: error.message,
    });
  }
};

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().select('-resume.data');
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch candidates',
      error: error.message,
    });
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["New", "Scheduled", "Ongoing", "Selected", "Rejected"].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-resume.data');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json(candidate);
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update candidate',
      error: error.message,
    });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete candidate',
      error: error.message,
    });
  }
};

const downloadResume = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).select('resume');
    if (!candidate || !candidate.resume.data) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.set({
      'Content-Type': candidate.resume.contentType,
      'Content-Disposition': `attachment; filename="${candidate.resume.filename}"`,
    });
    res.send(candidate.resume.data);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to download resume',
      error: error.message,
    });
  }
};

module.exports = { createCandidate, getCandidates, updateCandidateStatus, deleteCandidate, downloadResume };