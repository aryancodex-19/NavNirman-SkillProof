import { type LucideIcon } from "lucide-react";

export interface ModuleItem {
  title: string;
  description: string;
  status: "active" | "coming-soon";
  iconName: string;
  href?: string;
}

export interface ProfileFormData {
  name: string;
  targetRole: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

export interface Education {
  school: string;
  degree: string;
  year: string;
  gpa?: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface ATSResult {
  score: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  suggestions: string[];
}
