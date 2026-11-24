const express = require("express");

const router = express.Router();

const {
  getAllJobs,
  getJobById,
  createJob,
  getRecruiterJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllJobs);

// Recruiter-only routes
router.get(
  "/recruiter/my-jobs",
  authenticateToken,
  authorizeRoles("recruiter"),
  getRecruiterJobs,
);

// Recruiter-only route
router.post(
    "/",
    authenticateToken,
    authorizeRoles("recruiter"),
    createJob
);

// Update job (Recruiter only)
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("recruiter"),
    updateJob
);

// Delete Job (Recruiter only)
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("recruiter"),
    deleteJob
);

// Public job details
router.get("/:id", getJobById);

module.exports = router;
