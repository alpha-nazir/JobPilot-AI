import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(
        localStorage.getItem("jobpilot_token")
    );
    const [loading, setLoading] = useState(true);

    // Check existing login
    useEffect(() => {
        const verifyUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem("jobpilot_token");
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, [token]);

    // Login
    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const { token: newToken, user: userData } = response.data;

        localStorage.setItem("jobpilot_token", newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    // Register
    const register = async (formData) => {
        const response = await api.post("/auth/register", formData);

        const { token: newToken, user: userData } = response.data;

        localStorage.setItem("jobpilot_token", newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("jobpilot_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom authentication hook
export const useAuth = () => {
    return useContext(AuthContext);
};