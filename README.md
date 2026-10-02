# 🚀 SkillProof - Evidence-Based Skill Verification & Job Matching

> One platform that takes a student from learning → building → proving skills → applying → interviewing → getting hired.

---

## 📌 About

SkillProof is an evidence-based skill verification and job matching platform for students and early-career developers.

Instead of relying only on what a résumé claims, SkillProof connects résumé skill claims with publicly accessible GitHub evidence to provide a transparent assessment of how strongly those claims are supported.

The platform combines AI-powered résumé analysis, GitHub evidence analysis, job-description matching, skill-gap detection, interview preparation, and career development into one unified workspace.

---

## ✨ Features

### 1. 🤖 AI Resume Builder
- Upload PDF resume, AI parses and extracts all data
- AI rewrites bullet points for specific job roles
- Save multiple resume versions
- Export as PDF

### 2. 🔍 ATS Scanner
- AI-powered resume vs job description analysis
- Score out of 100 with visual gauge
- Shows matched keywords (green) & missing keywords (red)
- AI-generated improvement suggestions

### 3. 🧠 AI Career Mentor
- Chat-based career guidance
- Personalized learning roadmaps
- Course & project recommendations
- Knows your skills and target role

### 4. 💼 Internship Finder
- AI-ranked job listings with match scores
- Filter by role, location, remote/onsite
- Save jobs to wishlist

### 5. 🎤 AI Interview Coach
- Text mode & Voice mode (speech-to-text)
- Role-specific questions
- Real-time scores: Confidence, Clarity, Technical

### 6. 🎙️ AI Voice Mock Interview
- **Real-time voice conversation** with AI interviewer
- **Speech-to-text** using Web Speech API
- **Dynamic questions** based on your profile (target role + skills)
- **AI evaluates** your answer immediately:
  - Technical Accuracy (0-100)
  - Communication Clarity (0-100)
  - Confidence Level (0-100)
- **Follow-up questions** based on previous answers
- **Text input fallback** if microphone is not available
- **Final summary report** with:
  - Overall score
  - Top strengths
  - Areas to improve
  - Suggested topics to study
- **Interview history** saved to database
- **Beautiful chat interface** like ChatGPT/WhatsApp

### 7. 📊 Coding Tracker
- DSA topic mastery (Arrays, Trees, Graphs, DP)
- Streak counter & contest history
- Daily challenges

### 8. 💼 LinkedIn Optimizer
- AI headline generator
- About section rewrite
- Skill suggestions

### 9. 🌐 Portfolio Generator
- 3-5 design templates
- Auto-fill from resume data
- One-click deploy to Vercel

---

# 🛡️ SkillProof Core — Evidence-Based Skill Verification

SkillProof's core differentiator is its ability to compare **what a candidate claims** with **what their publicly accessible work actually demonstrates**.

Rather than rebuilding the entire platform, SkillProof extends the existing career workspace with a dedicated evidence-based assessment workflow.

### 10. 🔬 Evidence-Based Assessment

The user uploads a résumé, enters a GitHub username, and selects a target role.

SkillProof then:

- Extracts claimed skills from the résumé
- Analyzes accessible public GitHub repositories
- Inspects relevant repository evidence
- Connects evidence back to individual skill claims
- Generates an evidence-based assessment for each skill

**Priority:** P0 — Essential

---

### 11. 🏷️ Three Evidence-Based Skill Labels

Every assessed skill receives one of three evidence-based verdicts:

#### 🟢 Proven
Sufficiently strong and relevant evidence supports the specific claim.

#### 🟡 Partial
Evidence supports only part of the claim or the available evidence is incomplete.

#### ⚪ Claimed-only
The résumé claims the skill, but the available evidence does not substantiate it.

**Priority:** P0 — Essential

> These labels describe the strength of the available evidence. They do not claim that publicly visible repository activity conclusively proves overall mastery.

---

### 12. 🔗 Clickable Evidence for Every Verdict

SkillProof does not simply display a green badge, red badge, or numerical score.

Every skill result should explain **why** it received its verdict and provide links to relevant evidence such as:

