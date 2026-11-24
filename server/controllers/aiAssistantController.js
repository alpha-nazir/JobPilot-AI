const pool = require("../config/db");
const activeRequests = new Map();

// Get all conversations for logged-in user
const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                id,
                session_title,
                created_at,
                updated_at
             FROM ai_conversations
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            totalConversations: result.rows.length,
            conversations: result.rows,
        });
    } catch (error) {
        console.error("Get Conversations Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversations.",
        });
    }
};

// Create a new conversation
const createConversation = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `INSERT INTO ai_conversations (user_id, session_title)
             VALUES ($1, $2)
             RETURNING id, session_title, created_at, updated_at`,
            [userId, "New Conversation"]
        );

        return res.status(201).json({
            success: true,
            message: "Conversation created successfully.",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("Create Conversation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create conversation.",
        });
    }
};

// Get messages from a specific conversation
const getConversationMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        if (!/^\d+$/.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID.",
            });
        }

        const conversation = await pool.query(
            `SELECT id
             FROM ai_conversations
             WHERE id = $1 AND user_id = $2`,
            [conversationId, userId]
        );

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }

        const result = await pool.query(
            `SELECT id, role, message, created_at
             FROM ai_messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC, id ASC`,
            [conversationId]
        );

        return res.status(200).json({
            success: true,
            totalMessages: result.rows.length,
            messages: result.rows,
        });
    } catch (error) {
        console.error("Get Conversation Messages Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversation messages.",
        });
    }
};

// Send message to AI Assistant
const sendMessage = async (req, res) => {
    try {
        const abortController = new AbortController();
        const userId = req.user.userId;
        const { conversationId } = req.params;
        const { message } = req.body;

        if (!/^\d+$/.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID.",
            });
        }

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.trim().length > 4000
        ) {
            return res.status(400).json({
                success: false,
                message: "Message must contain between 1 and 4000 characters.",
            });
        }

        if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
            return res.status(500).json({
                success: false,
                message: "OpenRouter configuration is missing.",
            });
        }

        // Verify conversation ownership
        const conversation = await pool.query(
            `SELECT id, session_title
             FROM ai_conversations
             WHERE id = $1 AND user_id = $2`,
            [conversationId, userId]
        );

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }

        // Save user message
        const userMessage = message.trim();

        const savedUserMessage = await pool.query(
            `INSERT INTO ai_messages (conversation_id, role, message)
             VALUES ($1, $2, $3)
             RETURNING id, role, message, created_at`,
            [conversationId, "user", userMessage]
        );

        // Fetch recent conversation context
        const history = await pool.query(
            `SELECT role, message, created_at, id
             FROM (
                 SELECT role, message, created_at, id
                 FROM ai_messages
                 WHERE conversation_id = $1
                 ORDER BY created_at DESC, id DESC
                 LIMIT 20
             ) recent_messages
             ORDER BY created_at ASC, id ASC`,
            [conversationId]
        );

        const messages = [
            {
                role: "system",
                content: `You are JobPilot AI, an intelligent career and job search assistant.

Your responsibilities:
- Provide practical career guidance.
- Help users search for suitable job opportunities.
- Suggest career paths based on their skills and experience.
- Help users improve their resumes.
- Prepare users for job interviews.
- Explain job descriptions and required skills.
- Provide useful advice for job applications.

Rules:
- Give clear, accurate and practical answers.
- Do not invent job openings, company vacancies or salary information.
- Do not claim to have searched live job listings.
- Never invent a user's qualifications or experience.
- Ask relevant questions when necessary.
- Keep responses organized and easy to understand.
- Focus on the user's career and employment goals.`,
            },
            ...history.rows.map((item) => ({
                role: item.role,
                content: item.message,
            })),
        ];

        const requestKey = `${userId}:${conversationId}`;

        activeRequests.set(requestKey, abortController);

        // Send conversation to OpenRouter
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
                    messages,
                    temperature: 0.7,
                }),
                signal: abortController.signal,
            }
        );

        const aiData = await aiResponse.json();
        activeRequests.delete(requestKey);

        if (!aiResponse.ok) {
            console.error("OpenRouter Error:", aiData);

            return res.status(502).json({
                success: false,
                message: "AI response failed. Please try again.",
            });
        }

        const aiContent = aiData.choices?.[0]?.message?.content;

        if (typeof aiContent !== "string" || !aiContent.trim()) {
            return res.status(502).json({
                success: false,
                message: "AI returned an empty response.",
            });
        }

        // Save AI response
        const savedAssistantMessage = await pool.query(
            `INSERT INTO ai_messages (conversation_id, role, message)
             VALUES ($1, $2, $3)
             RETURNING id, role, message, created_at`,
            [conversationId, "assistant", aiContent.trim()]
        );

        // Update conversation title and timestamp
        const newTitle = userMessage.slice(0, 50);

        await pool.query(
            `UPDATE ai_conversations
             SET
                session_title = CASE
                    WHEN session_title = 'New Conversation' THEN $1
                    ELSE session_title
                END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3`,
            [newTitle, conversationId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "AI response generated successfully.",
            userMessage: savedUserMessage.rows[0],
            assistantMessage: savedAssistantMessage.rows[0],
        });

    } catch (error) {
    activeRequests.delete(
        `${req.user.userId}:${req.params.conversationId}`
    );

    if (error.name === "AbortError") {
        return res.status(200).json({
            success: true,
            stopped: true,
            message: "AI generation stopped.",
        });
    }

    console.error("Send AI Message Error:", error);

    return res.status(500).json({
        success: false,
        message: "Failed to generate AI response.",
    });
}
};

