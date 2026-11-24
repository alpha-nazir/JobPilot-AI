import { useEffect, useState } from "react";
import {
    CalendarDays,
    Clock,
    BriefcaseBusiness,
    Video,
    MapPin,
    LoaderCircle,
    AlertCircle,
    Pencil,
    X,
    Save,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import "./Interviews.css";

const Interviews = ({ role }) => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingInterview, setEditingInterview] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        interview_date: "",
        interview_type: "online",
        meeting_link: "",
        location: "",
        notes: "",
        status: "scheduled",
    });

    const fetchInterviews = async () => {
        try {
            setLoading(true);

            const response = await api.get("/interviews");

            setInterviews(response.data.interviews || []);
        } catch (error) {
            console.error("Fetch Interviews Error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to load interviews."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getMinimumDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

        return now.toISOString().slice(0, 16);
    };

    const openEditModal = (interview) => {
        const date = new Date(interview.interview_date);

        const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);

        setForm({
            interview_date: localDate,
            interview_type: interview.interview_type || "online",
            meeting_link: interview.meeting_link || "",
            location: interview.location || "",
            notes: interview.notes || "",
            status: interview.status || "scheduled",
        });

        setEditingInterview(interview);
    };

    const closeEditModal = () => {
        if (saving) return;

        setEditingInterview(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleUpdateInterview = async (e) => {
        e.preventDefault();

        if (!editingInterview) return;

        if (
            form.status === "scheduled" &&
            new Date(form.interview_date) <= new Date()
        ) {
            toast.error("Scheduled interviews must have a future date.");
            return;
        }

        if (
            form.interview_type === "online" &&
            !form.meeting_link.trim()
        ) {
            toast.error("Please enter the meeting link.");
            return;
        }

        if (
            form.interview_type === "in-person" &&
            !form.location.trim()
        ) {
            toast.error("Please enter the interview location.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.put(
                `/interviews/${editingInterview.id}`,
                {
                    interview_date: form.interview_date,
                    interview_type: form.interview_type,
                    meeting_link:
                        form.interview_type === "online"
                            ? form.meeting_link.trim()
                            : null,
                    location:
                        form.interview_type === "in-person"
                            ? form.location.trim()
                            : null,
                    notes: form.notes.trim(),
                    status: form.status,
                }
            );

            const updatedInterview = response.data.interview;

            setInterviews((previous) =>
                previous.map((item) =>
                    item.id === editingInterview.id
                        ? { ...item, ...updatedInterview }
                        : item
                )
            );

            toast.success("Interview updated successfully!");
            setEditingInterview(null);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to update interview."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="interviews-page">
            <div className="interviews-header">
                <div>
                    <h1>Interview Management</h1>
                    <p>
                        {role === "recruiter"
                            ? "Manage your candidate interviews."
                            : "Track your upcoming job interviews."}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="interviews-loading">
                    <LoaderCircle
                        size={30}
                        className="interviews-spinner"
                    />
                    <p>Loading interviews...</p>
                </div>
            ) : interviews.length === 0 ? (
                <div className="interviews-empty">
                    <AlertCircle size={42} />
                    <h3>No interviews found</h3>
                    <p>
                        Your scheduled interviews will appear here.
                    </p>
                </div>
            ) : (
                <div className="interviews-list">
                    {interviews.map((interview) => (
                        <div
                            className="interview-card"
                            key={interview.id}
                        >
                            <div className="interview-card-header">
                                <div>
                                    <h3>{interview.job_title}</h3>
                                    <p>{interview.company_name}</p>
                                </div>

                                <span
                                    className={`interview-status ${interview.status}`}
                                >
                                    {interview.status}
                                </span>
                            </div>

                            <div className="interview-details">
                                <div>
                                    <CalendarDays size={17} />
                                    <span>
                                        {formatDate(interview.interview_date)}
                                    </span>
                                </div>

                                <div>
                                    <Clock size={17} />
                                    <span>
                                        {formatTime(interview.interview_date)}
                                    </span>
                                </div>

                                <div>
                                    <BriefcaseBusiness size={17} />
                                    <span>
                                        {interview.interview_type || "Not specified"}
                                    </span>
                                </div>

                                {interview.meeting_link && (
                                    <div>
                                        <Video size={17} />
                                        <a
                                            href={interview.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Join Interview
                                        </a>
                                    </div>
                                )}

                                {interview.location && (
                                    <div>
                                        <MapPin size={17} />
                                        <span>{interview.location}</span>
                                    </div>
                                )}
                            </div>

                            {role === "recruiter" && (
                                <div className="interview-candidate">
                                    <strong>Candidate:</strong>{" "}
                                    {interview.seeker_name}
                                </div>
                            )}

                            {role === "job_seeker" && (
                                <div className="interview-candidate">
                                    <strong>Recruiter:</strong>{" "}
                                    {interview.recruiter_name}
                                </div>
                            )}

                            {interview.notes && (
                                <div className="interview-notes">
                                    <strong>Notes:</strong>
                                    <p>{interview.notes}</p>
                                </div>
                            )}

                            {role === "recruiter" && (
                                <button
                                    type="button"
                                    className="interview-edit-btn"
                                    onClick={() => openEditModal(interview)}
                                >
                                    <Pencil size={16} />
                                    Edit Interview
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {editingInterview && (
                <div
                    className="interview-edit-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeEditModal();
                        }
                    }}
                >
                    <div className="interview-edit-modal">
                        <div className="interview-edit-header">
                            <div>
                                <h2>Edit Interview</h2>
                                <p>
                                    {editingInterview.job_title}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={saving}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateInterview}>
                            <div className="interview-edit-group">
                                <label>Interview Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    name="interview_date"
                                    min={
                                        form.status === "scheduled"
                                            ? getMinimumDateTime()
                                            : undefined
                                    }
                                    value={form.interview_date}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="interview-edit-group">
                                <label>Interview Type *</label>
                                <select
                                    name="interview_type"
                                    value={form.interview_type}
                                    onChange={handleFormChange}
                                >
                                    <option value="online">Online</option>
                                    <option value="in-person">In-person</option>
                                </select>
                            </div>

                            {form.interview_type === "online" ? (
                                <div className="interview-edit-group">
                                    <label>Meeting Link *</label>
                                    <input
                                        type="url"
                                        name="meeting_link"
                                        value={form.meeting_link}
                                        onChange={handleFormChange}
                                        placeholder="https://meet.google.com/..."
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="interview-edit-group">
                                    <label>Interview Location *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={form.location}
                                        onChange={handleFormChange}
                                        placeholder="Enter interview location"
                                        required
                                    />
                                </div>
                            )}

                            <div className="interview-edit-group">
                                <label>Interview Status *</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                >
                                    <option value="scheduled">
                                        Scheduled
                                    </option>
                                    <option value="completed">
                                        Completed
                                    </option>
                                    <option value="cancelled">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            <div className="interview-edit-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    rows="4"
                                    value={form.notes}
                                    onChange={handleFormChange}
                                    placeholder="Additional interview details..."
                                />
                            </div>

                            <div className="interview-edit-actions">
                                <button
                                    type="button"
                                    className="interview-edit-cancel"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="interview-edit-save"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <LoaderCircle
                                                size={17}
                                                className="interviews-spinner"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interviews;