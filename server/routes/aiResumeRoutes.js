const express = require("express");
const router = express.Router();

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    analyzeResume,
    getAnalysisHistory,
} = require("../controllers/aiResumeController");

// Analyze Resume
router.post(
    "/analyze",
    authenticateToken,
    authorizeRoles("job_seeker"),
    upload.single("resume"),
    analyzeResume
);

// Get Resume Analysis History
router.get(
    "/history",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getAnalysisHistory
);

module.exports = router;