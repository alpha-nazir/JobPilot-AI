import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getJobById, updateJob } from "../../services/jobService";
import "./PostJob.css";

const EditJob = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        company_name: "",
        location: "",
        job_type: "Full-time",
        workplace_type: "On-site",
        experience_level: "Entry-level",
        salary_min: "",
        salary_max: "",
        description: "",
        requirements: "",
        responsibilities: "",
        skills: "",
        category: "",
        application_deadline: "",
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await getJobById(id);
                const job = response.job;

                setFormData({
                    title: job.title || "",
                    company_name: job.company_name || "",
                    location: job.location || "",
                    job_type: job.job_type || "Full-time",
                    workplace_type: job.workplace_type || "On-site",
                    experience_level: job.experience_level || "Entry-level",
                    salary_min: job.salary_min ?? "",
                    salary_max: job.salary_max ?? "",
                    description: job.description || "",
                    requirements: job.requirements || "",
                    responsibilities: job.responsibilities || "",
                    skills: Array.isArray(job.skills)
                        ? job.skills.join(", ")
                        : "",
                    category: job.category || "",
                    application_deadline: job.application_deadline
                        ? String(job.application_deadline).slice(0, 10)
                        : "",
                });
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Failed to load job details."
                );

                navigate("/recruiter/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id, navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            const jobData = {
                ...formData,
                salary_min: formData.salary_min || null,
                salary_max: formData.salary_max || null,
                skills: formData.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                application_deadline:
                    formData.application_deadline || null,
            };

            const response = await updateJob(id, jobData);

            toast.success(
                response.message || "Job updated successfully!"
            );

            navigate("/recruiter/dashboard");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to update job."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="post-job-page">
                <div className="post-job-container">
                    <p>Loading job details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="post-job-page">
            <div className="post-job-container">
                <div className="post-job-heading">
                    <span className="post-job-badge">
                        RECRUITER PORTAL
                    </span>

                    <h1>Edit Job Posting</h1>
                    <p>Update your job information.</p>
                </div>

                <form className="post-job-form" onSubmit={handleSubmit}>
                    <div className="post-job-section">
                        <h2>Basic Information</h2>

                        <div className="post-job-grid">
                            <div className="post-job-field">
                                <label>Job Title *</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Company Name *</label>
                                <input
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Location *</label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Category</label>
                                <input
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="post-job-section">
                        <h2>Job Preferences</h2>

                        <div className="post-job-grid">
                            <div className="post-job-field">
                                <label>Job Type *</label>
                                <select
                                    name="job_type"
                                    value={formData.job_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                    <option>Freelance</option>
                                </select>
                            </div>

                            <div className="post-job-field">
                                <label>Workplace Type *</label>
                                <select
                                    name="workplace_type"
                                    value={formData.workplace_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option>On-site</option>
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                </select>
                            </div>

                            <div className="post-job-field">
                                <label>Experience Level *</label>
                                <select
                                    name="experience_level"
                                    value={formData.experience_level}
                                    onChange={handleChange}
                                    required
                                >
                                    <option>Entry-level</option>
                                    <option>Junior</option>
                                    <option>Mid-level</option>
                                    <option>Senior</option>
                                    <option>Lead</option>
                                </select>
                            </div>

                            <div className="post-job-field">
                                <label>Application Deadline</label>
                                <input
                                    type="date"
                                    name="application_deadline"
                                    value={formData.application_deadline}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="post-job-section">
                        <h2>Salary Details</h2>

                        <div className="post-job-grid">
                            <div className="post-job-field">
                                <label>Minimum Salary (Annual)</label>
                                <input
                                    type="number"
                                    name="salary_min"
                                    value={formData.salary_min}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Maximum Salary (Annual)</label>
                                <input
                                    type="number"
                                    name="salary_max"
                                    value={formData.salary_max}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="post-job-section">
                        <h2>Job Description</h2>

                        <div className="post-job-field">
                            <label>Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="5"
                                required
                            />
                        </div>

                        <div className="post-job-field">
                            <label>Requirements</label>
                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                rows="4"
                            />
                        </div>

                        <div className="post-job-field">
                            <label>Responsibilities</label>
                            <textarea
                                name="responsibilities"
                                value={formData.responsibilities}
                                onChange={handleChange}
                                rows="4"
                            />
                        </div>

                        <div className="post-job-field">
                            <label>Skills</label>
                            <input
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="React, JavaScript, CSS"
                            />
                            <small>Separate skills using commas.</small>
                        </div>
                    </div>

                    <div className="post-job-actions">
                        <button
                            type="button"
                            className="post-job-cancel"
                            onClick={() =>
                                navigate("/recruiter/dashboard")
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="post-job-submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Saving Changes..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJob;