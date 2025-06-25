const express = require('express');
const router = express.Router();
const { createCandidate, getCandidates, updateCandidateStatus, deleteCandidate, downloadResume } = require('../controller/candidate');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, upload.single('resume'), createCandidate);
router.get('/', authMiddleware, getCandidates);
router.patch('/:id', authMiddleware, updateCandidateStatus);
router.delete('/:id', authMiddleware, deleteCandidate);
router.get('/:id/resume', authMiddleware, downloadResume);

module.exports = router;