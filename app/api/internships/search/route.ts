import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const maxDuration = 60;

const MOCK_INTERNSHIPS = [
  { id: "1", title: "Frontend Developer Intern", company: "Google", location: "Bangalore, India", type: "Onsite", stipend: "₹60,000/month", duration: "3 months", skills: ["React", "JavaScript", "TypeScript", "CSS"], description: "Work on Google's internal tools and consumer products using modern React.", applyUrl: "https://careers.google.com" },
  { id: "2", title: "Full Stack Developer Intern", company: "Microsoft", location: "Hyderabad, India", type: "Hybrid", stipend: "₹75,000/month", duration: "6 months", skills: ["Node.js", "React", "Azure", "TypeScript"], description: "Build scalable features for Microsoft 365 and Azure cloud platform.", applyUrl: "https://careers.microsoft.com" },
  { id: "3", title: "Backend Engineer Intern", company: "Flipkart", location: "Bangalore, India", type: "Onsite", stipend: "₹50,000/month", duration: "3 months", skills: ["Java", "Spring Boot", "MySQL", "Kafka"], description: "Design high-performance APIs handling millions of requests per day.", applyUrl: "https://www.flipkartcareers.com" },
  { id: "4", title: "Machine Learning Intern", company: "Amazon", location: "Remote", type: "Remote", stipend: "₹80,000/month", duration: "3 months", skills: ["Python", "TensorFlow", "PyTorch", "AWS"], description: "Research and implement ML models for Alexa and recommendation systems.", applyUrl: "https://amazon.jobs" },
  { id: "5", title: "React Native Developer Intern", company: "PhonePe", location: "Bangalore, India", type: "Hybrid", stipend: "₹45,000/month", duration: "6 months", skills: ["React Native", "JavaScript", "Redux", "Firebase"], description: "Build mobile payment features used by millions of Indians every day.", applyUrl: "https://phonepe.com/careers" },
  { id: "6", title: "DevOps Intern", company: "Razorpay", location: "Bangalore, India", type: "Hybrid", stipend: "₹40,000/month", duration: "3 months", skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"], description: "Automate deployment pipelines and maintain cloud infrastructure.", applyUrl: "https://razorpay.com/jobs" },
  { id: "7", title: "Data Science Intern", company: "Swiggy", location: "Bangalore, India", type: "Onsite", stipend: "₹55,000/month", duration: "3 months", skills: ["Python", "Pandas", "SQL", "Machine Learning"], description: "Analyze order data and build predictive models for delivery optimization.", applyUrl: "https://careers.swiggy.com" },
  { id: "8", title: "iOS Developer Intern", company: "Zomato", location: "Gurugram, India", type: "Hybrid", stipend: "₹50,000/month", duration: "3 months", skills: ["Swift", "iOS", "Xcode", "REST APIs"], description: "Build features for the Zomato iOS app used by 50M+ users monthly.", applyUrl: "https://www.zomato.com/careers" },
  { id: "9", title: "Software Engineering Intern", company: "Adobe", location: "Noida, India", type: "Onsite", stipend: "₹70,000/month", duration: "6 months", skills: ["C++", "JavaScript", "React", "Cloud"], description: "Contribute to Creative Cloud and Document Cloud products at scale.", applyUrl: "https://adobe.com/careers" },
  { id: "10", title: "Product Engineering Intern", company: "Freshworks", location: "Chennai, India", type: "Hybrid", stipend: "₹35,000/month", duration: "3 months", skills: ["Ruby on Rails", "React", "PostgreSQL", "Redis"], description: "Build CRM and helpdesk features for enterprise customers worldwide.", applyUrl: "https://www.freshworks.com/company/careers" },
];

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { skills, role, locationType } = await req.json();

    // Use Groq to score and filter the internships
    const prompt = `You are a job matching AI. Given a student's profile and a list of internships, score each internship from 0-100 based on skill match and role alignment.

Student Profile:
- Skills: ${skills || "Not specified"}
- Target Role: ${role || "Not specified"}
- Location Preference: ${locationType || "Any"}

Internships to score (by id):
${MOCK_INTERNSHIPS.map(j => `ID: ${j.id} | Title: ${j.title} | Company: ${j.company} | Required Skills: ${j.skills.join(", ")}`).join("\n")}

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {"id": "1", "matchScore": 85},
    {"id": "2", "matchScore": 72}
  ]
}

Score all ${MOCK_INTERNSHIPS.length} internships. Be strict but fair.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a job matching AI. Return only valid JSON objects. No markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch {}

    const scores: { id: string; matchScore: number }[] = parsed.matches || 
      (Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray) as any) || [];

    const scoreMap = new Map(scores.map((s: any) => [s.id, s.matchScore || 50]));

    const internships = MOCK_INTERNSHIPS
      .map(job => ({
        ...job,
        matchScore: scoreMap.get(job.id) ?? 50,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ internships });
  } catch (error: any) {
    console.error("Internship search error:", error);
    // Return mock data on error with default scores
    return NextResponse.json({
      internships: MOCK_INTERNSHIPS.map(j => ({ ...j, matchScore: Math.floor(Math.random() * 40) + 50 }))
        .sort((a, b) => b.matchScore - a.matchScore),
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ savedJobs: [] });

    const savedJobs = await (prisma as any).savedJob.findMany({ where: { userId: user.id }, orderBy: { savedAt: "desc" } });
    return NextResponse.json({ savedJobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
