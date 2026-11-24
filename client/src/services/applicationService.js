import api from "./api";

// Submit Job Application
export const submitApplication = async (jobId, formData) => {
    const response = await api.post(
        `/applications/${jobId}/apply`,
        formData
    );

    return response.data;
};