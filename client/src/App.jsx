import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import JobApplicants from "./pages/recruiter/JobApplicants";
import PostJob from "./pages/recruiter/PostJob";
import EditJob from "./pages/recruiter/EditJob";
import ApplyJob from "./pages/seeker/ApplyJob";
import SavedJobs from "./pages/seeker/SavedJobs";
import SeekerDashboard from "./pages/seeker/seekerDashboard";
import ResumeManagement from "./pages/seeker/ResumeManagement";
import AIResumeAnalyzer from "./pages/seeker/AIResumeAnalyzer";
import AIJobAssistant from "./pages/seeker/AIJobAssistant";
import Interviews from "./pages/seeker/Interviews";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />

        {/* Job Seeker Routes */}
        <Route element={<ProtectedRoute allowedRoles={["job_seeker"]} />}>
          <Route path="/dashboard" element={<SeekerDashboard />} />
          <Route path="/saved-jobs" element={<SavedJobs />} />
          <Route path="/apply/:id" element={<ApplyJob />} />
          <Route path="/resume-management" element={<ResumeManagement />} />
          <Route path="/ai-resume-analyzer" element={<AIResumeAnalyzer />} />
          <Route path="/ai-job-assistant" element={<AIJobAssistant />} />
          <Route
            path="/interviews"
            element={<Interviews role="job_seeker" />}
          />
        </Route>

        {/* Recruiter Routes */}
        <Route element={<ProtectedRoute allowedRoles={["recruiter"]} />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/post-job" element={<PostJob />} />
          <Route path="/recruiter/edit-job/:id" element={<EditJob />} />
          <Route
            path="/recruiter/jobs/:id/applicants"
            element={<JobApplicants />}
          />
          <Route
            path="/recruiter/interviews"
            element={<Interviews role="recruiter" />}
          />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/admin/jobs" element={<AdminJobs />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
