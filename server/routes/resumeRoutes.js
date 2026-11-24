const express = require("express");
const router = express.Router();

const {
    uploadResume,
    getMyResumes,
    getResumeFile,
    setPrimaryResume,
    deleteResume,
} = require("../controllers/resumeController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

// Upload Resume
router.post(
    "/upload",
    authenticateToken,
    authorizeRoles("job_seeker"),
    upload.single("resume"),
    uploadResume
);

// Get My Resumes
router.get(
    "/",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getMyResumes
);

// Get Secure Resume Viewing URL
router.get(
    "/:resumeId/view",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getResumeFile
);

// Set Primary Resume
router.put(
    "/:resumeId/primary",
    authenticateToken,
    authorizeRoles("job_seeker"),
    setPrimaryResume
);

// Delete Resume
router.delete(
    "/:resumeId",
    authenticateToken,
    authorizeRoles("job_seeker"),
    deleteResume
);

module.exports = router;