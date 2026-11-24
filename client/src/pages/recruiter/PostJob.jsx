import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { createJob } from "../../services/jobService";
import "./PostJob.css";

const PostJob = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

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

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);

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

            const response = await createJob(jobData);

            toast.success(response.message || "Job posted successfully!");

            navigate("/jobs");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to post job."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post-job-page">
            <div className="post-job-container">
                <div className="post-job-heading">
                    <span className="post-job-badge">RECRUITER PORTAL</span>
                    <h1>Post a New Job</h1>
                    <p>Find the right talent for your organization.</p>
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
                                    placeholder="e.g. Frontend Developer"
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Company Name *</label>
                                <input
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    placeholder="Company name"
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Location *</label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Chennai"
                                    required
                                />
                            </div>

                            <div className="post-job-field">
                                <label>Category</label>
                                <input
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g. IT"
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
                                    placeholder="e.g. 300000"
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
                                    placeholder="e.g. 500000"
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
                                placeholder="Describe the job role..."
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
                                placeholder="Mention required qualifications and experience..."
                                rows="4"
                            />
                        </div>

                        <div className="post-job-field">
                            <label>Responsibilities</label>
                            <textarea
                                name="responsibilities"
                                value={formData.responsibilities}
                                onChange={handleChange}
                                placeholder="Mention key responsibilities..."
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
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="post-job-submit"
                            disabled={loading}
                        >
                            {loading ? "Publishing..." : "Publish Job"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostJob;