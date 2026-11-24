const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Welcome Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to JobPilot AI API"
    });
});

// Database Connection Test
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time, current_database() AS database_name"
        );

        res.status(200).json({
            success: true,
            message: "Database connected successfully",
            database: result.rows[0].database_name,
            time: result.rows[0].current_time
        });

    } catch (error) {
        console.error("Database test failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Authentication Routes

const jobRoutes = require("./routes/jobRoutes");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const aiResumeRoutes = require("./routes/aiResumeRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const adminRoutes = require("./routes/adminRoutes");


app.use("/api/jobs", jobRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/ai-resume", aiResumeRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", adminRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`JobPilot AI server running on port ${PORT}`);
});