// Regenerate the latest AI response
const regenerateResponse = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        if (!/^\d+$/.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID.",
            });
        }

        if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
            return res.status(500).json({
                success: false,
                message: "OpenRouter configuration is missing.",
            });
        }

        const conversation = await pool.query(
            `SELECT id
             FROM ai_conversations
             WHERE id = $1 AND user_id = $2`,
            [conversationId, userId]
        );

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }

        const history = await pool.query(
            `SELECT id, role, message
             FROM ai_messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC, id ASC`,
            [conversationId]
        );

        if (
            history.rows.length === 0 ||
            history.rows[history.rows.length - 1].role !== "assistant"
        ) {
            return res.status(400).json({
                success: false,
                message: "No AI response available to regenerate.",
            });
        }

        // Remove the previous AI response from the prompt.
        const previousResponse = history.rows.pop();

        const messages = [
            {
                role: "system",
                content: `You are JobPilot AI, an intelligent career and job search assistant.

Your responsibilities:
- Provide practical career guidance.
- Help users search for suitable job opportunities.
- Suggest career paths based on their skills and experience.
- Help users improve their resumes.
- Prepare users for job interviews.
- Explain job descriptions and required skills.
- Provide useful advice for job applications.

Rules:
- Give clear, accurate and practical answers.
- Do not invent job openings, company vacancies or salary information.
- Do not claim to have searched live job listings.
- Never invent a user's qualifications or experience.
- Ask relevant questions when necessary.
- Keep responses organized and easy to understand.
- Focus on the user's career and employment goals.`,
            },
            ...history.rows.map((item) => ({
                role: item.role,
                content: item.message,
            })),
        ];

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
                    messages,
                    temperature: 0.7,
                }),
            }
        );

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error("OpenRouter Regenerate Error:", aiData);

            return res.status(502).json({
                success: false,
                message: "Failed to regenerate AI response.",
            });
        }

        const aiContent = aiData.choices?.[0]?.message?.content;

        if (typeof aiContent !== "string" || !aiContent.trim()) {
            return res.status(502).json({
                success: false,
                message: "AI returned an empty response.",
            });
        }

        // Replace the previous AI response only after successful generation.
        const savedAssistantMessage = await pool.query(
            `UPDATE ai_messages
             SET message = $1, created_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, role, message, created_at`,
            [aiContent.trim(), previousResponse.id]
        );

        await pool.query(
            `UPDATE ai_conversations
             SET updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2`,
            [conversationId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "AI response regenerated successfully.",
            assistantMessage: savedAssistantMessage.rows[0],
        });

    } catch (error) {
        console.error("Regenerate AI Response Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to regenerate AI response.",
        });
    }
};

// Stop ongoing AI response generation
const stopGeneration = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        if (!/^\d+$/.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID.",
            });
        }

        const conversation = await pool.query(
            `SELECT id
             FROM ai_conversations
             WHERE id = $1 AND user_id = $2`,
            [conversationId, userId]
        );

        if (conversation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }

        const requestKey = `${userId}:${conversationId}`;
        const controller = activeRequests.get(requestKey);

        if (!controller) {
            return res.status(404).json({
                success: false,
                message: "No active AI generation found.",
            });
        }

        controller.abort();

        return res.status(200).json({
            success: true,
            message: "AI generation stopped.",
        });
    } catch (error) {
        console.error("Stop AI Generation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to stop AI generation.",
        });
    }
};


// Delete Conversation
const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;

        if (!/^\d+$/.test(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID.",
            });
        }

        const result = await pool.query(
            `DELETE FROM ai_conversations
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [conversationId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Conversation deleted successfully.",
        });
    } catch (error) {
        console.error("Delete conversation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete conversation.",
        });
    }
};

module.exports = {
    getConversations,
    createConversation,
    getConversationMessages,
    sendMessage,
    deleteConversation,
    regenerateResponse,
    stopGeneration,
};