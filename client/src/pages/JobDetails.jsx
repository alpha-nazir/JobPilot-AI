import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    BriefcaseBusiness,
    Building2,
    Clock,
    CalendarDays,
    Wallet,
    Bookmark,
    Share2,
    CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import { getJobById } from "../services/jobService";
import {
    saveJob,
    getSavedJobs,
    removeSavedJob,
} from "../services/savedJobService";
import { useAuth } from "../context/AuthContext";
import "./JobDetails.css";

const JobDetails = () => {
    const { onAuthClick } = useOutletContext();
    const { id } = useParams();
    const navigate = useNavigate();

    const { user, isAuthenticated } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch Job Details
    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getJobById(id);
                setJob(response.job);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load job details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    // Check Whether Job Is Already Saved
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!isAuthenticated || user?.role !== "job_seeker") {
                setIsSaved(false);
                return;
            }

            try {
                const response = await getSavedJobs();

                const alreadySaved = (response.savedJobs || []).some(
                    (savedJob) => Number(savedJob.id) === Number(id)
                );

                setIsSaved(alreadySaved);
            } catch (err) {
                console.error("Check Saved Job Error:", err);
            }
        };

        checkSavedStatus();
    }, [id, isAuthenticated, user?.role]);

    const formatSalary = (min, max) => {
        if (!min && !max) return "Not disclosed";

        const formatAmount = (amount) =>
            new Intl.NumberFormat("en-IN", {
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(amount);

        if (min && max) {
            return `₹${formatAmount(min)} - ₹${formatAmount(max)}`;
        }

        return min
            ? `From ₹${formatAmount(min)}`
            : `Up to ₹${formatAmount(max)}`;
    };

    const formatDate = (date) => {
        if (!date) return "Not specified";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleApply = () => {
        if (!isAuthenticated) {
            onAuthClick("login");
            return;
        }

        if (user?.role !== "job_seeker") {
            alert("Only job seekers can apply for jobs.");
            return;
        }

        navigate(`/apply/${job.id}`);
    };

    // Save / Remove Saved Job
    const handleSaveJob = async () => {
        if (!isAuthenticated) {
            onAuthClick("login");
            return;
        }

        if (user?.role !== "job_seeker") {
            toast.error("Only job seekers can save jobs.");
            return;
        }

        if (saving) return;

        try {
            setSaving(true);

            if (isSaved) {
                const response = await removeSavedJob(job.id);

                setIsSaved(false);

                toast.success(
                    response.message || "Job removed from saved jobs."
                );
            } else {
                const response = await saveJob(job.id);

                setIsSaved(true);

                toast.success(
                    response.message || "Job saved successfully."
                );
            }
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Unable to update saved job."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: job.title,
            text: `Check out this ${job.title} opportunity at ${job.company_name}.`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Job link copied!");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                toast.error("Unable to share this job.");
            }
        }
    };

    if (loading) {
        return (
            <main className="job-details-page">
                <div className="job-details-message">
                    <div className="jobs-loader"></div>
                    <p>Loading job details...</p>
                </div>
            </main>
        );
    }

    if (error || !job) {
        return (
            <main className="job-details-page">
                <div className="job-details-message">
                    <BriefcaseBusiness size={42} />
                    <h2>Job Not Found</h2>
                    <p>{error || "This job may no longer be available."}</p>
                    <Link to="/jobs" className="back-to-jobs-btn">
                        <ArrowLeft size={17} />
                        Browse Jobs
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="job-details-page">
            <div className="job-details-container">

                <Link to="/jobs" className="job-back-link">
                    <ArrowLeft size={17} />
                    Back to Jobs
                </Link>

                <section className="job-details-header">
                    <div className="job-details-company-icon">
                        <Building2 size={32} />
                    </div>

                    <div className="job-details-title">
                        <span className="job-details-category">
                            {job.category || "Career Opportunity"}
                        </span>

                        <h1>{job.title}</h1>

                        <p>{job.company_name}</p>

                        <div className="job-details-meta">
                            <span>
                                <MapPin size={16} />
                                {job.location}
                            </span>

                            <span>
                                <BriefcaseBusiness size={16} />
                                {job.job_type}
                            </span>

                            <span>
                                <Clock size={16} />
                                {job.workplace_type}
                            </span>
                        </div>
                    </div>

                    <div className="job-details-actions">
                        <button
                            className={`job-save-btn ${isSaved ? "saved" : ""}`}
                            onClick={handleSaveJob}
                            disabled={saving}
                            title={isSaved ? "Remove Saved Job" : "Save Job"}
                            aria-label={isSaved ? "Remove Saved Job" : "Save Job"}
                        >
                            <Bookmark
                                size={18}
                                fill={isSaved ? "currentColor" : "none"}
                            />
                        </button>

                        <button
                            className="job-share-btn"
                            onClick={handleShare}
                            title="Share Job"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </section>

                <div className="job-details-layout">

                    <section className="job-details-main">

                        <div className="job-info-cards">
                            <div className="job-info-card">
                                <Wallet size={21} />
                                <div>
                                    <small>Salary</small>
                                    <strong>
                                        {formatSalary(
                                            job.salary_min,
                                            job.salary_max
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="job-info-card">
                                <BriefcaseBusiness size={21} />
                                <div>
                                    <small>Experience</small>
                                    <strong>
                                        {job.experience_level || "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            <div className="job-info-card">
                                <CalendarDays size={21} />
                                <div>
                                    <small>Application Deadline</small>
                                    <strong>
                                        {formatDate(job.application_deadline)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="job-description-section">
                            <h2>Job Description</h2>
                            <p>{job.description || "No description provided."}</p>
                        </div>

                        <div className="job-description-section">
                            <h2>Responsibilities</h2>

                            {job.responsibilities ? (
                                <ul>
                                    {job.responsibilities
                                        .split("\n")
                                        .filter(Boolean)
                                        .map((item, index) => (
                                            <li key={index}>
                                                <CheckCircle2 size={17} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p>No responsibilities specified.</p>
                            )}
                        </div>

                        <div className="job-description-section">
                            <h2>Requirements</h2>

                            {job.requirements ? (
                                <ul>
                                    {job.requirements
                                        .split("\n")
                                        .filter(Boolean)
                                        .map((item, index) => (
                                            <li key={index}>
                                                <CheckCircle2 size={17} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p>No requirements specified.</p>
                            )}
                        </div>

                        <div className="job-description-section">
                            <h2>Required Skills</h2>

                            <div className="job-details-skills">
                                {job.skills?.length > 0 ? (
                                    job.skills.map((skill, index) => (
                                        <span key={index}>{skill}</span>
                                    ))
                                ) : (
                                    <p>No specific skills listed.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <aside className="job-details-sidebar">
                        <div className="job-apply-card">
                            <h3>Interested in this opportunity?</h3>

                            <p>
                                Take the next step in your career.
                                Apply for this position today.
                            </p>

                            <button
                                className="job-apply-btn"
                                onClick={handleApply}
                            >
                                Apply Now
                            </button>

                            <div className="job-apply-note">
                                <CheckCircle2 size={16} />
                                Free application
                            </div>
                        </div>

                        <div className="job-company-card">
                            <h3>About the Company</h3>

                            <div className="job-company-info">
                                <Building2 size={22} />
                                <strong>{job.company_name}</strong>
                            </div>

                            <p>
                                Explore this opportunity and learn more
                                about working with {job.company_name}.
                            </p>
                        </div>
                    </aside>

                </div>
            </div>
        </main>
    );
};

export default JobDetails;