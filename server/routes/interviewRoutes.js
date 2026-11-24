const express = require("express");
const router = express.Router();

const {
    getInterviews,
    scheduleInterview,
    updateInterview,
} = require("../controllers/interviewController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Get interviews
router.get(
    "/",
    authenticateToken,
    authorizeRoles("job_seeker", "recruiter"),
    getInterviews
);

// Schedule interview (Recruiter only)
router.post(
    "/",
    authenticateToken,
    authorizeRoles("recruiter"),
    scheduleInterview
);

// Update interview (Recruiter only)
router.put(
    "/:interviewId",
    authenticateToken,
    authorizeRoles("recruiter"),
    updateInterview
);

module.exports = router;