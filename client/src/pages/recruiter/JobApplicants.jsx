import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Users,
    LoaderCircle,
    AlertCircle,
    CalendarPlus,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import "./JobApplicants.css";

const JobApplicants = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [scheduling, setScheduling] = useState(false);

    const [interviewForm, setInterviewForm] = useState({
        interview_date: "",
        interview_type: "online",
        meeting_link: "",
        location: "",
        notes: "",
    });

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(`/applications/job/${id}`);

                setJob(response.data.job);
                setApplicants(response.data.applicants);
            } catch (err) {
                const message =
                    err.response?.data?.message ||
                    "Failed to load applicants.";

                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicants();
    }, [id]);

    const formatApplicationDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            setUpdatingId(applicationId);

            await api.put(`/applications/${applicationId}/status`, {
                status: newStatus,
            });

            setApplicants((previousApplicants) =>
                previousApplicants.map((applicant) =>
                    applicant.application_id === applicationId
                        ? { ...applicant, status: newStatus }
                        : applicant
                )
            );

            toast.success("Application status updated!");
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Failed to update application status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const handleViewResume = async (applicationId) => {
        const resumeWindow = window.open("about:blank", "_blank");

        if (!resumeWindow) {
            toast.error("Please allow pop-ups to view the resume.");
            return;
        }

        resumeWindow.opener = null;

        try {
            const response = await api.get(
                `/applications/${applicationId}/resume`
            );

            resumeWindow.location.href = response.data.resumeUrl;
        } catch (err) {
            resumeWindow.close();

            toast.error(
                err.response?.data?.message || "Unable to open resume."
            );
        }
    };

    const openScheduleModal = (applicant) => {
        setSelectedApplicant(applicant);

        setInterviewForm({
            interview_date: "",
            interview_type: "online",
            meeting_link: "",
            location: "",
            notes: "",
        });
    };

    const closeScheduleModal = () => {
        if (scheduling) return;

        setSelectedApplicant(null);
    };

    const handleInterviewFormChange = (e) => {
        const { name, value } = e.target;

        setInterviewForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();

        if (!selectedApplicant) return;

        if (!interviewForm.interview_date) {
            toast.error("Please select an interview date and time.");
            return;
        }

        if (
            interviewForm.interview_type === "online" &&
            !interviewForm.meeting_link.trim()
        ) {
            toast.error("Please enter the meeting link.");
            return;
        }

        if (
            interviewForm.interview_type === "in-person" &&
            !interviewForm.location.trim()
        ) {
            toast.error("Please enter the interview location.");
            return;
        }

        try {
            setScheduling(true);

            await api.post("/interviews", {
                application_id: selectedApplicant.application_id,
                interview_date: interviewForm.interview_date,
                interview_type: interviewForm.interview_type,
                meeting_link:
                    interviewForm.interview_type === "online"
                        ? interviewForm.meeting_link.trim()
                        : null,
                location:
                    interviewForm.interview_type === "in-person"
                        ? interviewForm.location.trim()
                        : null,
                notes: interviewForm.notes.trim(),
            });

            toast.success("Interview scheduled successfully!");
            setSelectedApplicant(null);
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Failed to schedule interview."
            );
        } finally {
            setScheduling(false);
        }
    };

    const getMinimumDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

        return now.toISOString().slice(0, 16);
    };

    if (loading) {
        return (
            <div className="applicants-loading">
                <LoaderCircle className="applicants-spinner" size={28} />
                <p>Loading applicants...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="applicants-error">
                <AlertCircle size={28} />
                <p>{error}</p>

                <button onClick={() => navigate("/recruiter/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="job-applicants-page">
            <div className="applicants-header">
                <button
                    className="applicants-back-btn"
                    onClick={() => navigate("/recruiter/dashboard")}
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                <div className="applicants-heading">
                    <div>
                        <h1>Job Applicants</h1>
                        <p>
                            {job?.title} · {job?.company_name}
                        </p>
                    </div>

                    <div className="applicants-total-card">
                        <Users size={22} />
                        <div>
                            <strong>{applicants.length}</strong>
                            <span>Total Applicants</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="applicants-content">
                {applicants.length === 0 ? (
                    <div className="applicants-empty">
                        <Users size={42} />
                        <h2>No Applicants Yet</h2>
                        <p>
                            Applicants will appear here when job seekers apply
                            for this position.
                        </p>
                    </div>
                ) : (
                    <div className="applicants-list">
                        {applicants.map((applicant) => (
                            <div
                                className="applicant-card"
                                key={applicant.application_id}
                            >
                                <h3>{applicant.full_name}</h3>
                                <p>{applicant.email}</p>

                                <div className="applicant-details">
                                    <div className="applicant-detail-item">
                                        <strong>Applied On:</strong>
                                        <span>
                                            {formatApplicationDate(
                                                applicant.applied_at
                                            )}
                                        </span>
                                    </div>

                                    <div className="applicant-detail-item">
                                        <strong>Resume:</strong>

                                        {applicant.resume_url ? (
                                            <button
                                                type="button"
                                                className="view-resume-btn"
                                                onClick={() =>
                                                    handleViewResume(
                                                        applicant.application_id
                                                    )
                                                }
                                            >
                                                View Resume ↗
                                            </button>
                                        ) : (
                                            <span>Not uploaded</span>
                                        )}
                                    </div>

                                    <div className="applicant-cover-letter">
                                        <strong>Cover Letter</strong>
                                        <p>
                                            {applicant.cover_letter ||
                                                "No cover letter provided."}
                                        </p>
                                    </div>
                                </div>

                                <div className="applicant-status-section">
                                    <span className="applicant-status">
                                        {applicant.status}
                                    </span>

                                    <div className="applicant-status-control">
                                        <label>Update Status</label>

                                        <select
                                            value={applicant.status}
                                            disabled={
                                                updatingId ===
                                                applicant.application_id
                                            }
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    applicant.application_id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="applied">
                                                Applied
                                            </option>
                                            <option value="reviewing">
                                                Reviewing
                                            </option>
                                            <option value="shortlisted">
                                                Shortlisted
                                            </option>
                                            <option value="rejected">
                                                Rejected
                                            </option>
                                            <option value="hired">
                                                Hired
                                            </option>
                                        </select>

                                        {updatingId ===
                                            applicant.application_id && (
                                            <LoaderCircle
                                                size={16}
                                                className="applicants-spinner"
                                            />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="schedule-interview-btn"
                                    onClick={() =>
                                        openScheduleModal(applicant)
                                    }
                                >
                                    <CalendarPlus size={17} />
                                    Schedule Interview
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedApplicant && (
                <div
                    className="interview-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeScheduleModal();
                        }
                    }}
                >
                    <div className="interview-modal">
                        <div className="interview-modal-header">
                            <div>
                                <h2>Schedule Interview</h2>
                                <p>
                                    Candidate: {selectedApplicant.full_name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeScheduleModal}
                                disabled={scheduling}
                                aria-label="Close modal"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleScheduleInterview}>
                            <div className="interview-form-group">
                                <label>Interview Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    name="interview_date"
                                    min={getMinimumDateTime()}
                                    value={interviewForm.interview_date}
                                    onChange={handleInterviewFormChange}
                                    required
                                />
                            </div>

                            <div className="interview-form-group">
                                <label>Interview Type *</label>
                                <select
                                    name="interview_type"
                                    value={interviewForm.interview_type}
                                    onChange={handleInterviewFormChange}
                                >
                                    <option value="online">Online</option>
                                    <option value="in-person">In-person</option>
                                </select>
                            </div>

                            {interviewForm.interview_type === "online" ? (
                                <div className="interview-form-group">
                                    <label>Meeting Link *</label>
                                    <input
                                        type="url"
                                        name="meeting_link"
                                        placeholder="https://meet.google.com/..."
                                        value={interviewForm.meeting_link}
                                        onChange={handleInterviewFormChange}
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="interview-form-group">
                                    <label>Interview Location *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="Enter interview address"
                                        value={interviewForm.location}
                                        onChange={handleInterviewFormChange}
                                        required
                                    />
                                </div>
                            )}

                            <div className="interview-form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    rows="4"
                                    placeholder="Interview instructions or additional details..."
                                    value={interviewForm.notes}
                                    onChange={handleInterviewFormChange}
                                />
                            </div>

                            <div className="interview-modal-actions">
                                <button
                                    type="button"
                                    className="interview-cancel-btn"
                                    onClick={closeScheduleModal}
                                    disabled={scheduling}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="interview-submit-btn"
                                    disabled={scheduling}
                                >
                                    {scheduling ? (
                                        <>
                                            <LoaderCircle
                                                size={17}
                                                className="applicants-spinner"
                                            />
                                            Scheduling...
                                        </>
                                    ) : (
                                        "Schedule Interview"
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

export default JobApplicants;