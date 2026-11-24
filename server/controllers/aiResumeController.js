const pool = require("../config/db");
const pdfParse = require("pdf-parse");

// Analyze Resume using OpenRouter AI
const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF resume.",
            });
        }

        if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
            return res.status(500).json({
                success: false,
                message: "OpenRouter configuration is missing.",
            });
        }

        // Extract text from PDF
        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text.trim();

        if (!resumeText || resumeText.length < 50) {
            return res.status(400).json({
                success: false,
                message: "Could not extract enough text from this PDF.",
            });
        }

        const prompt = `
You are an expert resume reviewer and ATS analyzer.

Analyze the following resume and return ONLY valid JSON.

Use this exact JSON structure:

{
    "match_score": 75,
    "extracted_skills": ["JavaScript", "React", "Node.js"],
    "missing_skills": ["TypeScript", "Docker"],
    "strengths": "List the main strengths of this resume.",
    "weaknesses": "Explain the weaknesses found in this resume.",
    "suggestions": "Give practical suggestions to improve this resume."
}

Rules:
- match_score must be an integer between 0 and 100.
- Evaluate overall resume quality, skills, experience, and presentation.
- Do not invent qualifications or experience.
- Keep suggestions practical and specific.
- If information is missing, mention it honestly.
- Return valid JSON only.

RESUME CONTENT:

${resumeText.slice(0, 15000)}
`;

        // Send request to OpenRouter
        const aiResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "JobPilot AI",
                },
                body: JSON.stringify({
                    model: process.env.OPENROUTER_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.3,
                }),
            }
        );

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error("OpenRouter Error:", aiData);

            return res.status(502).json({
                success: false,
                message: "AI analysis failed. Please try again.",
            });
        }

        const aiContent = aiData.choices?.[0]?.message?.content;

        if (!aiContent) {
            return res.status(502).json({
                success: false,
                message: "AI returned an empty response.",
            });
        }

        // Parse AI JSON response
        const cleanedContent = aiContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const analysis = JSON.parse(cleanedContent);

        // Validate AI response
        if (
            typeof analysis.match_score !== "number" ||
            !Array.isArray(analysis.extracted_skills) ||
            !Array.isArray(analysis.missing_skills)
        ) {
            throw new Error("Invalid AI analysis format.");
        }

        analysis.match_score = Math.max(
            0,
            Math.min(100, Math.round(analysis.match_score))
        );

        // Save analysis in PostgreSQL
        const result = await pool.query(
            `INSERT INTO ai_analysis (
                seeker_id,
                match_score,
                extracted_skills,
                missing_skills,
                strengths,
                weaknesses,
                suggestions,
                full_analysis
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                req.user.userId,
                analysis.match_score,
                analysis.extracted_skills,
                analysis.missing_skills,
                analysis.strengths || "",
                analysis.weaknesses || "",
                analysis.suggestions || "",
                JSON.stringify(analysis),
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully.",
            analysis: result.rows[0],
        });

    } catch (error) {
        console.error("Resume Analysis Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to analyze resume. Please try again.",
        });
    }
};

// Get Resume Analysis History
const getAnalysisHistory = async (req, res) => {
    try {
        console.log("HISTORY USER ID:", req.user.userId);
        const result = await pool.query(
            `SELECT *
             FROM ai_analysis
             WHERE seeker_id = $1
             ORDER BY created_at DESC`,
            [req.user.userId]
        );

        return res.status(200).json({
            success: true,
            total: result.rows.length,
            analyses: result.rows,
        });

    } catch (error) {
        console.error("Analysis History Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch analysis history.",
        });
    }
};

module.exports = {
    analyzeResume,
    getAnalysisHistory,
};