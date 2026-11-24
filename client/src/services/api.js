import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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

        // Let the browser set the multipart boundary for file uploads
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