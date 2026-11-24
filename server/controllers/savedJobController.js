const pool = require("../config/db");

// Save Job
const saveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const seekerId = req.user.userId;

        if (!jobId || isNaN(Number(jobId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const jobResult = await pool.query(
            "SELECT id FROM jobs WHERE id = $1 AND status = 'active'",
            [jobId]
        );

        if (jobResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or inactive.",
            });
        }

        const result = await pool.query(
            `INSERT INTO saved_jobs (seeker_id, job_id)
             VALUES ($1, $2)
             ON CONFLICT (seeker_id, job_id) DO NOTHING
             RETURNING id`,
            [seekerId, jobId]
        );

        res.status(200).json({
            success: true,
            message: result.rows.length > 0
                ? "Job saved successfully."
                : "Job is already saved.",
        });

    } catch (error) {
        console.error("Save Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save job.",
        });
    }
};

// Get Saved Jobs
const getSavedJobs = async (req, res) => {
    try {
        const seekerId = req.user.userId;

        const result = await pool.query(
            `SELECT
                sj.id AS saved_job_id,
                j.*
             FROM saved_jobs sj
             JOIN jobs j ON sj.job_id = j.id
             WHERE sj.seeker_id = $1
             ORDER BY sj.id DESC`,
            [seekerId]
        );

        res.status(200).json({
            success: true,
            totalSavedJobs: result.rows.length,
            savedJobs: result.rows,
        });

    } catch (error) {
        console.error("Get Saved Jobs Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch saved jobs.",
        });
    }
};

// Remove Saved Job
const removeSavedJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const seekerId = req.user.userId;

        if (!jobId || isNaN(Number(jobId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const result = await pool.query(
            `DELETE FROM saved_jobs
             WHERE seeker_id = $1 AND job_id = $2
             RETURNING id`,
            [seekerId, jobId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Saved job not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Job removed from saved jobs.",
        });

    } catch (error) {
        console.error("Remove Saved Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove saved job.",
        });
    }
};

module.exports = {
    saveJob,
    getSavedJobs,
    removeSavedJob,
};