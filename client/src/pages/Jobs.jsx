import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getJobs } from "../services/jobService";
import "./Jobs.css";

const Jobs = () => {
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    jobType: "",
    workplaceType: "",
    experienceLevel: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getJobs({
          ...appliedFilters,
          page: currentPage,
          limit: 10,
        });

        setJobs(response.jobs);
        setTotalPages(response.totalPages);
        setTotalJobs(response.totalJobs);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load jobs. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [appliedFilters, currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      location: "",
      jobType: "",
      workplaceType: "",
      experienceLevel: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Salary not disclosed";

    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount);
    };

    if (min && max) {
      return `₹${formatAmount(min)} - ₹${formatAmount(max)}`;
    }

    return min ? `From ₹${formatAmount(min)}` : `Up to ₹${formatAmount(max)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="jobs-page">
      <section className="jobs-header">
        <span className="jobs-eyebrow">CAREER OPPORTUNITIES</span>

        <h1>
          Find Your <span>Dream Job</span>
        </h1>

        <p>
          Explore opportunities from different companies and take the next step
          in your career.
        </p>
      </section>

      <section className="jobs-search-section">
        <form className="jobs-search-form" onSubmit={handleSearch}>
          <div className="jobs-input-group">
            <Search size={19} />
            <input
              type="text"
              name="search"
              placeholder="Job title, company or keyword"
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          <div className="jobs-input-group">
            <MapPin size={19} />

            <input
              type="text"
              name="location"
              list="location-options"
              placeholder="Search location"
              value={filters.location}
              onChange={handleChange}
            />

            <datalist id="location-options">
              <option value="Chennai" />
              <option value="Bangalore" />
              <option value="Hyderabad" />
              <option value="Mumbai" />
              <option value="Pune" />
              <option value="Delhi" />
              <option value="Noida" />
              <option value="Gurgaon" />
              <option value="Kochi" />
              <option value="Coimbatore" />
              <option value="Trichy" />
              <option value="Madurai" />
            </datalist>
          </div>

          <button type="submit" className="jobs-search-btn">
            <Search size={18} />
            Search Jobs
          </button>
        </form>

        <div className="jobs-filter-row">
          <select
            name="jobType"
            value={filters.jobType}
            onChange={handleChange}
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>

          <select
            name="workplaceType"
            value={filters.workplaceType}
            onChange={handleChange}
          >
            <option value="">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select
            name="experienceLevel"
            value={filters.experienceLevel}
            onChange={handleChange}
          >
            <option value="">All Experience Levels</option>
            <option value="Fresher">Fresher</option>
            <option value="Entry-level">Entry-level</option>
            <option value="Mid-level">Mid-level</option>
            <option value="Senior-level">Senior-level</option>
          </select>

          <button
            type="button"
            className="jobs-clear-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="jobs-results-section">
        <div className="jobs-results-header">
          <div>
            <h2>Available Jobs</h2>
            <p>
              {loading ? "Loading opportunities..." : `${totalJobs} jobs found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="jobs-message">
            <div className="jobs-loader"></div>
            <p>Finding opportunities for you...</p>
          </div>
        ) : error ? (
          <div className="jobs-message jobs-error">
            <p>{error}</p>
            <button onClick={() => setAppliedFilters({ ...appliedFilters })}>
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs-message jobs-empty">
            <BriefcaseBusiness size={42} />
            <h3>No Jobs Found</h3>
            <p>
              No matching jobs are available right now. Try changing your search
              or filters.
            </p>
            <button onClick={clearFilters}>Clear All Filters</button>
          </div>
        ) : (
          <>
            <div className="jobs-list">
              {jobs.map((job) => (
                <article className="job-card" key={job.id}>
                  <div className="job-card-top">
                    <div className="job-company-icon">
                      <Building2 size={25} />
                    </div>

                    <div className="job-card-title">
                      <h3>{job.title}</h3>
                      <p>{job.company_name}</p>
                    </div>

                    <span className="job-type-badge">{job.job_type}</span>
                  </div>

                  <div className="job-card-details">
                    <span>
                      <MapPin size={16} />
                      {job.location}
                    </span>

                    <span>
                      <BriefcaseBusiness size={16} />
                      {job.experience_level}
                    </span>

                    <span>
                      <Clock size={16} />
                      {job.workplace_type}
                    </span>
                  </div>

                  <p className="job-card-description">
                    {job.description?.length > 180
                      ? `${job.description.substring(0, 180)}...`
                      : job.description}
                  </p>

                  <div className="job-card-skills">
                    {job.skills?.slice(0, 5).map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>

                  <div className="job-card-bottom">
                    <div>
                      <strong>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </strong>
                      <small>Posted {formatDate(job.created_at)}</small>
                    </div>

                    <Link to={`/jobs/${job.id}`} className="job-view-btn">
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="jobs-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Jobs;
