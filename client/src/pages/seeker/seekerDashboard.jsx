import { useEffect, useState } from "react";
import {
    BriefcaseBusiness,
    Clock,
    CheckCircle2,
    FileText,
    Search,
    ArrowRight,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./SeekerDashboard.css";

const SeekerDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        reviewing: 0,
        shortlisted: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/applications/my-applications");

            const applicationList = response.data.applications || [];

            setApplications(applicationList);

            setStats({
                total: applicationList.length,
                pending: applicationList.filter(
                    (app) => app.status === "applied"
                ).length,
                reviewing: applicationList.filter(
                    (app) => app.status === "reviewing"
                ).length,
                shortlisted: applicationList.filter(
                    (app) => app.status === "shortlisted"
                ).length,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load your applications."
            );
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Applications",
            value: stats.total,
            icon: BriefcaseBusiness,
            color: "#3882F6",
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "#F59E0B",
        },
        {
            title: "Under Review",
            value: stats.reviewing,
            icon: FileText,
            color: "#8B5CF6",
        },
        {
            title: "Shortlisted",
            value: stats.shortlisted,
            icon: CheckCircle2,
            color: "#10B981",
        },
    ];

    if (loading) {
        return (
            <div className="seeker-dashboard-loading">
                <LoaderCircle size={32} className="seeker-dashboard-spinner" />
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="seeker-dashboard">
            {/* Header */}
            <div className="seeker-dashboard-header">
                <div>
                    <h1>My Dashboard</h1>
                    <p>Track your job applications and career progress.</p>
                </div>

                <Link to="/jobs" className="seeker-find-jobs-btn">
                    <Search size={18} />
                    Find Jobs
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="seeker-dashboard-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchDashboard}>Retry</button>
                </div>
            )}

            {/* Stats */}
            <div className="seeker-stats-grid">
                {statCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div className="seeker-stat-card" key={card.title}>
                            <div
                                className="seeker-stat-icon"
                                style={{ color: card.color }}
                            >
                                <Icon size={22} />
                            </div>

                            <div className="seeker-stat-info">
                                <span>{card.title}</span>
                                <h2>{card.value}</h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Applications */}
            <div className="seeker-applications-section">
                <div className="seeker-section-header">
                    <div>
                        <h2>My Applications</h2>
                        <p>Track the status of jobs you've applied for.</p>
                    </div>
                </div>

                {applications.length === 0 ? (
                    <div className="seeker-applications-empty">
                        <BriefcaseBusiness size={40} />
                        <h3>No applications yet</h3>
                        <p>
                            Start exploring jobs and submit your first application.
                        </p>

                        <Link to="/jobs" className="seeker-empty-find-btn">
                            Explore Jobs <ArrowRight size={17} />
                        </Link>
                    </div>
                ) : (
                    <div className="seeker-applications-list">
                        {applications.map((application) => (
                            <div
                                className="seeker-application-card"
                                key={application.application_id}
                            >
                                <div className="seeker-application-info">
                                    <h3>{application.job_title}</h3>
                                    <p>{application.company_name}</p>
                                    <span className="seeker-applied-date">
                                        Applied{" "}
                                        {new Date(
                                            application.applied_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="seeker-application-right">
                                    <span
                                        className={`seeker-application-status status-${application.status}`}
                                    >
                                        {application.status.replace("_", " ")}
                                    </span>

                                    <Link
                                        to={`/jobs/${application.job_id}`}
                                        className="seeker-view-job-btn"
                                    >
                                        View Job <ArrowRight size={15} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeekerDashboard;