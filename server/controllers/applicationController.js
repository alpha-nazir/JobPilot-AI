const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// Submit Job Application (Job Seeker only)
const submitApplication = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { cover_letter, resume_id } = req.body;

        if (!/^\d+$/.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        // Require either an uploaded file or an existing resume ID
        if (!req.file && !resume_id) {
            return res.status(400).json({
                success: false,
                message: "Please upload or select a resume.",
            });
        }

        if (req.file && resume_id) {
            return res.status(400).json({
                success: false,
                message: "Please choose only one resume option.",
            });
        }

        // Check whether job exists and is active
        const jobResult = await pool.query(
            `SELECT id, title
             FROM jobs
             WHERE id = $1 AND status = 'active'`,
            [jobId]
        );

        if (jobResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or no longer accepting applications.",
            });
        }

        // Prevent duplicate applications
        const existingApplication = await pool.query(
            `SELECT id
             FROM applications
             WHERE job_id = $1 AND seeker_id = $2`,
            [jobId, req.user.userId]
        );

        if (existingApplication.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job.",
            });
        }

        let resumeUrl;
        let cloudinaryPublicId;

        if (req.file) {
            // Upload new resume to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "jobpilot/resumes",
                        resource_type: "raw",
                        type: "private",
                        format: "pdf",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                Readable.from(req.file.buffer).pipe(uploadStream);
            });

            resumeUrl = uploadResult.secure_url;
            cloudinaryPublicId = uploadResult.public_id;

        } else {
            // Fetch existing resume belonging to this seeker
            if (!/^\d+$/.test(String(resume_id))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resume ID.",
                });
            }

            const resumeResult = await pool.query(
                `SELECT file_url, cloudinary_public_id
                 FROM resumes
                 WHERE id = $1 AND seeker_id = $2`,
                [resume_id, req.user.userId]
            );

            if (resumeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Selected resume not found.",
                });
            }

            resumeUrl = resumeResult.rows[0].file_url;
            cloudinaryPublicId =
                resumeResult.rows[0].cloudinary_public_id;
        }

        // Save application in PostgreSQL
        const applicationResult = await pool.query(
            `INSERT INTO applications
                (job_id, seeker_id, resume_url, cloudinary_public_id, cover_letter)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, job_id, seeker_id, resume_url,
                       cloudinary_public_id, cover_letter, status, applied_at`,
            [
                jobId,
                req.user.userId,
                resumeUrl,
                cloudinaryPublicId,
                cover_letter?.trim() || null,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Your application was submitted successfully!",
            application: applicationResult.rows[0],
        });

    } catch (error) {
        console.error("Submit Application Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit your application.",
        });
    }
};


// Get Applicants for Recruiter's Jobs
const getJobApplicants = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!/^\d+$/.test(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const jobResult = await pool.query(
            `SELECT id, title, company_name
             FROM jobs
             WHERE id = $1 AND recruiter_id = $2`,
            [jobId, req.user.userId]
        );

        if (jobResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or unauthorized.",
            });
        }

        const applicantsResult = await pool.query(
            `SELECT
                a.id AS application_id,
                a.job_id,
                a.seeker_id,
                a.resume_url,
                a.cloudinary_public_id,
                a.cover_letter,
                a.status,
                a.applied_at,
                a.updated_at,
                u.full_name,
                u.email
             FROM applications a
             JOIN users u ON a.seeker_id = u.id
             WHERE a.job_id = $1
             ORDER BY a.applied_at DESC`,
            [jobId]
        );

        res.status(200).json({
            success: true,
            job: jobResult.rows[0],
            totalApplicants: applicantsResult.rows.length,
            applicants: applicantsResult.rows,
        });

    } catch (error) {
        console.error("Get Job Applicants Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch applicants.",
        });
    }
};


// Generate Secure Resume Access URL (Recruiter only)
const getApplicationResume = async (req, res) => {
    try {
        const { applicationId } = req.params;

        if (!/^\d+$/.test(applicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID.",
            });
        }

        // Verify recruiter owns the job and fetch resume Public ID
        const result = await pool.query(
            `SELECT a.cloudinary_public_id
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = $1
             AND j.recruiter_id = $2`,
            [applicationId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found or unauthorized.",
            });
        }

        const publicId = result.rows[0].cloudinary_public_id;

        if (!publicId) {
            return res.status(404).json({
                success: false,
                message: "Resume file not found.",
            });
        }

        // Generate a signed URL that expires in 10 minutes
        const expiresAt = Math.floor(Date.now() / 1000) + (10 * 60);

        const secureUrl = cloudinary.utils.private_download_url(
            publicId,
            "pdf",
            {
                resource_type: "raw",
                type: "private",
                expires_at: expiresAt,
                attachment: false,
            }
        );

        res.status(200).json({
            success: true,
            resumeUrl: secureUrl,
            expiresAt,
        });

    } catch (error) {
        console.error("Get Application Resume Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate resume access link.",
        });
    }
};

// Update Application Status (Recruiter only)
const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "applied",
            "reviewing",
            "shortlisted",
            "rejected",
            "hired",
        ];

        if (!/^\d+$/.test(applicationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID.",
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status.",
            });
        }

        const result = await pool.query(
            `UPDATE applications a
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             FROM jobs j
             WHERE a.id = $2
             AND a.job_id = j.id
             AND j.recruiter_id = $3
             RETURNING a.id, a.job_id, a.seeker_id, a.status, a.updated_at`,
            [status, applicationId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found or unauthorized.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Application status updated successfully!",
            application: result.rows[0],
        });

    } catch (error) {
        console.error("Update Application Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update application status.",
        });
    }
};


// Get Applications Submitted by Logged-in Job Seeker
const getMyApplications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                a.id AS application_id,
                a.job_id,
                j.title AS job_title,
                j.company_name,
                a.status,
                a.applied_at,
                a.updated_at
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.seeker_id = $1
             ORDER BY a.applied_at DESC`,
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            totalApplications: result.rows.length,
            applications: result.rows,
        });

    } catch (error) {
        console.error("Get My Applications Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your applications.",
        });
    }
};

module.exports = {
    submitApplication,
    getJobApplicants,
    getApplicationResume,
    updateApplicationStatus,
    getMyApplications,
};