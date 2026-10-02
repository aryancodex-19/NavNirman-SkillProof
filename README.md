# 🚀 CareerOS - AI-Powered Career Platform

> One platform that takes a student from learning → building → applying → interviewing → getting hired.

---

## 📌 About

CareerOS is an all-in-one AI-powered career platform for students. Unlike other tools that solve just one problem, CareerOS combines **everything** a student needs to get hired.

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

### 6. 🎙️ AI Voice Mock Interview (NEW)
- **Real-time voice conversation** with AI interviewer
- **Speech-to-text** using Web Speech API
- **Dynamic questions** based on your profile (target role + skills)
- **AI evaluates** your answer immediately:
  - Technical Accuracy (0-100)
  - Communication Clarity (0-100)
  - Confidence Level (0-100)
- **Follow-up questions** based on your previous answers
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

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL (production) / SQLite (development) |
| **Authentication** | Clerk |
| **AI** | Groq (Llama 3.3 70B), Gemini 2.5 Flash |
| **Voice** | Web Speech API |
| **Deployment** | Vercel |

---

## 🏗️ AI Architecture

| Module | AI Provider |
|--------|-------------|
| Resume Builder (PDF Parse) | Gemini 2.5 Flash |
| ATS Scanner | Groq Llama 3.3 70B |
| Career Mentor | Groq Llama 3.3 70B |
| Internship Finder | Groq Llama 3.3 70B |
| Interview Coach | Groq Llama 3.3 70B |
| LinkedIn Optimizer | Groq Llama 3.3 70B |
| Portfolio Generator | Groq Llama 3.3 70B |
| **Voice Mock Interview** | **Groq Llama 3.3 70B** |
| Coding Tracker | No AI |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL or SQLite

### Installation

```bash
# Clone repository
git clone https://github.com/utkarshpan/careeros.git
cd careeros

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
