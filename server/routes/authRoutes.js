const express = require("express");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Verify authenticated user
router.get("/me", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "User authenticated successfully",
        user: req.user
    });
});

module.exports = router;