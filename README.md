# 🧭 Career Compass

<div align="center">

### Build. Analyze. Apply.

An AI-powered career development platform that helps job seekers create professional resumes, analyze their compatibility with job roles, discover opportunities, and apply with confidence.

🌐 **Live Demo:** https://career-compass-pathway.vercel.app/

</div>

---

## 📌 Overview

Career Compass is a full-stack AI-powered career assistance platform designed to bridge the gap between job seekers and recruiters.

The platform provides:

- AI-generated ATS-friendly resumes
- Resume-to-job compatibility analysis
- Job discovery and application management
- Recruiter job posting and applicant tracking
- Personalized career profile management

Instead of using multiple platforms for resume creation, resume review, and job applications, Career Compass integrates everything into a single ecosystem.

---

## ✨ Key Features

### 🤖 AI Resume Builder

Generate professional resumes using:

- Personal details
- Education
- Experience
- Skills
- Projects
- Certifications
- GitHub profile data

The AI enhances wording while ensuring that no information is fabricated.

---

### 📄 Resume Analyzer

Upload a resume in:

- PDF
- DOCX

Or paste resume content directly.

The analyzer provides:

- Eligibility score
- Hiring verdict
- Matched skills
- Missing skills
- Resume strengths
- Resume weaknesses
- Section-wise improvement suggestions

---

### 💼 Job Board

Browse open opportunities and view:

- Company details
- Job descriptions
- Employment type
- Salary range
- Location information

Users can apply directly through the platform.

---

### 🏢 Recruiter Portal

Recruiters can:

- Create job listings
- Manage openings
- View applications
- Track candidates
- Update hiring requirements

---

### 👤 User Profiles

Maintain professional information including:

- Contact details
- Location
- GitHub profile
- LinkedIn profile
- Portfolio links

---

### 🎨 Resume Templates

Multiple professionally designed resume layouts:

- Modern Template
- Professional Template
- Minimalist Template

---

## 🏗️ System Architecture

```text
                ┌─────────────────┐
                │     User        │
                └────────┬────────┘
                         │
                         ▼
               ┌──────────────────┐
               │ React Frontend   │
               │ TanStack Start   │
               └────────┬─────────┘
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Resume AI   │ │ Job Portal  │ │ Recruiter   │
│ Generator   │ │ Management  │ │ Dashboard   │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────┬───────┴───────┬───────┘
               ▼               ▼

         ┌───────────────────────┐
         │      Supabase         │
         │ Authentication        │
         │ Database              │
         │ Storage               │
         └──────────┬────────────┘
                    │
                    ▼

          ┌───────────────────┐
          │ Gemini AI Model   │
          │ Resume Analysis   │
          │ Resume Generation │
          └───────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- TanStack Query
- Tailwind CSS 4
- Radix UI
- Lucide Icons

### Backend

- Supabase
- Server Functions
- Authentication Middleware

### AI Layer

- Google Gemini 2.5 Flash
- Lovable AI Gateway

### File Processing

- PDF.js
- Mammoth (DOCX Parsing)

### Deployment

- Vercel

---

## 📂 Project Structure

```text
src/
│
├── components/
│   ├── ResumeTemplates
│   ├── AppLayout
│   └── UI Components
│
├── routes/
│   ├── Dashboard
│   ├── Resume Builder
│   ├── Resume Analyzer
│   ├── Jobs
│   ├── Recruiter
│   ├── Profile
│   └── Authentication
│
├── integrations/
│   └── Supabase
│
├── lib/
│   ├── AI Functions
│   ├── Auth Hooks
│   ├── File Parser
│   └── Utilities
│
└── assets/
```

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/thanishkaykb/Career-Compass.git

cd Career-Compass
```

### 2. Install Dependencies

```bash
npm install
```

or

```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
LOVABLE_API_KEY=your_ai_key
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 🔐 Authentication & Roles

Career Compass supports two user roles:

### Job Seeker

- Build resumes
- Analyze resumes
- Browse jobs
- Apply for opportunities

### Recruiter

- Create job postings
- Manage listings
- Review applications
- Track candidates

---

## 🧠 AI Capabilities

### Resume Generation

The AI:

- Structures resume content
- Improves wording
- Creates ATS-friendly sections
- Uses GitHub profile information when available
- Avoids fabricating achievements or experiences

### Resume Analysis

The AI evaluates:

- Eligibility
- Skill alignment
- Missing requirements
- Resume quality
- Improvement opportunities

---

## 📊 Database Entities

Main entities used in the platform:

```text
Profiles
│
├── User Information
├── Social Links
└── Professional Details

Resumes
│
├── Generated Content
└── Template Data

Jobs
│
├── Job Details
├── Requirements
└── Recruiter Data

Applications
│
├── Candidate Data
└── Application Status
```

---

## 🎯 Use Cases

### Students

- Create first professional resume
- Analyze internship eligibility
- Discover entry-level opportunities

### Graduates

- Improve resume quality
- Match skills against industry requirements
- Apply to suitable roles

### Recruiters

- Manage job openings
- Review candidates efficiently
- Centralize hiring workflows

---

## 🔮 Future Enhancements

- Resume scoring dashboard
- AI interview preparation assistant
- Career pathway recommendations
- Skill-gap learning roadmap
- LinkedIn profile integration
- Job recommendation engine
- Application tracking analytics
- Resume version management

---

## 🏆 Research Relevance

This project explores concepts from:

- Artificial Intelligence
- Career Recommendation Systems
- Resume Intelligence
- Human Resource Technology
- Natural Language Processing
- Decision Support Systems

Potential applications include:

- Smart recruitment systems
- Automated resume evaluation
- Career guidance platforms
- Educational technology solutions

---

## 👨‍💻 Author

### Thanishka Yogesh
GitHub: https://github.com/thanishkaykb

Linkedin: https://www.linkedin.com/in/thanishka-yogesh/

Portfolio: https://portfolio-thanishka-yogesh.vercel.app/

---

## ⭐ Support

If you found this project useful, consider giving it a star.

Career Compass was built to simplify the journey from learning skills to landing opportunities.
