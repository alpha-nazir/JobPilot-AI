const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// Upload Resume
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF resume.",
            });
        }

        // Check existing resumes
        const existingResumes = await pool.query(
            `SELECT id FROM resumes
             WHERE seeker_id = $1`,
            [req.user.userId]
        );

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "jobpilot/resumes",
                    resource_type: "raw",
                    type: "private",
                    format: "pdf",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            Readable.from(req.file.buffer).pipe(uploadStream);
        });

        // Save resume in PostgreSQL
        const result = await pool.query(
            `INSERT INTO resumes
                (seeker_id, file_name, file_url, file_type,
                 is_primary, cloudinary_public_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                req.user.userId,
                req.file.originalname,
                uploadResult.secure_url,
                req.file.mimetype,
                existingResumes.rows.length === 0,
                uploadResult.public_id,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Resume uploaded successfully!",
            resume: result.rows[0],
        });

    } catch (error) {
        console.error("Upload Resume Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to upload resume.",
        });
    }
};

// Get Secure Resume Viewing URL
const getResumeFile = async (req, res) => {
    try {
        const { resumeId } = req.params;

        if (!/^\d+$/.test(resumeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        const result = await pool.query(
            `SELECT cloudinary_public_id
             FROM resumes
             WHERE id = $1 AND seeker_id = $2`,
            [resumeId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        const publicId = result.rows[0].cloudinary_public_id;

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
        });

    } catch (error) {
        console.error("Get Resume File Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate resume viewing link.",
        });
    }
};

// Set Primary Resume
const setPrimaryResume = async (req, res) => {
    const client = await pool.connect();

    try {
        const { resumeId } = req.params;

        if (!/^\d+$/.test(resumeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        await client.query("BEGIN");

        const resumeResult = await client.query(
            `SELECT id
             FROM resumes
             WHERE id = $1 AND seeker_id = $2
             FOR UPDATE`,
            [resumeId, req.user.userId]
        );

        if (resumeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        await client.query(
            `UPDATE resumes
             SET is_primary = false
             WHERE seeker_id = $1`,
            [req.user.userId]
        );

        await client.query(
            `UPDATE resumes
             SET is_primary = true,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND seeker_id = $2`,
            [resumeId, req.user.userId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Primary resume updated successfully!",
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Set Primary Resume Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update primary resume.",
        });

    } finally {
        client.release();
    }
};

// Delete Resume
const deleteResume = async (req, res) => {
    let client;

    try {
        const { resumeId } = req.params;

        if (!/^\d+$/.test(resumeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        client = await pool.connect();

        await client.query("BEGIN");

        const result = await client.query(
            `SELECT cloudinary_public_id, is_primary
             FROM resumes
             WHERE id = $1 AND seeker_id = $2
             FOR UPDATE`,
            [resumeId, req.user.userId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        const { cloudinary_public_id: publicId, is_primary: wasPrimary } =
            result.rows[0];

        await client.query(
            `DELETE FROM resumes
             WHERE id = $1 AND seeker_id = $2`,
            [resumeId, req.user.userId]
        );

        // Assign another resume as Primary if the deleted one was Primary
        if (wasPrimary) {
            await client.query(
                `UPDATE resumes
                 SET is_primary = FALSE
                 WHERE seeker_id = $1`,
                [req.user.userId]
            );

            const nextResume = await client.query(
                `SELECT id
                 FROM resumes
                 WHERE seeker_id = $1
                 ORDER BY created_at DESC, id DESC
                 LIMIT 1`,
                [req.user.userId]
            );

            if (nextResume.rows.length > 0) {
                await client.query(
                    `UPDATE resumes
                     SET is_primary = TRUE,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [nextResume.rows[0].id]
                );
            }
        }

        await client.query("COMMIT");

        // Delete the Cloudinary file
        if (publicId) {
    try {
        const applicationCheck = await pool.query(
            `SELECT id
             FROM applications
             WHERE cloudinary_public_id = $1
             LIMIT 1`,
            [publicId]
        );

        // Delete Cloudinary file only if no application uses it
        if (applicationCheck.rows.length === 0) {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: "raw",
                type: "private",
            });
        }
    } catch (cloudinaryError) {
        console.error("Cloudinary Delete Error:", cloudinaryError);
    }
}

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully!",
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.error("Delete Resume Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete resume.",
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};


// Get My Resumes
const getMyResumes = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                seeker_id,
                file_name,
                file_url,
                file_type,
                is_primary,
                created_at,
                updated_at
             FROM resumes
             WHERE seeker_id = $1
             ORDER BY created_at DESC`,
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            totalResumes: result.rows.length,
            resumes: result.rows,
        });

    } catch (error) {
        console.error("Get Resumes Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch resumes.",
        });
    }
};

module.exports = {
    uploadResume,
    getMyResumes,
    getResumeFile,
    setPrimaryResume,
    deleteResume,
};