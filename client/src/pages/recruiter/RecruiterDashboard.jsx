import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Plus,
  MapPin,
  CalendarDays,
  LoaderCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getRecruiterJobs, deleteJob } from "../../services/jobService";

import "./RecruiterDashboard.css";

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getRecruiterJobs();
        setJobs(response.jobs || []);
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to load your jobs.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const activeJobs = jobs.filter((job) => job.status === "active").length;

  const handleDeleteJob = async (jobId) => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this job posting?"
    );

    if (!confirmed) return;

    try {
        await deleteJob(jobId);

        setJobs((previousJobs) =>
            previousJobs.filter((job) => job.id !== jobId)
        );

        toast.success("Job deleted successfully!");

    } catch (error) {
        toast.error(
            error.response?.data?.message ||
            "Failed to delete job."
        );
    }
};

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="recruiter-dashboard">
      <div className="recruiter-dashboard-container">
        <div className="recruiter-dashboard-header">
          <div>
            <span className="dashboard-badge">RECRUITER PORTAL</span>

            <h1>Recruiter Dashboard</h1>

            <p>Manage your job postings and find the right talent.</p>
          </div>

          <button
            className="dashboard-post-btn"
            onClick={() => navigate("/recruiter/post-job")}
          >
            <Plus size={19} />
            Post a Job
          </button>
        </div>

        <div className="recruiter-stats-grid">
          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <p>Total Jobs Posted</p>
              <h2>{loading ? "—" : jobs.length}</h2>
            </div>
          </div>

          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon active">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <p>Active Jobs</p>
              <h2>{loading ? "—" : activeJobs}</h2>
            </div>
          </div>
        </div>

        <div className="recruiter-jobs-section">
          <div className="recruiter-jobs-heading">
            <div>
              <h2>Recent Job Postings</h2>
              <p>Manage the jobs you have published.</p>
            </div>

            <button
              className="view-all-jobs-btn"
              onClick={() => navigate("/jobs")}
            >
              View Public Jobs
            </button>
          </div>

          {loading ? (
            <div className="recruiter-dashboard-state">
              <LoaderCircle className="loading-icon" size={28} />
              <p>Loading your jobs...</p>
            </div>
          ) : error ? (
            <div className="recruiter-dashboard-state">
              <AlertCircle size={28} />
              <p>{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="recruiter-dashboard-state">
              <BriefcaseBusiness size={35} />
              <h3>No jobs posted yet</h3>
              <p>Publish your first job to get started.</p>

              <button
                className="dashboard-post-btn"
                onClick={() => navigate("/recruiter/post-job")}
              >
                <Plus size={18} />
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="recruiter-jobs-list">
              {jobs.slice(0, 5).map((job) => (
                <div className="recruiter-job-card" key={job.id}>
                  <div className="recruiter-job-info">
                    <h3>{job.title}</h3>

                    <p>{job.company_name}</p>

                    <div className="recruiter-job-meta">
                      <span>
                        <MapPin size={14} />
                        {job.location}
                      </span>

                      <span>
                        <CalendarDays size={14} />
                        Deadline: {formatDate(job.application_deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="recruiter-job-right">
                    <span className={`job-status ${job.status}`}>
                      {job.status}
                    </span>

                    <span className="recruiter-job-type">{job.job_type}</span>

                    <button
                      className="edit-job-btn"
                      onClick={() => navigate(`/recruiter/edit-job/${job.id}`)}
                    >
                      Edit Job
                    </button>

                    <button
                      className="view-applicants-btn"
                      onClick={() =>
                        navigate(`/recruiter/jobs/${job.id}/applicants`)
                      }
                    >
                      View Applicants
                    </button>

                    <button
                        className="delete-job-btn"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
