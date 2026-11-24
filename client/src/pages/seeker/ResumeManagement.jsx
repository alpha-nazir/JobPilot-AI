import { useEffect, useState } from "react";
import {
    Upload,
    FileText,
    Eye,
    Trash2,
    Star,
    LoaderCircle,
    FilePlus2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    uploadResume,
    getMyResumes,
    getResumeFile,
    setPrimaryResume,
    deleteResume,
} from "../../services/resumeService";

import "./ResumeManagement.css";

const ResumeManagement = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [actionId, setActionId] = useState(null);

    const fetchResumes = async () => {
        try {
            const response = await getMyResumes();
            setResumes(response.resumes || []);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to load resumes."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Resume must be smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("resume", file);

            const response = await uploadResume(formData);

            toast.success(response.message || "Resume uploaded!");
            await fetchResumes();

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Resume upload failed."
            );
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleView = async (resumeId) => {
        try {
            setActionId(resumeId);

            const response = await getResumeFile(resumeId);

            window.open(response.resumeUrl, "_blank", "noopener,noreferrer");

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Unable to open resume."
            );
        } finally {
            setActionId(null);
        }
    };

    const handleSetPrimary = async (resumeId) => {
        try {
            setActionId(resumeId);

            const response = await setPrimaryResume(resumeId);

            toast.success(response.message);
            await fetchResumes();

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to update primary resume."
            );
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (resumeId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this resume?"
        );

        if (!confirmed) return;

        try {
            setActionId(resumeId);

            const response = await deleteResume(resumeId);

            toast.success(response.message);
            await fetchResumes();

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to delete resume."
            );
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="resume-management-page">
            <div className="resume-management-container">

                <div className="resume-management-header">
                    <div>
                        <h1>Resume Management</h1>
                        <p>Upload and manage your professional resumes.</p>
                    </div>

                    <label className="resume-upload-btn">
                        {uploading ? (
                            <LoaderCircle size={18} className="resume-spinner" />
                        ) : (
                            <Upload size={18} />
                        )}

                        {uploading ? "Uploading..." : "Upload Resume"}

                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleUpload}
                            disabled={uploading}
                            hidden
                        />
                    </label>
                </div>

                <div className="resume-info-card">
                    <FilePlus2 size={22} />

                    <div>
                        <h3>Manage your resumes</h3>
                        <p>
                            Upload PDF resumes up to 5 MB. Set one resume
                            as your primary resume for quick access.
                        </p>
                    </div>
                </div>

                <div className="resume-list-header">
                    <h2>My Resumes</h2>
                    <span>{resumes.length} Resume(s)</span>
                </div>

                {loading ? (
                    <div className="resume-loading">
                        <LoaderCircle className="resume-spinner" size={28} />
                        <p>Loading resumes...</p>
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="resume-empty">
                        <FileText size={48} />
                        <h3>No resumes uploaded yet</h3>
                        <p>Upload your first PDF resume to get started.</p>
                    </div>
                ) : (
                    <div className="resume-list">
                        {resumes.map((resume) => (
                            <div className="resume-card" key={resume.id}>

                                <div className="resume-card-info">
                                    <div className="resume-file-icon">
                                        <FileText size={25} />
                                    </div>

                                    <div className="resume-file-details">
                                        <h3>{resume.file_name}</h3>

                                        <p>
                                            Uploaded on{" "}
                                            {new Date(
                                                resume.created_at
                                            ).toLocaleDateString()}
                                        </p>

                                        {resume.is_primary && (
                                            <span className="resume-primary-badge">
                                                <Star size={13} />
                                                Primary Resume
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="resume-card-actions">

                                    <button
                                        type="button"
                                        onClick={() => handleView(resume.id)}
                                        disabled={actionId === resume.id}
                                        title="View Resume"
                                    >
                                        <Eye size={17} />
                                        View
                                    </button>

                                    {!resume.is_primary && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSetPrimary(resume.id)
                                            }
                                            disabled={actionId === resume.id}
                                            title="Set as Primary"
                                        >
                                            <Star size={17} />
                                            Set Primary
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="resume-delete-btn"
                                        onClick={() =>
                                            handleDelete(resume.id)
                                        }
                                        disabled={actionId === resume.id}
                                        title="Delete Resume"
                                    >
                                        <Trash2 size={17} />
                                        Delete
                                    </button>

                                </div>

                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ResumeManagement;