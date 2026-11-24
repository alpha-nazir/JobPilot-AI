const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    getAllJobs,
    deleteJob
} = require("../controllers/adminController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

// All routes require Admin authentication
router.use(authenticateToken, authorizeRoles("admin"));

// Dashboard Statistics
router.get("/dashboard", getDashboardStats);

// Manage Users
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);

// Manage Jobs
router.get("/jobs", getAllJobs);
router.delete("/jobs/:jobId", deleteJob);

module.exports = router;