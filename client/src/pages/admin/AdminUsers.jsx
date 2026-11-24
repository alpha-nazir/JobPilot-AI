import { useEffect, useState } from "react";
import {
    Users,
    Search,
    LoaderCircle,
    AlertCircle,
    UserCheck,
    UserX,
    ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import api from "../../services/api";

import "./AdminUsers.css";

const AdminUsers = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (role !== "all") {
                params.role = role;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await api.get("/admin/users", { params });

            setUsers(response.data.users || []);
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Failed to load users.";

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(timeout);
    }, [role, search]);

    const handleStatusChange = async (user) => {
        const action = user.is_active ? "deactivate" : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.full_name}'s account?`
        );

        if (!confirmed) return;

        try {
            setUpdatingUserId(user.id);

            await api.put(`/admin/users/${user.id}/status`, {
                is_active: !user.is_active
            });

            setUsers((previousUsers) =>
                previousUsers.map((item) =>
                    item.id === user.id
                        ? { ...item, is_active: !item.is_active }
                        : item
                )
            );

            toast.success(
                `User account ${action}d successfully.`
            );
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                `Failed to ${action} user account.`
            );
        } finally {
            setUpdatingUserId(null);
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
        <div className="admin-users-page">
            <div className="admin-users-container">

                {/* Header */}
                <div className="admin-users-header">
                    <div>
                        <button
                            className="admin-back-btn"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            <ArrowLeft size={17} />
                            Dashboard
                        </button>

                        <span className="admin-users-badge">
                            <Users size={14} />
                            USER MANAGEMENT
                        </span>

                        <h1>Manage Users</h1>

                        <p>
                            View and manage registered JobPilot AI accounts.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="admin-users-filters">
                    <div className="admin-users-search">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="job_seeker">Job Seekers</option>
                        <option value="recruiter">Recruiters</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="admin-users-section">
                    <div className="admin-users-section-heading">
                        <div>
                            <h2>Registered Users</h2>
                            <p>
                                {loading
                                    ? "Loading users..."
                                    : `${users.length} users found`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-users-state">
                            <LoaderCircle
                                className="admin-users-loading"
                                size={30}
                            />
                            <p>Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-users-state">
                            <AlertCircle size={30} />
                            <h3>Unable to load users</h3>
                            <p>{error}</p>

                            <button onClick={fetchUsers}>
                                Try Again
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-users-state">
                            <Users size={35} />
                            <h3>No users found</h3>
                            <p>Try changing your search or role filter.</p>
                        </div>
                    ) : (
                        <div className="admin-users-table-wrapper">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="admin-user-info">
                                                    <div className="admin-user-avatar">
                                                        {user.full_name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {user.full_name}
                                                        </strong>

                                                        <span>
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-user-role ${user.role}`}
                                                >
                                                    {user.role.replace("_", " ")}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(user.created_at)}
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-user-status ${
                                                        user.is_active
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {user.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className={`admin-user-action ${
                                                        user.is_active
                                                            ? "deactivate"
                                                            : "activate"
                                                    }`}
                                                    disabled={
                                                        updatingUserId === user.id ||
                                                        user.role === "admin"
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(user)
                                                    }
                                                    title={
                                                        user.role === "admin"
                                                            ? "Admin accounts cannot be changed here"
                                                            : ""
                                                    }
                                                >
                                                    {updatingUserId === user.id ? (
                                                        <LoaderCircle
                                                            size={15}
                                                            className="admin-users-loading"
                                                        />
                                                    ) : user.is_active ? (
                                                        <UserX size={15} />
                                                    ) : (
                                                        <UserCheck size={15} />
                                                    )}

                                                    {user.is_active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;