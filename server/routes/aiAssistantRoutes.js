const express = require("express");
const router = express.Router();

const {
    getConversations,
    createConversation,
    getConversationMessages,
    sendMessage,
    deleteConversation,
    regenerateResponse,
    stopGeneration,
} = require("../controllers/aiAssistantController");

const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

// Get all conversations
router.get(
    "/conversations",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getConversations
);

// Create a conversation
router.post(
    "/conversations",
    authenticateToken,
    authorizeRoles("job_seeker"),
    createConversation
);

// Get messages from a conversation
router.get(
    "/conversations/:conversationId/messages",
    authenticateToken,
    authorizeRoles("job_seeker"),
    getConversationMessages
);

// Send message to AI
router.post(
    "/conversations/:conversationId/messages",
    authenticateToken,
    authorizeRoles("job_seeker"),
    sendMessage
);

// Regenerate AI response
router.post(
    "/conversations/:conversationId/regenerate",
    authenticateToken,
    authorizeRoles("job_seeker"),
    regenerateResponse
);

// Stop AI response generation
router.post(
    "/conversations/:conversationId/stop",
    authenticateToken,
    authorizeRoles("job_seeker"),
    stopGeneration
);

// Delete a conversation
router.delete(
    "/conversations/:conversationId",
    authenticateToken,
    authorizeRoles("job_seeker"),
    deleteConversation
);

module.exports = router;