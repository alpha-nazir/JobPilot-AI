import {
    Search,
    BriefcaseBusiness,
    Users,
    Building2,
    ArrowRight,
    Sparkles,
    FileText,
    Bot,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
    const { user, isAuthenticated } = useAuth();

    const canSeeAI =
        !isAuthenticated || user?.role === "job_seeker";

    return (
        <main className="home-page">

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container hero-container">

                    <div className="hero-content">
                        <span className="hero-badge">
                            <Sparkles size={15} />
                            Your Career Journey Starts Here
                        </span>

                        <h1>
                            Find Your Dream Job.
                            <span> Build Your Future.</span>
                        </h1>

                        <p>
                            Discover opportunities, connect with top companies
                            and use AI-powered tools to accelerate your career.
                        </p>

                        <div className="hero-actions">
                            <Link to="/jobs" className="hero-primary-btn">
                                Explore Jobs <ArrowRight size={18} />
                            </Link>

                            <Link to="/jobs" className="hero-secondary-btn">
                                Browse Opportunities
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-icon-card">
                            <BriefcaseBusiness size={90} />
                            <h3>Your Next Opportunity</h3>
                            <p>Find the job that moves you forward.</p>
                        </div>

                        <div className="floating-card floating-card-one">
                            <Sparkles size={20} />
                            <span>AI Powered Career Tools</span>
                        </div>

                        <div className="floating-card floating-card-two">
                            <Users size={20} />
                            <span>Career Opportunities</span>
                        </div>
                    </div>

                </div>
            </section>

            {/* Search Section */}
            <section className="search-section">
                <div className="container">
                    <div className="job-search-box">
                        <Search size={22} />

                        <input
                            type="text"
                            placeholder="Search job titles, skills or companies..."
                        />

                        <Link to="/jobs" className="search-button">
                            Search Jobs
                        </Link>
                    </div>
                </div>
            </section>

            {/* Statistics */}
            <section className="stats-section">
                <div className="container stats-grid">

                    <div className="stat-card">
                        <BriefcaseBusiness />
                        <h2>Find Jobs</h2>
                        <p>Explore opportunities</p>
                    </div>

                    <div className="stat-card">
                        <Building2 />
                        <h2>Top Companies</h2>
                        <p>Discover employers</p>
                    </div>

                    <div className="stat-card">
                        <Users />
                        <h2>Career Growth</h2>
                        <p>Build your future</p>
                    </div>

                </div>
            </section>

            {/* Features */}
            <section className="features-section" id="features">
                <div className="container">

                    <div className="section-heading">
                        <span>JOBPILOT AI FEATURES</span>
                        <h2>Everything You Need to Get Hired</h2>
                        <p>
                            Explore jobs and access intelligent career tools
                            designed to support your job search.
                        </p>
                    </div>

                    <div className="features-grid">

                        <div className="feature-card">
                            <Search size={30} />
                            <h3>Job Search</h3>
                            <p>
                                Search, browse and filter opportunities
                                across different companies.
                            </p>
                            <Link to="/jobs">
                                Explore Jobs <ArrowRight size={16} />
                            </Link>
                        </div>

                        {canSeeAI && (
                            <>
                                <div className="feature-card">
                                    <FileText size={30} />
                                    <h3>AI Resume Analyzer</h3>
                                    <p>
                                        Analyze your resume and identify areas
                                        for improvement.
                                    </p>
                                    <Link to="/ai-resume-analyzer">
                                        Get Started <ArrowRight size={16} />
                                    </Link>
                                </div>

                                <div className="feature-card">
                                    <Bot size={30} />
                                    <h3>AI Job Assistant</h3>
                                    <p>
                                        Get AI-powered assistance throughout
                                        your job search.
                                    </p>
                                    <Link to="/ai-job-assistant">
                                        Get Started <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </section>

        </main>
    );
};

export default Home;