- GitHub repositories
- Source files
- Dependency/configuration files
- Commits
- Tests
- Documentation
- Deployments
- Pull requests
- Other relevant public contribution evidence

The user can inspect the evidence behind a verdict instead of blindly trusting an AI-generated score.

**Priority:** P0 — Main Differentiator

---

### 13. 🎯 Job-Readiness Gap Report

SkillProof compares the skills required by a job description with the evidence found for the candidate.

The report identifies:

- ✅ Supported skills
- ⚠️ Skills with insufficient evidence
- ❌ Missing requirements
- 📊 Overall job-readiness match
- 🧩 Skill gaps
- 📝 A short actionable micro-task for each gap

Instead of simply telling a candidate what they are missing, SkillProof gives them a practical next step for improving that specific gap.

**Priority:** P0 — Required by the Problem Statement

---

# 🔎 Evidence Trail

SkillProof introduces an **Evidence Trail** for every assessed skill.

For example, if a résumé claims **Python**, the Evidence Trail could show:

### Evidence Found
A linked repository containing Python source files and tests.

### Evidence Strength
Partial or strong, based on the actual evidence inspected.

### What It Supports
Use of Python and the specific implementation observed in the repository.

### What It Does Not Prove
Independent mastery, professional production experience, or the ability to solve an unfamiliar problem.

SkillProof treats repository activity as **evidence, not conclusive proof of ability**.

A candidate should not be labelled **"Proven in Python"** simply because a repository contains Python files.

The strength of the verdict should depend on the relevance, depth and quality of the available evidence.

If time permits, SkillProof can also provide a short role-specific micro-task to directly test a claimed skill.

---

# ⚙️ SkillProof Workflow

<img width="1161" height="1355" alt="image" src="https://github.com/user-attachments/assets/8756bf78-b439-4157-a241-1bc9b2626f47" />


## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Shadcn/ui |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (production) / SQLite (development) |
| **Authentication** | Clerk |
| **AI** | Groq (`openai/gpt-oss-120b`), Gemini (`gemini-3.8-flash`) |
| **GitHub Integration** | GitHub API |
| **Voice** | Web Speech API |
| **Deployment** | Vercel |

---

## 🏗️ AI Architecture

| Module | AI / Processing |
|--------|-----------------|
| Resume Builder (PDF Parse) | Gemini (`gemini-3.8-flash`) |
| ATS Scanner | Groq (`openai/gpt-oss-120b`) |
| Career Mentor | Groq (`openai/gpt-oss-120b`) |
| Internship Finder | Groq (`openai/gpt-oss-120b`) |
| Interview Coach | Groq (`openai/gpt-oss-120b`) |
| LinkedIn Optimizer | Groq (`openai/gpt-oss-120b`) |
| Portfolio Generator | Groq (`openai/gpt-oss-120b`) |
| **Voice Mock Interview** | **Groq (`openai/gpt-oss-120b`) + Web Speech API** |
| **Evidence-Based Skill Assessment** | **Deterministic GitHub Evidence + AI Interpretation** |
| **Job-Readiness Gap Analysis** | **AI + Evidence-Based Skill Matching** |
| Coding Tracker | No AI |

> AI is used to interpret, normalize and explain retrieved evidence. Concrete GitHub evidence should come from actual publicly accessible project data wherever possible.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL or SQLite
- Git
- GitHub API configuration
- Clerk authentication configuration
- Groq API key
- Gemini API key

### Installation

```bash
# Clone repository
git clone https://github.com/aryancodex-19/NavNirman-SkillProof.git
cd NavNirman-SkillProof

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Generate Prisma Client
npx prisma generate

# Setup database
npx prisma db push

# Run development server
npm run dev
```

## 📸 Screenshots / Demo

<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/6f1f096d-7ca8-4359-aea1-497fbabbfa57" />
<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/f2fcd281-2b5a-4e55-a8ce-2f49f2ae7628" />

## 👥 Team Members

| # | Team Member |
|---|---|
| 1 | **Utkarsh Pandey** |
| 2 | **Aryan Pal** |
| 3 | **Shashank Sharma** |
| 4 | **Ravi Niranjan Sharma** |
