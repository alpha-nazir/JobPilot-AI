import api from "./api";

// Upload Resume
export const uploadResume = async (formData) => {
    const response = await api.post("/resumes/upload", formData);
    return response.data;
};

// Get My Resumes
export const getMyResumes = async () => {
    const response = await api.get("/resumes");
    return response.data;
};

// View Resume
export const getResumeFile = async (resumeId) => {
    const response = await api.get(`/resumes/${resumeId}/view`);
    return response.data;
};

// Set Primary Resume
export const setPrimaryResume = async (resumeId) => {
    const response = await api.put(`/resumes/${resumeId}/primary`);
    return response.data;
};

// Delete Resume
export const deleteResume = async (resumeId) => {
    const response = await api.delete(`/resumes/${resumeId}`);
    return response.data;
};