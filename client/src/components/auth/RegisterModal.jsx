import { useState } from "react";
import {
    X,
    BriefcaseBusiness,
    Eye,
    EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterModal = ({ onClose, onSwitch }) => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "job_seeker",
        companyName: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await register(formData);

            onClose();

            if (user.role === "recruiter") {
                navigate("/recruiter/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div
                className="auth-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="auth-close"
                    onClick={onClose}
                    type="button"
                >
                    <X size={21} />
                </button>

                <div className="auth-heading">
                    <div className="auth-logo">
                        <BriefcaseBusiness size={27} />
                    </div>

                    <h2>Create Account</h2>
                    <p>Join JobPilot AI and explore opportunities.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <label>Account Type</label>

                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="job_seeker">Job Seeker</option>
                            <option value="recruiter">Recruiter</option>
                        </select>
                    </div>

                    {formData.role === "recruiter" && (
                        <div className="auth-form-group">
                            <label>Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                placeholder="Enter your company name"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <p className="auth-error">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-switch-text">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => onSwitch("login")}
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterModal;