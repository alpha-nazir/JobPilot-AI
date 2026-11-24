import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    UserCheck,
    UserCog,
    BriefcaseBusiness,
    FileText,
    CalendarDays,
    LoaderCircle,
    AlertCircle,
    ArrowRight,
    ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";

import api from "../../services/api";

import "./AdminDashboard.css";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/admin/dashboard");
                setStats(response.data.stats);
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    "Failed to load admin dashboard.";

                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Users",
            value: stats?.total_users,
            icon: Users
        },
        {
            title: "Job Seekers",
            value: stats?.total_seekers,
            icon: UserCheck
        },
        {
            title: "Recruiters",
            value: stats?.total_recruiters,
            icon: UserCog
        },
        {
            title: "Total Jobs",
            value: stats?.total_jobs,
            icon: BriefcaseBusiness
        },
        {
            title: "Applications",
            value: stats?.total_applications,
            icon: FileText
        },
        {
            title: "Interviews",
            value: stats?.total_interviews,
            icon: CalendarDays
        }
    ];

    const managementCards = [
        {
            title: "User Management",
            description: "View users, manage accounts and control access.",
            icon: Users,
            button: "Manage Users",
            path: "/admin/users"
        },
        {
            title: "Job Management",
            description: "View all job listings and remove inappropriate posts.",
            icon: BriefcaseBusiness,
            button: "Manage Jobs",
            path: "/admin/jobs"
        }
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-container">

                {/* Header */}
                <div className="admin-dashboard-header">
                    <div>
                        <span className="admin-dashboard-badge">
                            <ShieldCheck size={14} />
                            ADMIN PORTAL
                        </span>

                        <h1>Admin Dashboard</h1>

                        <p>
                            Monitor JobPilot AI and manage your platform.
                        </p>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="admin-dashboard-state">
                        <LoaderCircle className="admin-loading-icon" size={30} />
                        <p>Loading dashboard statistics...</p>
                    </div>
                ) : error ? (
                    <div className="admin-dashboard-state">
                        <AlertCircle size={30} />
                        <h3>Unable to load dashboard</h3>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Statistics */}
                        <section className="admin-stats-section">
                            <div className="admin-section-heading">
                                <h2>Platform Overview</h2>
                                <p>Overall platform statistics.</p>
                            </div>

                            <div className="admin-stats-grid">
                                {statCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <div
                                            className="admin-stat-card"
                                            key={card.title}
                                        >
                                            <div className="admin-stat-icon">
                                                <Icon size={23} />
                                            </div>

                                            <div>
                                                <p>{card.title}</p>
                                                <h2>
                                                    {Number(card.value || 0).toLocaleString("en-IN")}
                                                </h2>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Account Overview */}
                        <section className="admin-account-overview">
                            <div className="admin-section-heading">
                                <h2>Account Overview</h2>
                                <p>Current account activity.</p>
                            </div>

                            <div className="admin-account-grid">
                                <div className="admin-account-card">
                                    <span>Active Accounts</span>
                                    <h2>{stats.active_users}</h2>
                                </div>

                                <div className="admin-account-card inactive">
                                    <span>Inactive Accounts</span>
                                    <h2>{stats.inactive_users}</h2>
                                </div>

                                <div className="admin-account-card">
                                    <span>Active Jobs</span>
                                    <h2>{stats.active_jobs}</h2>
                                </div>

                                <div className="admin-account-card">
                                    <span>Admin Accounts</span>
                                    <h2>{stats.total_admins}</h2>
                                </div>
                            </div>
                        </section>

                        {/* Management */}
                        <section className="admin-management-section">
                            <div className="admin-section-heading">
                                <h2>Platform Management</h2>
                                <p>Manage users and job listings.</p>
                            </div>

                            <div className="admin-management-grid">
                                {managementCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <div
                                            className="admin-management-card"
                                            key={card.title}
                                        >
                                            <div className="admin-management-icon">
                                                <Icon size={25} />
                                            </div>

                                            <h3>{card.title}</h3>

                                            <p>{card.description}</p>

                                            <button
                                                onClick={() => navigate(card.path)}
                                            >
                                                {card.button}
                                                <ArrowRight size={17} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;