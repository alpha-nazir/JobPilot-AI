const pool = require("../config/db");

// Get all public active jobs
const getAllJobs = async (req, res) => {
    try {
        const {
            search = "",
            location = "",
            jobType = "",
            workplaceType = "",
            experienceLevel = "",
            category = "",
            page = 1,
            limit = 10,
        } = req.query;

        const conditions = ["status = 'active'"];
        const values = [];

        const addFilter = (condition, value) => {
            values.push(value);
            conditions.push(condition.replace("?", `$${values.length}`));
        };

        if (search.trim()) {
            values.push(`%${search.trim()}%`);
            const index = values.length;

            conditions.push(
                `(title ILIKE $${index} OR company_name ILIKE $${index} OR description ILIKE $${index})`
            );
        }

        if (location.trim()) {
            addFilter("location ILIKE ?", `%${location.trim()}%`);
        }

        if (jobType) {
            addFilter("job_type = ?", jobType);
        }

        if (workplaceType) {
            addFilter("workplace_type = ?", workplaceType);
        }

        if (experienceLevel) {
            addFilter("experience_level = ?", experienceLevel);
        }

        if (category) {
            addFilter("category ILIKE ?", `%${category}%`);
        }

        const whereClause = conditions.join(" AND ");

        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const safeLimit = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            50
        );

        const offset = (safePage - 1) * safeLimit;

        const jobsQuery = `
            SELECT
                id,
                recruiter_id,
                title,
                company_name,
                location,
                job_type,
                workplace_type,
                experience_level,
                salary_min,
                salary_max,
                description,
                requirements,
                responsibilities,
                skills,
                category,
                application_deadline,
                created_at
            FROM jobs
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${values.length + 1}
            OFFSET $${values.length + 2}
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM jobs
            WHERE ${whereClause}
        `;

        const [jobsResult, countResult] = await Promise.all([
            pool.query(jobsQuery, [...values, safeLimit, offset]),
            pool.query(countQuery, values),
        ]);

        const totalJobs = parseInt(countResult.rows[0].total, 10);

        res.status(200).json({
            success: true,
            totalJobs,
            currentPage: safePage,
            totalPages: Math.ceil(totalJobs / safeLimit),
            jobs: jobsResult.rows,
        });

    } catch (error) {
        console.error("Get Jobs Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs.",
        });
    }
};

// Get a single active job by ID
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                recruiter_id,
                title,
                company_name,
                location,
                job_type,
                workplace_type,
                experience_level,
                salary_min,
                salary_max,
                description,
                requirements,
                responsibilities,
                skills,
                category,
                application_deadline,
                created_at
            FROM jobs
            WHERE id = $1 AND status = 'active'`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found.",
            });
        }

        res.status(200).json({
            success: true,
            job: result.rows[0],
        });

    } catch (error) {
        console.error("Get Job Details Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job details.",
        });
    }
};

// Create a new job (Recruiter only)
const createJob = async (req, res) => {
    try {
        const {
            title,
            company_name,
            location,
            job_type,
            workplace_type,
            experience_level,
            salary_min,
            salary_max,
            description,
            requirements,
            responsibilities,
            skills,
            category,
            application_deadline,
        } = req.body;

        // Required field validation
        if (
            !title?.trim() ||
            !company_name?.trim() ||
            !location?.trim() ||
            !job_type ||
            !workplace_type ||
            !experience_level ||
            !description?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required job details.",
            });
        }

        // Validate salary values
        const minSalary =
            salary_min === "" || salary_min == null
                ? null
                : Number(salary_min);

        const maxSalary =
            salary_max === "" || salary_max == null
                ? null
                : Number(salary_max);

        if (
            (minSalary !== null &&
                (!Number.isFinite(minSalary) || minSalary < 0)) ||
            (maxSalary !== null &&
                (!Number.isFinite(maxSalary) || maxSalary < 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid salary values.",
            });
        }

        if (
            minSalary !== null &&
            maxSalary !== null &&
            minSalary > maxSalary
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum salary cannot exceed maximum salary.",
            });
        }

        // Validate skills
        const jobSkills = Array.isArray(skills)
            ? skills
            : [];

        const result = await pool.query(
            `INSERT INTO jobs (
                recruiter_id,
                title,
                company_name,
                location,
                job_type,
                workplace_type,
                experience_level,
                salary_min,
                salary_max,
                description,
                requirements,
                responsibilities,
                skills,
                category,
                application_deadline,
                status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14, $15, 'active'
            )
            RETURNING *`,
            [
                req.user.userId,
                title.trim(),
                company_name.trim(),
                location.trim(),
                job_type,
                workplace_type,
                experience_level,
                minSalary,
                maxSalary,
                description.trim(),
                requirements || null,
                responsibilities || null,
                jobSkills,
                category || null,
                application_deadline || null,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Job posted successfully.",
            job: result.rows[0],
        });

    } catch (error) {
        console.error("Create Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create job.",
        });
    }
};

// Get jobs posted by the logged-in recruiter
const getRecruiterJobs = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                title,
                company_name,
                location,
                job_type,
                workplace_type,
                experience_level,
                status,
                created_at,
                application_deadline
            FROM jobs
            WHERE recruiter_id = $1
            ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            totalJobs: result.rows.length,
            jobs: result.rows,
        });

    } catch (error) {
        console.error("Get Recruiter Jobs Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch recruiter jobs.",
        });
    }
};

// Update an existing job (Recruiter only)
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const {
            title,
            company_name,
            location,
            job_type,
            workplace_type,
            experience_level,
            salary_min,
            salary_max,
            description,
            requirements,
            responsibilities,
            skills,
            category,
            application_deadline,
        } = req.body;

        if (
            !title?.trim() ||
            !company_name?.trim() ||
            !location?.trim() ||
            !job_type ||
            !workplace_type ||
            !experience_level ||
            !description?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required job details.",
            });
        }

        const minSalary =
            salary_min === "" || salary_min == null
                ? null
                : Number(salary_min);

        const maxSalary =
            salary_max === "" || salary_max == null
                ? null
                : Number(salary_max);

        if (
            (minSalary !== null &&
                (!Number.isFinite(minSalary) || minSalary < 0)) ||
            (maxSalary !== null &&
                (!Number.isFinite(maxSalary) || maxSalary < 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid salary values.",
            });
        }

        if (
            minSalary !== null &&
            maxSalary !== null &&
            minSalary > maxSalary
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum salary cannot exceed maximum salary.",
            });
        }

        const jobSkills = Array.isArray(skills) ? skills : [];

        const result = await pool.query(
            `UPDATE jobs
            SET
                title = $1,
                company_name = $2,
                location = $3,
                job_type = $4,
                workplace_type = $5,
                experience_level = $6,
                salary_min = $7,
                salary_max = $8,
                description = $9,
                requirements = $10,
                responsibilities = $11,
                skills = $12,
                category = $13,
                application_deadline = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND recruiter_id = $16
            RETURNING *`,
            [
                title.trim(),
                company_name.trim(),
                location.trim(),
                job_type,
                workplace_type,
                experience_level,
                minSalary,
                maxSalary,
                description.trim(),
                requirements || null,
                responsibilities || null,
                jobSkills,
                category || null,
                application_deadline || null,
                id,
                req.user.userId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or you do not have permission to edit it.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Job updated successfully.",
            job: result.rows[0],
        });

    } catch (error) {
        console.error("Update Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update job.",
        });
    }
};

// Delete Job (Recruiter only)
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const result = await pool.query(
            `DELETE FROM jobs
             WHERE id = $1 AND recruiter_id = $2
             RETURNING id, title`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found or you are not authorized to delete it.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Job deleted successfully!",
            job: result.rows[0],
        });

    } catch (error) {
        console.error("Delete Job Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete job.",
        });
    }
};

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    getRecruiterJobs,
    updateJob,
    deleteJob,
};