const pool = require("../config/db");

// Get Admin Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const [
            usersResult,
            jobsResult,
            applicationsResult,
            interviewsResult
        ] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(*) AS total_users,
                    COUNT(*) FILTER (WHERE role = 'job_seeker') AS total_seekers,
                    COUNT(*) FILTER (WHERE role = 'recruiter') AS total_recruiters,
                    COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
                    COUNT(*) FILTER (WHERE is_active = true) AS active_users,
                    COUNT(*) FILTER (WHERE is_active = false) AS inactive_users
                FROM users
            `),
            pool.query(`
                SELECT
                    COUNT(*) AS total_jobs,
                    COUNT(*) FILTER (WHERE status = 'active') AS active_jobs
                FROM jobs
            `),
            pool.query(`
                SELECT COUNT(*) AS total_applications
                FROM applications
            `),
            pool.query(`
                SELECT COUNT(*) AS total_interviews
                FROM interviews
            `)
        ]);

        res.status(200).json({
            success: true,
            stats: {
                ...usersResult.rows[0],
                ...jobsResult.rows[0],
                ...applicationsResult.rows[0],
                ...interviewsResult.rows[0]
            }
        });

    } catch (error) {
        console.error("Admin dashboard error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics."
        });
    }
};

// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        const result = await pool.query(
            `SELECT
                id,
                full_name,
                email,
                role,
                is_active,
                created_at
             FROM users
             WHERE ($1::text IS NULL OR role = $1)
             AND (
                $2::text IS NULL
                OR full_name ILIKE '%' || $2 || '%'
                OR email ILIKE '%' || $2 || '%'
             )
             ORDER BY created_at DESC`,
            [role || null, search || null]
        );

        res.status(200).json({
            success: true,
            totalUsers: result.rows.length,
            users: result.rows
        });

    } catch (error) {
        console.error("Admin users error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users."
        });
    }
};

// Activate / Deactivate User
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;

        if (!/^\d+$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "is_active must be true or false."
            });
        }

        if (Number(userId) === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own account."
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET is_active = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, full_name, email, role, is_active`,
            [is_active, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${is_active ? "activated" : "deactivated"} successfully.`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Update user status error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update user status."
        });
    }
};

// Get All Jobs
const getAllJobs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                j.id,
                j.title,
                j.company_name,
                j.location,
                j.job_type,
                j.status,
                j.created_at,
                u.full_name AS recruiter_name,
                u.email AS recruiter_email
            FROM jobs j
            JOIN users u ON j.recruiter_id = u.id
            ORDER BY j.created_at DESC
        `);

        res.status(200).json({
            success: true,
            totalJobs: result.rows.length,
            jobs: result.rows
        });

    } catch (error) {
        console.error("Admin jobs error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs."
        });
    }
};

// Delete Job
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!/^\d+$/.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID."
            });
        }

        const result = await pool.query(
            "DELETE FROM jobs WHERE id = $1 RETURNING id",
            [jobId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Job deleted successfully."
        });

    } catch (error) {
        console.error("Admin delete job error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete job. It may have related applications."
        });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    getAllJobs,
    deleteJob
};