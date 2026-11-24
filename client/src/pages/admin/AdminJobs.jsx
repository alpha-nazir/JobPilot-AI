import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BriefcaseBusiness,
    Search,
    MapPin,
    CalendarDays,
    Trash2,
    LoaderCircle,
    AlertCircle,
    ArrowLeft
} from "lucide-react";
import { toast } from "react-hot-toast";

import api from "../../services/api";

import "./AdminJobs.css";

const AdminJobs = () => {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [deletingJobId, setDeletingJobId] = useState(null);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/jobs");

            setJobs(response.data.jobs || []);
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Failed to load job postings.";

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter((job) => {
        const searchTerm = search.toLowerCase();

        const matchesSearch =
            job.title?.toLowerCase().includes(searchTerm) ||
            job.company_name?.toLowerCase().includes(searchTerm) ||
            job.recruiter_name?.toLowerCase().includes(searchTerm) ||
            job.recruiter_email?.toLowerCase().includes(searchTerm);

        const matchesStatus =
            status === "all" || job.status === status;

        return matchesSearch && matchesStatus;
    });

    const handleDeleteJob = async (job) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${job.title}" at ${job.company_name}?`
        );

        if (!confirmed) return;

        try {
            setDeletingJobId(job.id);

            await api.delete(`/admin/jobs/${job.id}`);

            setJobs((previousJobs) =>
                previousJobs.filter((item) => item.id !== job.id)
            );

            toast.success("Job posting deleted successfully.");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to delete job posting."
            );
        } finally {
            setDeletingJobId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="admin-jobs-page">
            <div className="admin-jobs-container">

                {/* Header */}
                <div className="admin-jobs-header">
                    <div>
                        <button
                            className="admin-jobs-back-btn"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            <ArrowLeft size={17} />
                            Dashboard
                        </button>

                        <span className="admin-jobs-badge">
                            <BriefcaseBusiness size={14} />
                            JOB MANAGEMENT
                        </span>

                        <h1>Manage Jobs</h1>

                        <p>
                            Monitor job postings published on JobPilot AI.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="admin-jobs-filters">
                    <div className="admin-jobs-search">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search job, company or recruiter..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>

                {/* Jobs Section */}
                <div className="admin-jobs-section">
                    <div className="admin-jobs-section-heading">
                        <div>
                            <h2>All Job Postings</h2>
                            <p>
                                {loading
                                    ? "Loading jobs..."
                                    : `${filteredJobs.length} of ${jobs.length} jobs displayed`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-jobs-state">
                            <LoaderCircle
                                className="admin-jobs-loading"
                                size={30}
                            />
                            <p>Loading job postings...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-jobs-state">
                            <AlertCircle size={30} />
                            <h3>Unable to load jobs</h3>
                            <p>{error}</p>

                            <button onClick={fetchJobs}>
                                Try Again
                            </button>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="admin-jobs-state">
                            <BriefcaseBusiness size={35} />
                            <h3>No jobs found</h3>
                            <p>
                                Try changing your search or status filter.
                            </p>
                        </div>
                    ) : (
                        <div className="admin-jobs-list">
                            {filteredJobs.map((job) => (
                                <div
                                    className="admin-job-card"
                                    key={job.id}
                                >
                                    <div className="admin-job-info">
                                        <h3>{job.title}</h3>

                                        <p className="admin-job-company">
                                            {job.company_name}
                                        </p>

                                        <div className="admin-job-meta">
                                            <span>
                                                <MapPin size={14} />
                                                {job.location || "Not specified"}
                                            </span>

                                            <span>
                                                <CalendarDays size={14} />
                                                Posted: {formatDate(job.created_at)}
                                            </span>
                                        </div>

                                        <div className="admin-job-recruiter">
                                            <strong>Recruiter:</strong>{" "}
                                            {job.recruiter_name || "Unknown"}
                                            {job.recruiter_email && (
                                                <span>
                                                    {" "}({job.recruiter_email})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-job-actions">
                                        <span
                                            className={`admin-job-status ${job.status}`}
                                        >
                                            {job.status}
                                        </span>

                                        <span className="admin-job-type">
                                            {job.job_type}
                                        </span>

                                        <button
                                            className="admin-job-delete-btn"
                                            disabled={deletingJobId === job.id}
                                            onClick={() => handleDeleteJob(job)}
                                        >
                                            {deletingJobId === job.id ? (
                                                <LoaderCircle
                                                    size={15}
                                                    className="admin-jobs-loading"
                                                />
                                            ) : (
                                                <Trash2 size={15} />
                                            )}

                                            Delete Job
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminJobs;