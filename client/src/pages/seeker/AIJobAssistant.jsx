import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Bot,
  User,
  LoaderCircle,
  Menu,
  X,
  BriefcaseBusiness,
  Trash2,
  Copy,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import "./AIJobAssistant.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AIJobAssistant = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversations
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);

      const response = await api.get("/ai-assistant/conversations");

      const data = response.data.conversations || [];

      setConversations(data);

      return data;
    } catch (error) {
      console.error("Fetch Conversations Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load conversations.",
      );

      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for selected conversation
  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);

      const response = await api.get(
        `/ai-assistant/conversations/${conversationId}/messages`,
      );

      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Fetch Messages Error:", error);

      toast.error(error.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initialize assistant
  useEffect(() => {
    const initializeAssistant = async () => {
      const data = await fetchConversations();

      if (data.length > 0) {
        await openConversation(data[0]);
      }
    };

    initializeAssistant();
  }, []);

  // Open conversation
  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setSidebarOpen(false);

    await fetchMessages(conversation.id);
  };

  // Delete conversation
  const deleteConversation = async (conversationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/ai-assistant/conversations/${conversationId}`);

      const updatedConversations = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      setConversations(updatedConversations);

      if (activeConversation?.id === conversationId) {
        setMessages([]);

        if (updatedConversations.length > 0) {
          await openConversation(updatedConversations[0]);
        } else {
          setActiveConversation(null);
        }
      }

      toast.success("Conversation deleted successfully.");
    } catch (error) {
      console.error("Delete Conversation Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete conversation.",
      );
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await api.post("/ai-assistant/conversations");

      const newConversation = response.data.conversation;

      setConversations((prev) => [newConversation, ...prev]);

      setActiveConversation(newConversation);
      setMessages([]);
      setSidebarOpen(false);

      inputRef.current?.focus();

      toast.success("New conversation created.");
    } catch (error) {
      console.error("Create Conversation Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to create conversation.",
      );
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const message = input.trim();

    if (!message || sending) return;

    let conversationId = activeConversation?.id;

    try {
      setSending(true);

      // Automatically create conversation if none exists
      if (!conversationId) {
        const response = await api.post("/ai-assistant/conversations");

        const newConversation = response.data.conversation;

        conversationId = newConversation.id;

        setActiveConversation(newConversation);

        setConversations((prev) => [newConversation, ...prev]);
      }

      const temporaryMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, temporaryMessage]);

      setInput("");

      const response = await api.post(
        `/ai-assistant/conversations/${conversationId}/messages`,
        { message },
      );

      if (response.data.stopped) {
        await fetchMessages(conversationId);
        await fetchConversations();
        return;
      }

      const { userMessage, assistantMessage } = response.data;

      setMessages((prev) => [
        ...prev.filter((item) => item.id !== temporaryMessage.id),
        userMessage,
        assistantMessage,
      ]);

      await fetchConversations();
    } catch (error) {
      console.error("Send Message Error:", error);

      toast.error(error.response?.data?.message || "Failed to send message.");

      // Restore message input if sending fails
      setInput(message);

      if (conversationId) {
        await fetchMessages(conversationId);
      }
    } finally {
      setSending(false);
    }
  };

  // Format message time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Copy AI response
  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Response copied!");
    } catch (error) {
      toast.error("Failed to copy response.");
    }
  };

  const regenerateResponse = async () => {
    if (!activeConversation || regenerating || sending) return;

    setRegenerating(true);

    try {
      const response = await api.post(
        `/ai-assistant/conversations/${activeConversation.id}/regenerate`,
      );

      const updatedMessage = response.data.assistantMessage;

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message,
        ),
      );

      toast.success("AI response regenerated!");
    } catch (error) {
      console.error("Regenerate Response Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to regenerate AI response.",
      );
    } finally {
      setRegenerating(false);
    }
  };

  const stopGeneration = async () => {
    if (!activeConversation || !sending) return;

    try {
      await api.post(
        `/ai-assistant/conversations/${activeConversation.id}/stop`,
      );

      toast.success("Response generation stopped.");
    } catch (error) {
      console.error("Stop Generation Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to stop generation.",
      );
    }
  };

  return (
    <div className="ai-assistant-page">
      {/* Sidebar */}
      <aside className={`ai-assistant-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ai-assistant-sidebar-header">
          <div className="ai-assistant-brand">
            <div className="ai-assistant-brand-icon">
              <Bot size={22} />
            </div>

            <div>
              <h2>JobPilot AI</h2>
              <span>Career Assistant</span>
            </div>
          </div>

          <button
            className="ai-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <button className="ai-new-chat-btn" onClick={createNewConversation}>
          <Plus size={19} />
          New Chat
        </button>

        <div className="ai-conversation-section">
          <p className="ai-sidebar-label">RECENT CONVERSATIONS</p>

          {loadingConversations ? (
            <div className="ai-sidebar-loading">
              <LoaderCircle size={18} className="ai-spinner" />
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="ai-empty-conversations">No conversations yet.</div>
          ) : (
            <div className="ai-conversation-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`ai-conversation-item ${
                    activeConversation?.id === conversation.id ? "active" : ""
                  }`}
                >
                  <button
                    className="ai-conversation-open"
                    onClick={() => openConversation(conversation)}
                  >
                    <MessageSquare size={17} />

                    <span>{conversation.session_title}</span>
                  </button>

                  <button
                    className="ai-delete-conversation"
                    onClick={() => deleteConversation(conversation.id)}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ai-sidebar-footer">
          <BriefcaseBusiness size={17} />
          <span>Your career companion</span>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="ai-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="ai-assistant-main">
        {/* Header */}
        <header className="ai-assistant-header">
          <button
            className="ai-mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="ai-header-title">
            <div className="ai-header-icon">
              <Bot size={21} />
            </div>

            <div>
              <h2>AI Job Assistant</h2>
              <span>Your personal career companion</span>
            </div>
          </div>

          <div className="ai-status">
            <span className="ai-status-dot"></span>
            AI Online
          </div>
        </header>

        {/* Messages */}
        <div className="ai-chat-content">
          {!activeConversation && !loadingConversations ? (
            <div className="ai-welcome-screen">
              <div className="ai-welcome-icon">
                <Bot size={38} />
              </div>

              <h1>How can I help your career?</h1>

              <p>
                Ask me about jobs, resumes, career paths, skills or interview
                preparation.
              </p>

              <div className="ai-suggestion-grid">
                {[
                  "Which developer roles suit my skills?",
                  "How can I improve my resume?",
                  "Help me prepare for interviews.",
                  "What skills should I learn next?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="ai-loading-messages">
              <LoaderCircle size={25} className="ai-spinner" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="ai-welcome-screen">
              <div className="ai-welcome-icon">
                <Bot size={38} />
              </div>

              <h1>Start a new conversation</h1>

              <p>Ask anything about your career or job search.</p>

              <div className="ai-suggestion-grid">
                {[
                  "Which developer roles suit my skills?",
                  "How can I improve my resume?",
                  "Help me prepare for interviews.",
                  "What skills should I learn next?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-message-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-message-row ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  <div className="ai-message-avatar">
                    {message.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={19} />
                    )}
                  </div>

                  <div className="ai-message-body">
                    <div className="ai-message-name">
                      {message.role === "user" ? "You" : "JobPilot AI"}
                    </div>

                    <div className="ai-message-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ),
                        }}
                      >
                        {message.message}
                      </ReactMarkdown>
                    </div>

                    <div className="ai-message-actions">
                      <span className="ai-message-time">
                        {formatTime(message.created_at)}
                      </span>

                      {message.role === "assistant" && (
                        <>
                          <button
                            className="ai-copy-btn"
                            onClick={() => copyMessage(message.message)}
                            title="Copy response"
                            aria-label="Copy response"
                          >
                            <Copy size={15} />
                          </button>

                          {message.id === messages[messages.length - 1]?.id && (
                            <button
                              className="ai-copy-btn"
                              onClick={regenerateResponse}
                              disabled={regenerating || sending}
                              title="Regenerate response"
                              aria-label="Regenerate response"
                            >
                              <RefreshCw
                                size={15}
                                className={regenerating ? "ai-spin" : ""}
                              />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="ai-message-row assistant-message">
                  <div className="ai-message-avatar">
                    <Bot size={19} />
                  </div>

                  <div className="ai-message-body">
                    <div className="ai-message-name">JobPilot AI</div>

                    <div className="ai-typing-container">
                      <span className="ai-thinking-text">
                        JobPilot AI is thinking
                      </span>

                      <div className="ai-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="ai-chat-input-area">
          <form className="ai-chat-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about your career..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              maxLength={4000}
            />

            {sending ? (
              <button
                type="button"
                className="ai-stop-btn"
                onClick={stopGeneration}
                title="Stop generating"
                aria-label="Stop generating"
              >
                <X size={20} />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()}>
                <Send size={19} />
              </button>
            )}
          </form>

          <p className="ai-input-disclaimer">
            JobPilot AI can make mistakes. Verify important information.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AIJobAssistant;
