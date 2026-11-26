import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT token and handle FormData
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("jobpilot_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            config.headers.delete("Content-Type");
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;