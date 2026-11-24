const express = require("express");
const router = express.Router();

const {
    submitApplication,
    getJobApplicants,
    getApplicationResume,
    updateApplicationStatus,
    getMyApplications,
} = require("../controllers/applicationController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

// Job Seeker: Submit Application
router.post(
    "/:jobId/apply",
    authenticateToken,
    authorizeRoles("job_seeker"),
    upload.single("resume"),
    submitApplication
);

// Job Seeker: Get My Applications
router.get(
    "/my-applications",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getMyApplications
);

// Recruiter: Get Applicants
router.get(
    "/job/:jobId",
    authenticateToken,
    authorizeRoles("recruiter"),
    getJobApplicants
);

// Recruiter: Securely View Applicant Resume
router.get(
    "/:applicationId/resume",
    authenticateToken,
    authorizeRoles("recruiter"),
    getApplicationResume
);

// Recruiter: Update Application Status
router.put(
    "/:applicationId/status",
    authenticateToken,
    authorizeRoles("recruiter"),
    updateApplicationStatus
);

module.exports = router;