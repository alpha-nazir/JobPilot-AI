import { useState } from "react";
import { X, BriefcaseBusiness, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginModal = ({ onClose, onSwitch }) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await login(email, password);

            onClose();

            if (user.role === "recruiter") {
                navigate("/recruiter/dashboard");
            } else if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials."
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

                    <h2>Welcome Back</h2>
                    <p>Login to continue your career journey.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    {error && (
                        <p className="auth-error">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-switch-text">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => onSwitch("register")}
                    >
                        Create Account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;