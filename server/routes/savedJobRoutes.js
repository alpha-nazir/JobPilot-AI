const express = require("express");
const router = express.Router();

const {
    saveJob,
    getSavedJobs,
    removeSavedJob,
} = require("../controllers/savedJobController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Job Seeker: Save Job
router.post(
    "/:jobId",
    authenticateToken,
    authorizeRoles("job_seeker"),
    saveJob
);

// Job Seeker: Get Saved Jobs
router.get(
    "/",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getSavedJobs
);

// Job Seeker: Remove Saved Job
router.delete(
    "/:jobId",
    authenticateToken,
    authorizeRoles("job_seeker"),
    removeSavedJob
);

module.exports = router;