import { useEffect, useState } from "react";
import {
    FileText,
    Upload,
    Brain,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    History,
    Target,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import "./AIResumeAnalyzer.css";

const AIResumeAnalyzer = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Fetch Previous Analysis History
    const fetchHistory = async () => {
        try {
            const response = await api.get("/ai-resume/history");

            if (response.data.success) {
                setHistory(response.data.analyses || []);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to load analysis history."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Handle PDF Selection
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must not exceed 5 MB.");
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
        setAnalysis(null);
    };

    // Analyze Resume
    const handleAnalyze = async () => {
        if (!selectedFile) {
            toast.error("Please select a PDF resume.");
            return;
        }

        const formData = new FormData();
        formData.append("resume", selectedFile);

        setLoading(true);

        try {
            const response = await api.post(
                "/ai-resume/analyze",
                formData
            );

            if (response.data.success) {
                setAnalysis(response.data.analysis);
                toast.success("Resume analyzed successfully.");
                await fetchHistory();
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Resume analysis failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Load Previous Analysis
    const handleViewHistory = (item) => {
        setAnalysis(item);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Clear Selected File
    const handleRemoveFile = () => {
        setSelectedFile(null);

        const input = document.getElementById("resume-upload");

        if (input) {
            input.value = "";
        }
    };

    return (
        <div className="ai-resume-page">

            {/* Page Header */}
            <div className="ai-resume-header">
                <div>
                    <div className="ai-resume-title-icon">
                        <Brain size={28} />
                    </div>

                    <h1>AI Resume Analyzer</h1>

                    <p>
                        Analyze your resume with AI and discover ways
                        to improve your job readiness.
                    </p>
                </div>
            </div>

            {/* Upload Section */}
            <section className="ai-resume-upload-card">

                <div className="ai-section-heading">
                    <div className="ai-section-icon">
                        <Upload size={21} />
                    </div>

                    <div>
                        <h2>Upload Your Resume</h2>
                        <p>Upload your resume in PDF format.</p>
                    </div>
                </div>

                <label
                    htmlFor="resume-upload"
                    className="ai-resume-dropzone"
                >
                    <div className="ai-upload-icon">
                        <FileText size={34} />
                    </div>

                    <h3>
                        {selectedFile
                            ? "Resume selected"
                            : "Choose your resume"}
                    </h3>

                    <p>
                        Click here to browse your files
                    </p>

                    <span>PDF format · Maximum 5 MB</span>

                    <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        hidden
                    />
                </label>

                {selectedFile && (
                    <div className="ai-selected-file">
                        <div className="ai-selected-file-info">
                            <FileText size={22} />

                            <div>
                                <strong>{selectedFile.name}</strong>
                                <span>
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="ai-remove-file"
                            disabled={loading}
                            aria-label="Remove selected resume"
                        >
                            <X size={19} />
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    className="ai-analyze-button"
                    onClick={handleAnalyze}
                    disabled={!selectedFile || loading}
                >
                    {loading ? (
                        <>
                            <LoaderCircle size={19} className="ai-spin" />
                            Analyzing Resume...
                        </>
                    ) : (
                        <>
                            <Sparkles size={19} />
                            Analyze Resume
                        </>
                    )}
                </button>

                {loading && (
                    <p className="ai-loading-message">
                        AI is reviewing your resume. Please wait...
                    </p>
                )}
            </section>

            {/* Analysis Results */}
            {analysis && (
                <section className="ai-analysis-results">

                    <div className="ai-results-heading">
                        <div>
                            <h2>Analysis Results</h2>
                            <p>Your AI-powered resume evaluation.</p>
                        </div>

                        <span className="ai-result-badge">
                            <CheckCircle2 size={16} />
                            Analysis Complete
                        </span>
                    </div>

                    {/* Match Score */}
                    <div className="ai-score-card">
                        <div className="ai-score-icon">
                            <Target size={25} />
                        </div>

                        <div>
                            <span>Resume Score</span>

                            <h2>
                                {Math.round(Number(analysis.match_score))}%
                            </h2>

                            <p>
                                Overall resume quality score
                            </p>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="ai-result-grid">

                        <div className="ai-result-card">
                            <div className="ai-card-heading">
                                <CheckCircle2 size={20} />
                                <h3>Extracted Skills</h3>
                            </div>

                            <div className="ai-skill-list">
                                {analysis.extracted_skills?.length > 0 ? (
                                    analysis.extracted_skills.map((skill, index) => (
                                        <span key={index} className="ai-skill-tag">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p>No skills found.</p>
                                )}
                            </div>
                        </div>

                        <div className="ai-result-card">
                            <div className="ai-card-heading">
                                <AlertCircle size={20} />
                                <h3>Missing Skills</h3>
                            </div>

                            <div className="ai-skill-list">
                                {analysis.missing_skills?.length > 0 ? (
                                    analysis.missing_skills.map((skill, index) => (
                                        <span key={index} className="ai-missing-tag">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p>No missing skills identified.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Strengths */}
                    <div className="ai-result-card ai-text-card">
                        <div className="ai-card-heading">
                            <CheckCircle2 size={20} />
                            <h3>Strengths</h3>
                        </div>

                        <p>{analysis.strengths || "No strengths available."}</p>
                    </div>

                    {/* Weaknesses */}
                    <div className="ai-result-card ai-text-card">
                        <div className="ai-card-heading">
                            <AlertCircle size={20} />
                            <h3>Weaknesses</h3>
                        </div>

                        <p>{analysis.weaknesses || "No weaknesses available."}</p>
                    </div>

                    {/* Suggestions */}
                    <div className="ai-result-card ai-text-card">
                        <div className="ai-card-heading">
                            <Sparkles size={20} />
                            <h3>AI Improvement Suggestions</h3>
                        </div>

                        <p>{analysis.suggestions || "No suggestions available."}</p>
                    </div>

                </section>
            )}

            {/* Analysis History */}
            <section className="ai-history-section">

                <div className="ai-results-heading">
                    <div>
                        <h2>
                            <History size={22} />
                            Analysis History
                        </h2>

                        <p>View your previously analyzed resumes.</p>
                    </div>
                </div>

                {historyLoading ? (
                    <div className="ai-history-loading">
                        <LoaderCircle size={22} className="ai-spin" />
                        Loading history...
                    </div>
                ) : history.length === 0 ? (
                    <div className="ai-empty-history">
                        <FileText size={35} />
                        <h3>No Analysis History</h3>
                        <p>Your previous resume analyses will appear here.</p>
                    </div>
                ) : (
                    <div className="ai-history-list">
                        {history.map((item) => (
                            <div className="ai-history-item" key={item.id}>

                                <div className="ai-history-file-icon">
                                    <FileText size={23} />
                                </div>

                                <div className="ai-history-info">
                                    <strong>Resume Analysis #{item.id}</strong>

                                    <span>
                                        {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="ai-history-score">
                                    {Math.round(Number(item.match_score))}%
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleViewHistory(item)}
                                    className="ai-history-view-button"
                                >
                                    View Results
                                </button>

                            </div>
                        ))}
                    </div>
                )}

            </section>

        </div>
    );
};

export default AIResumeAnalyzer;