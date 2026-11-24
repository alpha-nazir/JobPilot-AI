const pool = require("../config/db");

// Get interviews for logged-in user
const getInterviews = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        let query;
        let values = [userId];

        if (role === "job_seeker") {
            query = `
                SELECT
                    i.*,
                    a.seeker_id,
                    j.title AS job_title,
                    j.company_name,
                    r.full_name AS recruiter_name
                FROM interviews i
                JOIN applications a ON i.application_id = a.id
                JOIN jobs j ON a.job_id = j.id
                JOIN users r ON j.recruiter_id = r.id
                WHERE a.seeker_id = $1
                ORDER BY i.interview_date ASC
            `;
        } else if (role === "recruiter") {
            query = `
                SELECT
                    i.*,
                    a.seeker_id,
                    j.title AS job_title,
                    j.company_name,
                    s.full_name AS seeker_name,
                    s.email AS seeker_email
                FROM interviews i
                JOIN applications a ON i.application_id = a.id
                JOIN jobs j ON a.job_id = j.id
                JOIN users s ON a.seeker_id = s.id
                WHERE j.recruiter_id = $1
                ORDER BY i.interview_date ASC
            `;
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            totalInterviews: result.rows.length,
            interviews: result.rows,
        });

    } catch (error) {
        console.error("Get Interviews Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch interviews.",
        });
    }
};


// Schedule an interview (Recruiter only)
const scheduleInterview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { application_id, interview_date, interview_type,
            meeting_link, location, notes } = req.body;

        if (!application_id || !/^\d+$/.test(String(application_id))) {
            return res.status(400).json({
                success: false,
                message: "Valid application ID is required.",
            });
        }

        if (!interview_date || isNaN(Date.parse(interview_date))) {
            return res.status(400).json({
                success: false,
                message: "Valid interview date is required.",
            });
        }

        if (new Date(interview_date) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Interview date must be in the future.",
            });
        }

        const application = await pool.query(
            `SELECT a.id
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = $1 AND j.recruiter_id = $2`,
            [application_id, userId]
        );

        if (application.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found or access denied.",
            });
        }

        const result = await pool.query(
            `INSERT INTO interviews (
                application_id,
                scheduled_by,
                interview_date,
                interview_type,
                meeting_link,
                location,
                notes,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
            RETURNING *`,
            [
                application_id,
                userId,
                interview_date,
                interview_type || null,
                meeting_link || null,
                location || null,
                notes || null,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Interview scheduled successfully.",
            interview: result.rows[0],
        });

    } catch (error) {
        console.error("Schedule Interview Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to schedule interview.",
        });
    }
};


// Update interview (Recruiter only)
const updateInterview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { interviewId } = req.params;

        if (!/^\d+$/.test(interviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID.",
            });
        }

        const {
            interview_date,
            interview_type,
            meeting_link,
            location,
            notes,
            status,
        } = req.body;

        const allowedStatuses = [
            "scheduled",
            "completed",
            "cancelled",
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview status.",
            });
        }

        if (
            interview_date &&
            (isNaN(Date.parse(interview_date)) ||
                new Date(interview_date) <= new Date())
        ) {
            if (status !== "completed" && status !== "cancelled") {
                return res.status(400).json({
                    success: false,
                    message: "Scheduled interview date must be in the future.",
                });
            }
        }

        const result = await pool.query(
            `UPDATE interviews i
             SET
                interview_date = COALESCE($1, i.interview_date),
                interview_type = COALESCE($2, i.interview_type),
                meeting_link = COALESCE($3, i.meeting_link),
                location = COALESCE($4, i.location),
                notes = COALESCE($5, i.notes),
                status = COALESCE($6, i.status),
                updated_at = CURRENT_TIMESTAMP
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE i.application_id = a.id
               AND i.id = $7
               AND j.recruiter_id = $8
             RETURNING i.*`,
            [
                interview_date || null,
                interview_type ?? null,
                meeting_link ?? null,
                location ?? null,
                notes ?? null,
                status || null,
                interviewId,
                userId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Interview not found or access denied.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Interview updated successfully.",
            interview: result.rows[0],
        });

    } catch (error) {
        console.error("Update Interview Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update interview.",
        });
    }
};


module.exports = {
    getInterviews,
    scheduleInterview,
    updateInterview,
};