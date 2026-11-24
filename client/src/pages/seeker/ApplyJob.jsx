import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Upload,
    FileText,
    X,
    LoaderCircle,
    Star,
} from "lucide-react";
import toast from "react-hot-toast";

import { getJobById } from "../../services/jobService";
import { submitApplication } from "../../services/applicationService";
import { getMyResumes } from "../../services/resumeService";

import "./ApplyJob.css";

const ApplyJob = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    const [resumeMode, setResumeMode] = useState("upload");
    const [resume, setResume] = useState(null);
    const [savedResumes, setSavedResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState("");

    const [coverLetter, setCoverLetter] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loadingResumes, setLoadingResumes] = useState(true);

    // Fetch Job Details
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await getJobById(id);
                setJob(response.job);
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Unable to load job details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    // Fetch Saved Resumes
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await getMyResumes();

                const resumes = response.resumes || [];

                setSavedResumes(resumes);

                const primaryResume = resumes.find(
                    (item) => item.is_primary
                );

                if (resumes.length > 0) {
                    setSelectedResumeId(
                        String(primaryResume?.id || resumes[0].id)
                    );
                    setResumeMode("existing");
                }
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Unable to load saved resumes."
                );
            } finally {
                setLoadingResumes(false);
            }
        };

        fetchResumes();
    }, []);

    // Handle New Resume Upload
    const handleResumeChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF resumes are allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Resume must be smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        setResume(file);
    };

    // Handle Application Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (resumeMode === "upload" && !resume) {
            toast.error("Please upload your resume.");
            return;
        }

        if (resumeMode === "existing" && !selectedResumeId) {
            toast.error("Please select a saved resume.");
            return;
        }

        const formData = new FormData();

        if (resumeMode === "upload") {
            formData.append("resume", resume);
        } else {
            formData.append("resume_id", selectedResumeId);
        }

        formData.append("cover_letter", coverLetter);

        try {
            setSubmitting(true);

            const response = await submitApplication(id, formData);

            toast.success(
                response.message ||
                "Application submitted successfully!"
            );

            navigate("/dashboard");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to submit your application."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="apply-job-loading">
                <LoaderCircle size={28} className="apply-job-spinner" />
                <p>Loading application form...</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="apply-job-error">
                <h2>Job Not Found</h2>
                <button onClick={() => navigate("/jobs")}>
                    Browse Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="apply-job-page">
            <div className="apply-job-container">

                <button
                    className="apply-back-btn"
                    onClick={() => navigate(`/jobs/${id}`)}
                >
                    <ArrowLeft size={18} />
                    Back to Job Details
                </button>

                <div className="apply-job-heading">
                    <span>JOB APPLICATION</span>
                    <h1>Apply for this Position</h1>
                    <p>
                        Submit your resume and application details.
                    </p>
                </div>

                <div className="apply-job-company-card">
                    <div className="apply-job-company-icon">
                        <BriefcaseBusiness size={25} />
                    </div>

                    <div>
                        <h2>{job.title}</h2>
                        <p>
                            {job.company_name} · {job.location}
                        </p>
                    </div>
                </div>

                <form
                    className="apply-job-form"
                    onSubmit={handleSubmit}
                >

                    {/* Resume Selection */}
                    <div className="apply-form-section">

                        <h2>Select Your Resume</h2>

                        <p>
                            Upload a new resume or choose one
                            from your saved resumes.
                        </p>

                        <div className="resume-mode-options">

                            <button
                                type="button"
                                className={`resume-mode-btn ${
                                    resumeMode === "upload" ? "active" : ""
                                }`}
                                onClick={() => setResumeMode("upload")}
                            >
                                <Upload size={18} />
                                Upload New Resume
                            </button>

                            <button
                                type="button"
                                className={`resume-mode-btn ${
                                    resumeMode === "existing" ? "active" : ""
                                }`}
                                onClick={() => {
                                    if (savedResumes.length === 0) {
                                        toast.error(
                                            "No saved resumes available. Upload a new resume."
                                        );
                                        return;
                                    }

                                    setResumeMode("existing");
                                }}
                                disabled={savedResumes.length === 0}
                            >
                                <FileText size={18} />
                                Choose Saved Resume
                            </button>

                        </div>

                        {/* Upload New Resume */}
                        {resumeMode === "upload" && (
                            <>
                                <label className="resume-upload-area">
                                    <Upload size={30} />

                                    <strong>
                                        {resume
                                            ? "Change Resume"
                                            : "Click to upload your resume"}
                                    </strong>

                                    <span>
                                        PDF files only · Maximum 5 MB
                                    </span>

                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleResumeChange}
                                    />
                                </label>

                                {resume && (
                                    <div className="selected-resume">
                                        <FileText size={19} />

                                        <div>
                                            <strong>{resume.name}</strong>
                                            <span>
                                                {(
                                                    resume.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)} MB
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setResume(null)}
                                            title="Remove resume"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Choose Existing Resume */}
                        {resumeMode === "existing" && (
                            <div className="saved-resume-options">

                                {loadingResumes ? (
                                    <p>Loading saved resumes...</p>
                                ) : savedResumes.length > 0 ? (
                                    savedResumes.map((item) => (
                                        <label
                                            key={item.id}
                                            className={`saved-resume-option ${
                                                String(item.id) === selectedResumeId
                                                    ? "selected"
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="savedResume"
                                                value={item.id}
                                                checked={
                                                    String(item.id) ===
                                                    selectedResumeId
                                                }
                                                onChange={(e) =>
                                                    setSelectedResumeId(
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <FileText size={22} />

                                            <div>
                                                <strong>
                                                    {item.file_name}
                                                </strong>

                                                {item.is_primary && (
                                                    <span className="primary-resume-label">
                                                        <Star
                                                            size={13}
                                                            fill="currentColor"
                                                        />
                                                        Primary Resume
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <p>
                                        No saved resumes found.
                                        Please upload a new resume.
                                    </p>
                                )}

                            </div>
                        )}

                        {savedResumes.length === 0 &&
                            !loadingResumes && (
                                <p>
                                    You haven't saved any resumes yet.
                                </p>
                            )}

                    </div>

                    {/* Cover Letter */}
                    <div className="apply-form-section">

                        <h2>Cover Letter</h2>

                        <p>
                            Introduce yourself and explain why
                            you're interested in this position.
                        </p>

                        <textarea
                            value={coverLetter}
                            onChange={(e) =>
                                setCoverLetter(e.target.value)
                            }
                            placeholder="Write your cover letter here..."
                            rows={7}
                            maxLength={3000}
                        />

                        <div className="cover-letter-count">
                            {coverLetter.length}/3000 characters
                        </div>

                    </div>

                    <button
                        type="submit"
                        className="submit-application-btn"
                        disabled={submitting || loadingResumes}
                    >
                        {submitting
                            ? "Submitting Application..."
                            : "Submit Application"}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ApplyJob;