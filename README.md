# JobPilot AI 🚀

**An AI-powered job portal connecting job seekers and recruiters through intelligent recruitment tools.**

JobPilot AI is a full-stack job portal designed to simplify the recruitment process. It provides a platform where job seekers can discover opportunities, manage applications, upload resumes, and access AI-powered career assistance, while recruiters can manage job postings and applicants.

The platform also includes an administrative dashboard for managing users and job listings.

## 🌐 Live Demo

**Live Application:** [https://jobpilot-ai-tawny.vercel.app/]

## ✨ Features

### 👨‍💻 Job Seeker
- Register and log in as a job seeker.
- Browse and search available job opportunities without logging in.
- View detailed job descriptions.
- Apply for jobs.
- Save jobs for later.
- Manage uploaded resumes.
- Set a primary resume.
- Track job applications through a personal dashboard.
- Schedule and view interview details.
- Access AI-powered resume analysis.
- Interact with an AI Job Assistant.

### 🏢 Recruiter
- Register and log in as a recruiter.
- Create and publish job listings.
- Edit and manage posted jobs.
- View applicants for individual job postings.
- Review applicant information.
- Manage application statuses.
- Schedule and manage interviews.
- Access a dedicated recruiter dashboard.

### 🛡️ Admin
- Access a dedicated admin dashboard.
- View platform statistics.
- Manage registered users.
- Activate and deactivate user accounts.
- View and manage job listings.
- Remove unwanted job postings.

### 🤖 AI-Powered Features

**AI Resume Analyzer**
- Upload PDF resumes.
- Analyze resume content using AI.
- Generate resume match scores.
- Identify relevant skills and improvement areas.
- View previous resume analysis results.

**AI Job Assistant**
- Interact with an AI-powered career assistant.
- Maintain multiple conversations.
- View conversation history.
- Regenerate AI responses.
- Manage and delete conversations.

### 🎨 Additional Features
- Dark and light theme support.
- Responsive user interface.
- Role-based authentication and authorization.
- Protected routes.
- Login and registration popups.
- Resume upload and cloud storage.
- Real-time API communication.
- User-friendly notifications and feedback messages.

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router
- Axios
- Lucide React
- Recharts
- React Hot Toast
- React Markdown

### Backend
- Node.js
- Express.js
- JavaScript
- REST API
- JSON Web Token (JWT)
- Multer
- PDF Parse

### Database
- PostgreSQL

### AI Integration
- OpenRouter API

### Cloud & Deployment
- Cloudinary – Resume storage
- Render – Backend hosting and PostgreSQL
- Vercel – Frontend hosting
- GitHub – Version control

## 🏗️ Project Architecture

JobPilot AI follows a client-server architecture.

```text
JobPilot-AI/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── package.json
│   └── server.js
│
└── README.md
```

*The directory structure above represents the main project organization.*

## ⚙️ Installation & Setup

Follow these steps to run JobPilot AI locally.

### 1. Clone the Repository

```bash
git clone https://github.com/alpha-nazir/JobPilot-AI
```

### 2. Navigate to the Project

```bash
cd JobPilot-AI
```

### 3. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure your database credentials, JWT secret, OpenRouter API key, Cloudinary credentials, and other required backend environment variables.

Use the exact variable names expected by your backend configuration.

Start the backend:

```bash
npm run dev
```

### 4. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The application will be available at the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## 🔐 Environment Variables

The application requires environment configuration for:

| Configuration | Purpose |
|---|---|
| Database credentials | PostgreSQL connection |
| JWT secret | Authentication and authorization |
| OpenRouter API key | AI-powered features |
| Cloudinary credentials | Resume file storage |
| Backend port | Express server |
| VITE_API_URL | Frontend API connection |

**Important:** Never commit `.env` files, API keys, database passwords, or other private credentials to GitHub.

## 🔒 Security & Authorization

JobPilot AI implements role-based access control.

- JWT-based authentication.
- Protected frontend routes.
- Backend authentication middleware.
- Role-based API authorization.
- Job Seeker-only access to AI features.
- Recruiter-only access to recruitment management features.
- Admin-only access to administrative features.

Public job browsing is available without authentication, while actions such as applying for jobs require login.

## 🚀 Deployment

The application is deployed using:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| PostgreSQL Database | Render |
| Resume Storage | Cloudinary |
| Source Code | GitHub |

The frontend communicates with the deployed backend through the configured API URL.

## 🎯 Project Objective

The objective of JobPilot AI is to make the recruitment process more accessible and efficient by combining traditional job portal functionality with AI-powered tools.

It brings job seekers, recruiters, and administrators together in one platform with dedicated dashboards and role-specific capabilities.

## 👨‍💻 Developer

**Developed by Alpha Nazir**

Full Stack Development Project

**Technologies:** JavaScript | React.js | Node.js | Express.js | PostgreSQL | AI Integration

---

⭐ If you find this project interesting, consider giving the repository a star!
