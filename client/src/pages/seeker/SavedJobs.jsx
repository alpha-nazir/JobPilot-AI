import { useEffect, useState } from "react";
import {
    Bookmark,
    MapPin,
    BriefcaseBusiness,
    Clock,
    Trash2,
    ArrowRight,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getSavedJobs, removeSavedJob } from "../../services/savedJobService";
import "./SavedJobs.css";

const SavedJobs = () => {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSavedJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getSavedJobs();
            setSavedJobs(response.savedJobs || []);

        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load saved jobs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const handleRemove = async (jobId) => {
        try {
            await removeSavedJob(jobId);

            setSavedJobs((previousJobs) =>
                previousJobs.filter((job) => job.id !== jobId)
            );

            toast.success("Job removed from saved jobs.");

        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to remove saved job."
            );
        }
    };

    if (loading) {
        return (
            <div className="saved-jobs-loading">
                <LoaderCircle size={30} className="saved-jobs-spinner" />
                <p>Loading saved jobs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="saved-jobs-error">
                <AlertCircle size={30} />
                <p>{error}</p>
                <button onClick={fetchSavedJobs}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="saved-jobs-page">

            <div className="saved-jobs-header">
                <div>
                    <h1>Saved Jobs</h1>
                    <p>Keep track of opportunities you are interested in.</p>
                </div>

                <Link to="/jobs" className="browse-jobs-btn">
                    Browse Jobs <ArrowRight size={17} />
                </Link>
            </div>

            <div className="saved-jobs-count">
                <Bookmark size={19} />
                <span>{savedJobs.length} Saved Jobs</span>
            </div>

            {savedJobs.length === 0 ? (
                <div className="saved-jobs-empty">
                    <div className="saved-jobs-empty-icon">
                        <Bookmark size={35} />
                    </div>

                    <h2>No Saved Jobs Yet</h2>

                    <p>
                        Save jobs that interest you and they will appear here.
                    </p>

                    <Link to="/jobs" className="browse-jobs-btn">
                        Explore Jobs <ArrowRight size={17} />
                    </Link>
                </div>
            ) : (
                <div className="saved-jobs-list">
                    {savedJobs.map((job) => (
                        <div className="saved-job-card" key={job.saved_job_id}>

                            <div className="saved-job-main">
                                <div className="saved-job-info">
                                    <h2>{job.title}</h2>
                                    <p className="saved-job-company">
                                        {job.company_name}
                                    </p>
                                </div>

                                <button
                                    className="remove-saved-job-btn"
                                    onClick={() => handleRemove(job.id)}
                                    title="Remove saved job"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="saved-job-details">
                                <span>
                                    <MapPin size={15} />
                                    {job.location}
                                </span>

                                <span>
                                    <BriefcaseBusiness size={15} />
                                    {job.job_type}
                                </span>

                                <span>
                                    <Clock size={15} />
                                    {job.experience_level}
                                </span>
                            </div>

                            <div className="saved-job-footer">
                                <span className="saved-job-workplace">
                                    {job.workplace_type}
                                </span>

                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="view-saved-job-btn"
                                >
                                    View Job <ArrowRight size={16} />
                                </Link>
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default SavedJobs;