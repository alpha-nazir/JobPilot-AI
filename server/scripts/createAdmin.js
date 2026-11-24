const readline = require("readline");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

const createAdmin = async () => {
    try {
        const fullName = (await ask("Admin Name: ")).trim();
        const email = (await ask("Admin Email: ")).trim().toLowerCase();
        const password = await ask("Admin Password: ");

        if (!fullName || !email || password.length < 8) {
            console.log("Invalid details. Password must be at least 8 characters.");
            return;
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log("This email is already registered.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES ($1, $2, $3, 'admin')
             RETURNING id, full_name, email, role, is_active`,
            [fullName, email, hashedPassword]
        );

        console.log("Admin account created successfully:");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("Admin creation failed:", error.message);
    } finally {
        rl.close();
        await pool.end();
    }
};

createAdmin();