import api from "./api";

// Fetch jobs with search and filters
export const getJobs = async (filters = {}) => {
    const response = await api.get("/jobs", {
        params: filters,
    });

    return response.data;
};

// Fetch individual job details
export const getJobById = async (id) => {
    const response = await api.get(`/jobs/${id}`);

    return response.data;
};

// Create a new job (Recruiter only)
export const createJob = async (jobData) => {
    const token = localStorage.getItem("jobpilot_token");

    const response = await api.post("/jobs", jobData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};


// Fetch jobs posted by the logged-in recruiter
export const getRecruiterJobs = async () => {
    const token = localStorage.getItem("jobpilot_token");

    const response = await api.get("/jobs/recruiter/my-jobs", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

// Update an existing job
export const updateJob = async (id, jobData) => {
    const token = localStorage.getItem("jobpilot_token");

    const response = await api.put(`/jobs/${id}`, jobData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const deleteJob = async (id) => {
    const token = localStorage.getItem("jobpilot_token");

    const response = await api.delete(`/jobs/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};