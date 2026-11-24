const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER USER
const register = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            fullName,
            email,
            password,
            role,
            companyName
        } = req.body;

        // Validation
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        if (!["job_seeker", "recruiter"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration role"
            });
        }

        if (role === "recruiter" && !companyName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Company name is required for recruiters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        await client.query("BEGIN");

        // Check existing user
        const existingUser = await client.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userResult = await client.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, role`,
            [fullName.trim(), normalizedEmail, hashedPassword, role]
        );

        const user = userResult.rows[0];

        // Create role-specific profile
        if (role === "job_seeker") {
            await client.query(
                `INSERT INTO seeker_profiles (user_id)
                 VALUES ($1)`,
                [user.id]
            );
        }

        if (role === "recruiter") {
            await client.query(
                `INSERT INTO recruiter_profiles (user_id, company_name)
                 VALUES ($1, $2)`,
                [user.id, companyName.trim()]
            );
        }

        await client.query("COMMIT");

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });

    } finally {
        client.release();
    }
};


// LOGIN USER
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, full_name, email, password, role, is_active
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        delete user.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


module.exports = {
    register,
    login
};