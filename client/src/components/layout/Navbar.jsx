import { useState } from "react";
import { Link } from "react-router-dom";
import {
    BriefcaseBusiness,
    UserCircle,
    LogOut,
    Menu,
    X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../common/ThemeToggle";

const Navbar = ({ onAuthClick }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const dashboardPath =
        user?.role === "admin"
            ? "/admin/dashboard"
            : user?.role === "recruiter"
                ? "/recruiter/dashboard"
                : "/dashboard";

    const dashboardLabel =
        user?.role === "admin"
            ? "Admin Dashboard"
            : user?.role === "recruiter"
                ? "Recruiter Dashboard"
                : "My Dashboard";

    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            closeMenu();
            logout();
        }
    };

    return (
        <header className="navbar">
            <div className="navbar-container">

                <Link to="/" className="navbar-logo" onClick={closeMenu}>
                    <BriefcaseBusiness size={27} />
                    <span>
                        JobPilot<span className="logo-highlight">AI</span>
                    </span>
                </Link>

                <nav className={`navbar-links ${isMenuOpen ? "navbar-links-open" : ""}`}>

                    <Link to="/" onClick={closeMenu}>
                        Home
                    </Link>

                    <Link to="/jobs" onClick={closeMenu}>
                        Find Jobs
                    </Link>

                    {isAuthenticated && (
                        <Link to={dashboardPath} onClick={closeMenu}>
                            {dashboardLabel}
                        </Link>
                    )}

                    {isAuthenticated && user?.role === "job_seeker" && (
                        <>
                            <Link to="/saved-jobs" onClick={closeMenu}>
                                Saved Jobs
                            </Link>

                            <Link to="/resume-management" onClick={closeMenu}>
                                My Resumes
                            </Link>
                        </>
                    )}

                    <a href="/#features" onClick={closeMenu}>
                        Features
                    </a>

                </nav>

                <div className="navbar-actions">

                    <ThemeToggle />

                    {isAuthenticated ? (
                        <>
                            <Link
                                to={dashboardPath}
                                className="navbar-user"
                                onClick={closeMenu}
                            >
                                <UserCircle size={19} />
                                <span>
                                    {user?.full_name || user?.fullName || "My Account"}
                                </span>
                            </Link>

                            <button
                                className="navbar-logout"
                                onClick={handleLogout}
                                title="Logout"
                                aria-label="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="login-btn"
                                onClick={() => {
                                    closeMenu();
                                    onAuthClick("login");
                                }}
                            >
                                Login
                            </button>

                            <button
                                className="signup-btn"
                                onClick={() => {
                                    closeMenu();
                                    onAuthClick("register");
                                }}
                            >
                                Get Started
                            </button>
                        </>
                    )}

                    <button
                        className="navbar-menu-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                </div>
            </div>
        </header>
    );
};

export default Navbar;